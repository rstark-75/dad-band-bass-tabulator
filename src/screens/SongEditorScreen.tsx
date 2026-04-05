import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionEditorCard } from '../components/SectionEditorCard';
import { SongMetaFields } from '../components/SongMetaFields';
import { TabPagePreview } from '../components/TabPagePreview';
import { palette } from '../constants/colors';
import { brandDisplayFontFamily } from '../constants/typography';
import { useSubscription, useUpgradePrompt } from '../features/subscription';
import { RootStackParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { Song, SongChart } from '../types/models';
import { formatUpdatedAt } from '../utils/date';
import { flattenSongRowsToChart, mergeChartIntoSongRows } from '../utils/songChart';
import { parseTab } from '../utils/tabLayout';
import { createBassTabApiFromEnv } from '../api';
import { usePublishedSongLookup } from '../hooks/usePublishedSongLookup';

type Props = NativeStackScreenProps<RootStackParamList, 'SongEditor'>;

type EditorMode = 'edit' | 'preview';
type SaveState = 'idle' | 'saving' | 'saved';

const cloneSong = (song: Song): Song => ({
  ...song,
  rows: song.rows.map((row) => ({
    ...row,
    bars: row.bars.map((bar) => ({
      cells: Object.fromEntries(
        Object.entries(bar.cells).map(([stringName, slots]) => [stringName, [...slots]]),
      ),
    })),
  })),
});

const serializeSongDraft = (song: Song): string =>
  JSON.stringify({
    title: song.title,
    artist: song.artist,
    key: song.key,
    tuning: song.tuning,
    feelNote: song.feelNote,
    stringNames: song.stringNames,
    rows: song.rows,
  });

export function SongEditorScreen({ navigation, route }: Props) {
  const { songId, isNew = false } = route.params;
  const { tier, capabilities } = useSubscription();
  const { showUpgradePrompt } = useUpgradePrompt();
  const { songs, updateSong } = useBassTab();
  const backendApi = useMemo(() => createBassTabApiFromEnv(), []);
  const { lookup: publishedLookup } = usePublishedSongLookup(backendApi);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [hasSavedOnce, setHasSavedOnce] = useState(!isNew);
  const [draftSong, setDraftSong] = useState<Song | null>(null);
  const [saveSignal, setSaveSignal] = useState(0);
  const baselineRef = useRef<string>('');
  const saveResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const song = songs.find((item) => item.id === songId);

  useEffect(() => {
    if (!song) {
      return;
    }

    const nextDraft = cloneSong(song);
    setDraftSong(nextDraft);
    baselineRef.current = serializeSongDraft(nextDraft);
    setSaveState('idle');
    setHasSavedOnce(!isNew);
  }, [isNew, song?.id]);

  useEffect(() => () => {
    if (saveResetTimerRef.current) {
      clearTimeout(saveResetTimerRef.current);
    }
  }, []);

  const editorSong = draftSong ?? null;

  const isDirty = editorSong
    ? serializeSongDraft(editorSong) !== baselineRef.current
    : false;
  const chart = useMemo(
    () => (editorSong ? flattenSongRowsToChart(editorSong) : null),
    [editorSong],
  );
  const parsedChart = useMemo(
    () => (chart ? parseTab(chart.tab) : null),
    [chart],
  );

  if (!song || !editorSong || !chart || !parsedChart) {
    return (
      <ScreenContainer contentStyle={styles.centered}>
        <EmptyState
          title="Song missing"
          description="This chart could not be found in the local store."
        />
      </ScreenContainer>
    );
  }

  const handleFieldChange = <K extends keyof Song>(field: K, value: Song[K]) => {
    setDraftSong((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
    setSaveState('idle');
  };

  const handleChartChange = (updates: Partial<SongChart>) => {
    setDraftSong((current) => {
      if (!current) {
        return current;
      }

      const baseChart = flattenSongRowsToChart(current);
      const mergedChart = {
        tab: updates.tab ?? baseChart.tab,
        rowAnnotations: updates.rowAnnotations ?? baseChart.rowAnnotations ?? [],
        rowBarCounts: updates.rowBarCounts ?? baseChart.rowBarCounts ?? [],
      };
      const parsed = parseTab(mergedChart.tab);
      const nextSongShape = mergeChartIntoSongRows(current, mergedChart);

      return {
        ...current,
        stringNames: parsed.stringNames.length > 0 ? parsed.stringNames : nextSongShape.stringNames,
        rows: nextSongShape.rows,
      };
    });
    setSaveState('idle');
  };

  const handleSave = () => {
    if (!editorSong) {
      return;
    }

    if (!isDirty && hasSavedOnce) {
      return;
    }

    setSaveSignal((current) => current + 1);
    setSaveState('saving');

    updateSong(editorSong.id, {
      title: editorSong.title,
      artist: editorSong.artist,
      key: editorSong.key,
      tuning: editorSong.tuning,
      feelNote: editorSong.feelNote,
      stringNames: editorSong.stringNames,
      rows: editorSong.rows,
    });

    baselineRef.current = serializeSongDraft(editorSong);
    setHasSavedOnce(true);
    setSaveState('saved');

    if (saveResetTimerRef.current) {
      clearTimeout(saveResetTimerRef.current);
    }

    saveResetTimerRef.current = setTimeout(() => {
      setSaveState('idle');
    }, 1400);
  };

  const handleOpenPerformance = () => {
    navigation.navigate('PerformanceView', { songId: editorSong.id });
  };

  const handleExportPdf = () => {
    if (tier !== 'PRO') {
      showUpgradePrompt('PDF_EXPORT');
      return;
    }

    navigation.navigate('ExportSong', { songId: editorSong.id });
  };

  const saveButtonLabel = !hasSavedOnce ? 'Create Song' : 'Save Changes';

  const lockMetadata = Boolean(publishedLookup[song.id]);

  const saveStateText =
    saveState === 'saving'
      ? 'Saving changes...'
      : saveState === 'saved'
        ? 'Saved'
        : isDirty
          ? 'Unsaved changes'
          : 'All changes saved';

  return (
    <ScreenContainer scroll={false} contentStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headingBlock}>
          <Text style={styles.title}>Song Builder</Text>
          <Text style={styles.subtitle}>
            Library to stage in one guided flow.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <PrimaryButton
            label="Back to Library"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Library' })}
            variant="ghost"
          />
          <PrimaryButton
            label="Open Performance View"
            onPress={handleOpenPerformance}
            variant="secondary"
          />
        </View>

        <View style={styles.modeSwitcher}>
          {(['edit', 'preview'] as EditorMode[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setMode(value)}
              style={[
                styles.modeOption,
                mode === value && styles.modeOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.modeLabel,
                  mode === value && styles.modeLabelActive,
                ]}
              >
                {value === 'edit' ? 'Edit' : 'Preview'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.editorScroll}
        contentContainerStyle={styles.editorScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 'edit' ? (
          <>
            <SongMetaFields song={editorSong} onFieldChange={handleFieldChange} compact lockMetadata={lockMetadata} />
            {lockMetadata ? (
              <Text style={styles.lockedMetaText}>
                Title, artist, key, and tuning are locked while this song is live in community. Release
                a new version to bump the metadata.
              </Text>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tab Editor</Text>
              <Text style={styles.sectionMeta}>
                Last updated {formatUpdatedAt(song.updatedAt)}
              </Text>
            </View>

            <SectionEditorCard
              key={chart.id}
              section={chart}
              index={0}
              isFirst
              isLast
              showSectionControls={false}
              saveSignal={saveSignal}
              onChange={handleChartChange}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              onDelete={() => {}}
            />

          </>
        ) : (
          <>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Performance Preview</Text>
              <Text style={styles.previewSubtitle}>
                Stage-focused view of your chart before rehearsal.
              </Text>
              <TabPagePreview
                stringNames={parsedChart.stringNames}
                bars={parsedChart.bars}
                rowAnnotations={chart.rowAnnotations}
                rowBarCounts={chart.rowBarCounts}
                renderMode={capabilities.svgEnabled ? 'svg' : 'ascii'}
              />
            </View>

            <View style={styles.previewActions}>
              <PrimaryButton
                label="Open Performance View"
                onPress={handleOpenPerformance}
                variant="secondary"
              />
              <View style={styles.exportActionRow}>
                <PrimaryButton
                  label="Export Print PDF"
                  onPress={handleExportPdf}
                  variant="ghost"
                />
                {tier !== 'PRO' ? (
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.saveDock}>
        <View style={styles.saveDockCopy}>
          <Text style={styles.saveDockTitle}>{saveStateText}</Text>
          <Text style={styles.saveDockSubtitle}>
            {isDirty
              ? 'Save now to lock this version in.'
              : 'Your latest edits are ready.'}
          </Text>
        </View>
        <PrimaryButton
          label={saveButtonLabel}
          onPress={handleSave}
          disabled={!isDirty && hasSavedOnce}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  screen: {
    flex: 1,
    gap: 12,
  },
  header: {
    gap: 10,
  },
  headingBlock: {
    gap: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: brandDisplayFontFamily,
    letterSpacing: 0.2,
    color: palette.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: palette.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignSelf: 'flex-start',
  },
  modeOption: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  modeOptionActive: {
    backgroundColor: palette.primaryMuted,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textMuted,
  },
  modeLabelActive: {
    color: palette.primary,
  },
  editorScroll: {
    flex: 1,
  },
  editorScrollContent: {
    gap: 14,
    paddingBottom: 20,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.text,
  },
  sectionMeta: {
    fontSize: 13,
    color: palette.textMuted,
  },
  lockedMetaText: {
    fontSize: 12,
    color: '#fbbf24',
    marginBottom: 6,
    marginHorizontal: 2,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 14,
    gap: 10,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.text,
  },
  previewSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
  },
  previewActions: {
    gap: 10,
  },
  exportActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#1e293b',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#bfdbfe',
  },
  saveDock: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 12,
    gap: 10,
  },
  saveDockCopy: {
    gap: 2,
  },
  saveDockTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  saveDockSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.textMuted,
  },
});
