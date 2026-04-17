import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { TabPagePreview, TabPreviewRenderMode } from '../components/TabPagePreview';
import { palette } from '../constants/colors';
import { useSubscription } from '../features/subscription';
import { RootStackParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { Song, SongRow } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'SetlistPerformance'>;
type PerformanceTone = 'light' | 'dark';
const FREE_SVG_ROW_LIMIT = 2;

interface PerformanceItem {
  song: Song;
  stringNames: string[];
  rows: SongRow[];
}

function getFreeSvgPerformanceItem(
  item: PerformanceItem,
): {
  rows: SongRow[];
  isTruncated: boolean;
} {
  const isTruncated = item.rows.length > FREE_SVG_ROW_LIMIT;

  if (!isTruncated) {
    return {
      rows: item.rows,
      isTruncated: false,
    };
  }

  return {
    rows: item.rows.slice(0, FREE_SVG_ROW_LIMIT),
    isTruncated: true,
  };
}

export function SetlistPerformanceScreen({ route, navigation }: Props) {
  const { setlistId, startSongId } = route.params ?? {};
  const { capabilities, tier } = useSubscription();
  const { width } = useWindowDimensions();
  const { songs, setlists, activeSetlistId } = useBassTab();
  const [renderMode, setRenderMode] = useState<TabPreviewRenderMode>('ascii');
  const [tone, setTone] = useState<PerformanceTone>('light');
  const hasAutoSelectedSvgModeRef = useRef(false);
  const [songIndex, setSongIndex] = useState(0);
  const appliedStartSongIdRef = useRef<string | null>(null);

  const selectedSetlist =
    setlists.find((item) => item.id === setlistId) ??
    setlists.find((item) => item.id === activeSetlistId) ??
    setlists[0];

  const orderedSongs = useMemo(
    () =>
      (selectedSetlist?.songIds ?? [])
        .map((songId) => songs.find((song) => song.id === songId))
        .filter(Boolean) as Song[],
    [selectedSetlist?.songIds, songs],
  );

  const performanceItems = useMemo<PerformanceItem[]>(() => {
    return orderedSongs.map((song) => {
      return {
        song,
        stringNames: song.stringNames,
        rows: song.rows,
      };
    });
  }, [orderedSongs]);

  useEffect(() => {
    if (!startSongId || performanceItems.length === 0) {
      return;
    }

    if (appliedStartSongIdRef.current === startSongId) {
      return;
    }

    const nextSongIndex = performanceItems.findIndex((item) => item.song.id === startSongId);
    if (nextSongIndex >= 0 && nextSongIndex !== songIndex) {
      setSongIndex(nextSongIndex);
    }
    appliedStartSongIdRef.current = startSongId;
  }, [performanceItems, songIndex, startSongId]);

  useEffect(() => {
    if (performanceItems.length === 0) {
      if (songIndex !== 0) {
        setSongIndex(0);
      }
      return;
    }

    if (songIndex > performanceItems.length - 1) {
      setSongIndex(performanceItems.length - 1);
    }
  }, [performanceItems.length, songIndex]);

  const safeSongIndex =
    performanceItems.length === 0
      ? 0
      : Math.min(songIndex, performanceItems.length - 1);
  const currentItem = performanceItems[safeSongIndex];
  const totalSongs = performanceItems.length;

  const isPhone = width < 760;
  const useCompactPreview = width < 960;
  const horizontalPadding = isPhone ? 12 : 20;
  const availableCanvasWidth = Math.max(320, width - horizontalPadding * 2);
  const canvasWidth = isPhone
    ? Math.max(620, availableCanvasWidth)
    : Math.min(Math.max(720, availableCanvasWidth), 980);
  const canvasHorizontalPadding = isPhone ? 14 : 24;
  const svgViewportWidth = Math.max(240, canvasWidth - canvasHorizontalPadding * 2);

  const handleRenderModeChange = (mode: TabPreviewRenderMode) => {
    setRenderMode(mode);
  };
  const handleToneChange = (nextTone: PerformanceTone) => {
    setTone(nextTone);
  };

  useEffect(() => {
    if (hasAutoSelectedSvgModeRef.current) {
      return;
    }

    if (!capabilities.svgEnabled) {
      return;
    }

    hasAutoSelectedSvgModeRef.current = true;
    setRenderMode('svg');
  }, [capabilities.svgEnabled]);

  const handleNextSong = () => {
    if (safeSongIndex >= totalSongs - 1) {
      return;
    }

    setSongIndex(safeSongIndex + 1);
  };

  const handlePrevSong = () => {
    if (safeSongIndex <= 0) {
      return;
    }

    setSongIndex(safeSongIndex - 1);
  };

  if (!selectedSetlist || performanceItems.length === 0 || !currentItem) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.songTitle}>Setlist is empty</Text>
          <Text style={styles.emptyText}>
            Add songs to a setlist first, then use Play Setlist.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, isPhone && styles.headerNarrow]}>
        <Text style={[styles.setlistTitle, isPhone && styles.setlistTitleNarrow]}>
          {selectedSetlist.name}
        </Text>
        <View style={styles.titleRow}>
          <Text style={[styles.songTitle, isPhone && styles.songTitleNarrow]} numberOfLines={1}>
            {currentItem.song.title}
          </Text>
          <View style={styles.titleControls}>
            <View style={styles.renderModeSelector}>
              {(['ascii', 'svg'] as TabPreviewRenderMode[]).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => handleRenderModeChange(mode)}
                  style={[
                    styles.renderModeOption,
                    renderMode === mode && styles.renderModeOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.renderModeOptionText,
                      renderMode === mode && styles.renderModeOptionTextActive,
                    ]}
                  >
                    {mode.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.renderModeSelector}>
              {(['light', 'dark'] as PerformanceTone[]).map((value) => (
                <Pressable
                  key={value}
                  onPress={() => handleToneChange(value)}
                  style={[
                    styles.renderModeOption,
                    styles.toneModeOption,
                    tone === value && styles.renderModeOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.renderModeOptionText,
                      tone === value && styles.renderModeOptionTextActive,
                    ]}
                  >
                    {isPhone ? (value === 'light' ? 'LT' : 'DK') : value.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <Text style={[styles.subtitle, isPhone && styles.subtitleNarrow]}>
          {currentItem.song.artist} • {currentItem.song.key} • {currentItem.song.tuning}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, isPhone && styles.contentContainerNarrow]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageSheet, isPhone && styles.pageSheetPhone]}>
          <View
            style={[
              styles.pageMeta,
              isPhone ? styles.pageMetaPhone : { width: Math.min(canvasWidth, availableCanvasWidth) },
            ]}
          >
            <Text style={styles.pageSubheading}>
              Song {safeSongIndex + 1}/{totalSongs}
            </Text>
          </View>

          {(() => {
            const isFreeSvgMode = tier !== 'PRO' && renderMode === 'svg';
            const freeSvgItem = isFreeSvgMode ? getFreeSvgPerformanceItem(currentItem) : null;
            const displayRows = freeSvgItem ? freeSvgItem.rows : currentItem.rows;
            const showFreeSvgUpsell = Boolean(freeSvgItem?.isTruncated);

            return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={isPhone}
            contentContainerStyle={[styles.canvasScroller, isPhone && styles.canvasScrollerPhone]}
          >
            <View
              style={[
                styles.pageCanvas,
                isPhone && styles.pageCanvasNarrow,
                tone === 'light' ? styles.pageCanvasLight : styles.pageCanvasDark,
                { width: canvasWidth, maxWidth: canvasWidth },
              ]}
            >
              <TabPagePreview
                stringNames={currentItem.stringNames}
                songRows={displayRows}
                tone={tone}
                compact={useCompactPreview}
                renderMode={renderMode}
                svgScaleProfile="performance"
                svgViewportWidth={svgViewportWidth}
              />
              {showFreeSvgUpsell ? (
                <View style={styles.freeSvgUpsellWrap}>
                  <Text style={styles.freeSvgUpsellText}>
                    Showing first 2 rows only in SVG on Free.
                  </Text>
                  <Pressable onPress={() => navigation.navigate('Upgrade')}>
                    <Text style={styles.freeSvgUpsellLink}>
                      Go Pro for full chart preview.
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </ScrollView>
            );
          })()}

          <View style={[styles.controlsCard, isPhone && styles.controlsCardPhone]}>
            <View style={styles.controlsRow}>
              <PrimaryButton
                label="Prev Song"
                onPress={handlePrevSong}
                variant="ghost"
                size="compact"
                disabled={safeSongIndex === 0}
              />
              <PrimaryButton
                label="Next Song"
                onPress={handleNextSong}
                variant="secondary"
                size="compact"
                disabled={safeSongIndex >= totalSongs - 1}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.liveBackground,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 4,
    gap: 1,
  },
  headerNarrow: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  setlistTitle: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: palette.liveAccent,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  setlistTitleNarrow: {
    fontSize: 11,
    lineHeight: 14,
  },
  songTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.liveText,
    flex: 1,
    minWidth: 0,
  },
  songTitleNarrow: {
    fontSize: 21,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: palette.liveMuted,
  },
  subtitleNarrow: {
    fontSize: 12,
    lineHeight: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  contentContainerNarrow: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  pageSheet: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  pageSheetPhone: {
    alignItems: 'stretch',
  },
  pageMeta: {
    maxWidth: '100%',
    gap: 4,
  },
  pageMetaPhone: {
    width: '100%',
  },
  pageSubheading: {
    fontSize: 13,
    color: palette.liveMuted,
  },
  renderModeControl: {
    gap: 4,
    marginTop: 4,
  },
  renderModeSelector: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
  },
  titleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  renderModeOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
  },
  renderModeOptionActive: {
    borderColor: '#93c5fd',
    backgroundColor: '#1e293b',
  },
  renderModeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  renderModeOptionTextActive: {
    color: '#dbeafe',
  },
  toneModeOption: {
    minWidth: 34,
    alignItems: 'center',
  },
  canvasScroller: {
    minWidth: '100%',
    justifyContent: 'center',
  },
  canvasScrollerPhone: {
    justifyContent: 'flex-start',
  },
  freeSvgUpsellWrap: {
    marginTop: 10,
    gap: 2,
  },
  freeSvgUpsellText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: palette.liveMuted,
  },
  freeSvgUpsellLink: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: palette.accent,
    textDecorationLine: 'underline',
  },
  pageCanvas: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
  },
  pageCanvasDark: {
    backgroundColor: '#0b1120',
    borderColor: '#1f2937',
  },
  pageCanvasLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  pageCanvasNarrow: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  controlsCard: {
    width: '100%',
    maxWidth: 980,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    padding: 10,
    gap: 8,
  },
  controlsCardPhone: {
    padding: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    lineHeight: 26,
    color: palette.liveText,
    textAlign: 'center',
  },
});
