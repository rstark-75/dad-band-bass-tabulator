import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabPagePreview } from '../components/TabPagePreview';
import { palette } from '../constants/colors';
import { RootStackParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { flattenSongRowsToChart } from '../utils/songChart';
import { parseTab } from '../utils/tabLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'PerformanceView'>;

export function LiveViewScreen({ route }: Props) {
  const { songId } = route.params;
  const { songs } = useBassTab();
  const { width } = useWindowDimensions();
  const isNarrow = width < 760;
  const song = songs.find((item) => item.id === songId);
  const chart = useMemo(
    () => (song ? flattenSongRowsToChart(song) : undefined),
    [song],
  );
  const tabPreview = useMemo(() => {
    if (!chart) {
      return null;
    }

    const { stringNames, bars } = parseTab(chart.tab);

    return (
      <TabPagePreview
        stringNames={stringNames}
        bars={bars}
        rowAnnotations={chart.rowAnnotations ?? []}
        rowBarCounts={chart.rowBarCounts}
        tone="dark"
        compact={isNarrow}
      />
    );
  }, [chart, isNarrow]);

  if (!song || !chart) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.songTitle}>Song unavailable</Text>
          <Text style={styles.emptyText}>
            The requested chart is not in the local session.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, isNarrow && styles.headerNarrow]}>
        <Text style={[styles.songTitle, isNarrow && styles.songTitleNarrow]}>{song.title}</Text>
        <Text style={[styles.subtitle, isNarrow && styles.subtitleNarrow]}>
          {song.artist} • {song.key} • {song.tuning}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, isNarrow && styles.contentContainerNarrow]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageSheet}>
          <View style={styles.pageMeta}>
            <Text style={styles.pageHeading}>Performance Chart</Text>
            <Text style={styles.pageSubheading}>
              {isNarrow ? 'Scroll sideways for the full chart' : 'Full song, A4 reading layout'}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.canvasScroller}
          >
            <View style={[styles.pageCanvas, isNarrow && styles.pageCanvasNarrow]}>{tabPreview}</View>
          </ScrollView>
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
    paddingTop: 12,
    paddingBottom: 16,
    gap: 4,
  },
  headerNarrow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  songTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.liveText,
  },
  songTitleNarrow: {
    fontSize: 26,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.liveMuted,
  },
  subtitleNarrow: {
    fontSize: 14,
    lineHeight: 20,
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
    gap: 12,
  },
  pageMeta: {
    width: '100%',
    maxWidth: 720,
    gap: 4,
  },
  pageHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.liveAccent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pageSubheading: {
    fontSize: 14,
    color: palette.liveMuted,
  },
  pageCanvas: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: '#0b1120',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  pageCanvasNarrow: {
    width: undefined,
    minWidth: 620,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  canvasScroller: {
    width: '100%',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 22,
    lineHeight: 32,
    color: palette.liveText,
    textAlign: 'center',
  },
});
