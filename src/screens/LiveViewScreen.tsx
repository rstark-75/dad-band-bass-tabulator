import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabPagePreview, TabPreviewRenderMode } from '../components/TabPagePreview';
import { palette } from '../constants/colors';
import { useSubscription } from '../features/subscription';
import { RootStackParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { flattenSongRowsToChart } from '../utils/songChart';
import { parseTab } from '../utils/tabLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'PerformanceView'>;
type PerformanceTone = 'light' | 'dark';
const FREE_SVG_ROW_LIMIT = 2;
const DEFAULT_BARS_PER_ROW = 4;

function resolvePreviewRowCounts(rowBarCounts: number[] | undefined, totalBars: number): number[] {
  if (rowBarCounts && rowBarCounts.length > 0) {
    return rowBarCounts.filter((count) => count > 0);
  }

  return Array.from(
    { length: Math.max(1, Math.ceil(totalBars / DEFAULT_BARS_PER_ROW)) },
    () => DEFAULT_BARS_PER_ROW,
  );
}

function getFreeSvgPreviewData(
  input: {
    bars: ReturnType<typeof parseTab>['bars'];
    rowAnnotations: ReturnType<typeof flattenSongRowsToChart>['rowAnnotations'];
    rowBarCounts: ReturnType<typeof flattenSongRowsToChart>['rowBarCounts'];
  },
): {
  bars: ReturnType<typeof parseTab>['bars'];
  rowAnnotations: ReturnType<typeof flattenSongRowsToChart>['rowAnnotations'];
  rowBarCounts: number[];
  isTruncated: boolean;
} {
  const resolvedCounts = resolvePreviewRowCounts(input.rowBarCounts, input.bars.length);
  const isTruncated = resolvedCounts.length > FREE_SVG_ROW_LIMIT;

  if (!isTruncated) {
    return {
      bars: input.bars,
      rowAnnotations: input.rowAnnotations,
      rowBarCounts: resolvedCounts,
      isTruncated: false,
    };
  }

  const limitedCounts = resolvedCounts.slice(0, FREE_SVG_ROW_LIMIT);
  const shownBarCount = limitedCounts.reduce((sum, count) => sum + count, 0);

  return {
    bars: input.bars.slice(0, shownBarCount),
    rowAnnotations: input.rowAnnotations.slice(0, limitedCounts.length),
    rowBarCounts: limitedCounts,
    isTruncated: true,
  };
}

export function LiveViewScreen({ route, navigation }: Props) {
  const { songId } = route.params;
  const { capabilities, tier } = useSubscription();
  const { songs } = useBassTab();
  const [renderMode, setRenderMode] = useState<TabPreviewRenderMode>('ascii');
  const [tone, setTone] = useState<PerformanceTone>('light');
  const hasAutoSelectedSvgModeRef = useRef(false);
  const { width } = useWindowDimensions();
  const isPhone = width < 760;
  const isTablet = width >= 760 && width < 1100;
  const useCompactPreview = width < 960;
  const horizontalPadding = isPhone ? 12 : 20;
  const availableCanvasWidth = Math.max(320, width - horizontalPadding * 2);
  const canvasWidth = isPhone
    ? Math.max(620, availableCanvasWidth)
    : Math.min(Math.max(720, availableCanvasWidth), 980);
  const canvasHorizontalPadding = isPhone ? 16 : 24;
  const svgViewportWidth = Math.max(240, canvasWidth - canvasHorizontalPadding * 2);
  const song = songs.find((item) => item.id === songId);
  const chart = useMemo(
    () => (song ? flattenSongRowsToChart(song) : undefined),
    [song],
  );
  const previewData = useMemo(() => {
    if (!chart) {
      return null;
    }

    const { stringNames, bars } = parseTab(chart.tab);
    const freeSvgPreview = getFreeSvgPreviewData({
      bars,
      rowAnnotations: chart.rowAnnotations ?? [],
      rowBarCounts: chart.rowBarCounts,
    });
    const isFreeSvgMode = tier !== 'PRO' && renderMode === 'svg';
    const displayData = isFreeSvgMode
      ? {
        bars: freeSvgPreview.bars,
        rowAnnotations: freeSvgPreview.rowAnnotations,
        rowBarCounts: freeSvgPreview.rowBarCounts,
      }
      : {
        bars,
        rowAnnotations: chart.rowAnnotations ?? [],
        rowBarCounts: chart.rowBarCounts,
      };

    return {
      stringNames,
      ...displayData,
      showFreeSvgUpsell: isFreeSvgMode && freeSvgPreview.isTruncated,
    };
  }, [chart, renderMode, tier]);

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

  const handleRenderModeChange = (mode: TabPreviewRenderMode) => {
    setRenderMode(mode);
  };
  const handleToneChange = (nextTone: PerformanceTone) => {
    setTone(nextTone);
  };

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
      <View style={[styles.header, isPhone && styles.headerNarrow]}>
        <View style={styles.titleRow}>
          <Text style={[styles.songTitle, isPhone && styles.songTitleNarrow]} numberOfLines={1}>
            {song.title}
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
          {song.artist} • {song.key} • {song.tuning}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, isPhone && styles.contentContainerNarrow]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageSheet, isPhone && styles.pageSheetPhone]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={isPhone || isTablet}
            contentContainerStyle={[
              styles.canvasScroller,
              isPhone && styles.canvasScrollerPhone,
              !isPhone && styles.canvasScrollerWide,
            ]}
          >
            <View
              style={[
                styles.pageCanvas,
                isPhone && styles.pageCanvasNarrow,
                tone === 'light' ? styles.pageCanvasLight : styles.pageCanvasDark,
                { width: canvasWidth, maxWidth: canvasWidth },
              ]}
            >
              {previewData ? (
                <>
                  <TabPagePreview
                    stringNames={previewData.stringNames}
                    bars={previewData.bars}
                    rowAnnotations={previewData.rowAnnotations}
                    rowBarCounts={previewData.rowBarCounts}
                    tone={tone}
                    compact={useCompactPreview}
                    renderMode={renderMode}
                    svgScaleProfile="performance"
                    svgViewportWidth={svgViewportWidth}
                  />
                  {previewData.showFreeSvgUpsell ? (
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
                </>
              ) : null}
            </View>
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
    paddingTop: 0,
    paddingBottom: 4,
    gap: 1,
  },
  headerNarrow: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  songTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.liveText,
    flex: 1,
    minWidth: 0,
  },
  songTitleNarrow: {
    fontSize: 24,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: palette.liveMuted,
  },
  subtitleNarrow: {
    fontSize: 13,
    lineHeight: 18,
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  canvasScroller: {
    minWidth: '100%',
  },
  canvasScrollerPhone: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  canvasScrollerWide: {
    justifyContent: 'center',
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
