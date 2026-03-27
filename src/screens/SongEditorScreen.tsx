import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionEditorCard } from '../components/SectionEditorCard';
import { SongMetaFields } from '../components/SongMetaFields';
import { palette } from '../constants/colors';
import { RootStackParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { Song } from '../types/models';
import { formatUpdatedAt } from '../utils/date';
import { flattenSectionsToChart, mergeChartIntoSections } from '../utils/songChart';

type Props = NativeStackScreenProps<RootStackParamList, 'SongEditor'>;

export function SongEditorScreen({ navigation, route }: Props) {
  const { songId } = route.params;
  const { songs, updateSong } = useBassTab();

  const song = songs.find((item) => item.id === songId);

  if (!song) {
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
    updateSong(song.id, { [field]: value } as Partial<Song>);
  };

  const chart = flattenSectionsToChart(song.sections);

  const handleChartChange = (updates: Partial<typeof chart>) => {
    updateSong(song.id, {
      sections: mergeChartIntoSections(song.sections, {
        tab: updates.tab ?? chart.tab,
        rowAnnotations: updates.rowAnnotations ?? chart.rowAnnotations ?? [],
      }),
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headingBlock}>
          <Text style={styles.title}>Song Editor</Text>
          <Text style={styles.subtitle}>
            Autosaves straight into the local mock store.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <PrimaryButton
            label="Open Performance View"
            onPress={() => navigation.navigate('PerformanceView', { songId: song.id })}
            variant="secondary"
          />
          <PrimaryButton
            label="Export Song PDF"
            onPress={() => navigation.navigate('ExportSong', { songId: song.id })}
            variant="ghost"
          />
        </View>
      </View>

      <SongMetaFields song={song} onFieldChange={handleFieldChange} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Tab</Text>
          <Text style={styles.sectionSubtitle}>
            Last updated {formatUpdatedAt(song.updatedAt)}
          </Text>
        </View>
      </View>

      <SectionEditorCard
        key={chart.id}
        section={chart}
        index={0}
        isFirst
        isLast
        showSectionControls={false}
        onChange={handleChartChange}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onDelete={() => {}}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    gap: 16,
  },
  headingBlock: {
    gap: 6,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: palette.textMuted,
    marginTop: 4,
  },
});
