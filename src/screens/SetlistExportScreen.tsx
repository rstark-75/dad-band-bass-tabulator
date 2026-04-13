import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createBassTabApiFromEnv } from '../api';
import { PrimaryButton } from '../components/PrimaryButton';
import { TabPagePreview, TabPreviewRenderMode } from '../components/TabPagePreview';
import { palette } from '../constants/colors';
import { brandDisplayFontFamily } from '../constants/typography';
import { resolveUpgradeTrigger, useSubscription, useUpgradePrompt } from '../features/subscription';
import { RootStackParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { Song } from '../types/models';
import { flattenSongRowsToChart } from '../utils/songChart';
import { parseTab } from '../utils/tabLayout';
import { useWebPrintStyles } from '../utils/useWebPrintStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'ExportSetlist'>;

const printCss = `
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  @media print {
    html, body {
      background: white !important;
    }

    body * {
      visibility: hidden !important;
    }

    #setlist-export-print-root,
    #setlist-export-print-root * {
      visibility: visible !important;
    }

    #setlist-export-print-root {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    #setlist-export-print-root [id^="setlist-export-page-"] {
      break-after: page;
      page-break-after: always;
      margin: 0 0 8mm 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    #setlist-export-print-root [id^="setlist-export-page-"]:last-child {
      break-after: auto;
      page-break-after: auto;
      margin-bottom: 0 !important;
    }
  }
`;

export function SetlistExportScreen({ navigation }: Props) {
  const { tier, capabilities } = useSubscription();
  const { showUpgradePrompt } = useUpgradePrompt();
  const backendApi = useMemo(() => createBassTabApiFromEnv(), []);
  const { songs, setlist } = useBassTab();
  const [isCheckingPdfAccess, setIsCheckingPdfAccess] = useState(Boolean(backendApi));
  const [isPdfLocked, setIsPdfLocked] = useState(tier === 'FREE');
  const [renderMode, setRenderMode] = useState<TabPreviewRenderMode>(
    capabilities.svgEnabled ? 'svg' : 'ascii',
  );
  useWebPrintStyles('setlist-export-print-styles', printCss);
  const orderedSongs = setlist.songIds
    .map((songId) => songs.find((song) => song.id === songId))
    .filter(Boolean) as Song[];
  const firstSongId = orderedSongs[0]?.id;
  const firstSongStringCount = orderedSongs[0]?.stringCount ?? 4;

  useEffect(() => {
    if (!capabilities.svgEnabled && renderMode === 'svg') {
      setRenderMode('ascii');
    }
  }, [capabilities.svgEnabled, renderMode]);

  useEffect(() => {
    let isMounted = true;

    const checkPdfAccess = async () => {
      if (!firstSongId) {
        if (isMounted) {
          setIsCheckingPdfAccess(false);
        }
        return;
      }

      if (!backendApi) {
        if (isMounted) {
          setIsPdfLocked(tier === 'FREE');
          setIsCheckingPdfAccess(false);
        }
        return;
      }

      if (isMounted) {
        setIsCheckingPdfAccess(true);
      }

      try {
        await backendApi.getSong(firstSongId, { mode: 'PDF' });

        if (isMounted) {
          setIsPdfLocked(false);
        }
      } catch (error) {
        const trigger = resolveUpgradeTrigger(error);

        if (isMounted) {
          if (trigger === 'PDF_EXPORT') {
            setIsPdfLocked(true);
          } else {
            console.warn('Setlist PDF export access check failed; falling back to local tier gate.', error);
            setIsPdfLocked(tier === 'FREE');
          }
        }
      } finally {
        if (isMounted) {
          setIsCheckingPdfAccess(false);
        }
      }
    };

    void checkPdfAccess();

    return () => {
      isMounted = false;
    };
  }, [backendApi, firstSongId, tier]);

  if (orderedSongs.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Setlist is empty</Text>
          <Text style={styles.emptyText}>
            Add songs to the setlist before exporting a combined PDF.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isCheckingPdfAccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.lockedCard}>
            <Text style={styles.lockedEyebrow}>Checking Access</Text>
            <Text style={styles.lockedTitle}>Checking PDF export permission…</Text>
            <Text style={styles.lockedSubtitle}>
              One moment while we validate your export access.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isPdfLocked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.lockedCard}>
            <Text style={styles.lockedEyebrow}>Pro Export</Text>
            <Text style={styles.lockedTitle}>Setlist PDF export is a Pro feature</Text>
            <Text style={styles.lockedSubtitle}>
              No Internet at GIG - then export your tabs to your device.
            </Text>

            <View style={styles.teaserCard}>
              <Text style={styles.teaserTitle}>{setlist.name}</Text>
              <Text style={styles.teaserMeta}>
                {orderedSongs.length} song{orderedSongs.length === 1 ? '' : 's'} ready
              </Text>
              <Text style={styles.lockedStringInfo}>
                Strings: {firstSongStringCount}. Upgrade for 5 string stage-ready tabs.
              </Text>
              <Text style={styles.teaserLabel}>Limited display</Text>
              {orderedSongs.slice(0, 4).map((song, index) => (
                <Text key={song.id} style={styles.teaserItem}>
                  {index + 1}. {song.title}
                </Text>
              ))}
            </View>

            <View style={styles.lockedActions}>
              <PrimaryButton
                label="Go Pro for PDF Export"
                onPress={() => showUpgradePrompt('PDF_EXPORT')}
              />
              <PrimaryButton
                label="Maybe Later"
                onPress={() => navigation.goBack()}
                variant="ghost"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleRenderModeChange = (mode: TabPreviewRenderMode) => {
    if (mode === 'svg' && !capabilities.svgEnabled) {
      showUpgradePrompt('SVG_MODE');
      return;
    }

    setRenderMode(mode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toolbar}>
          <View style={styles.toolbarCopy}>
            <Text style={styles.toolbarTitle}>Dad Band Bass Export Setlist</Text>
            <Text style={styles.toolbarSubtitle}>
              Heading to a no-signal venue? Save the full set as a PDF and keep it on your device.
            </Text>
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
                    {mode === 'svg' && !capabilities.svgEnabled ? 'SVG PRO' : mode.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {Platform.OS === 'web' ? (
            <Pressable
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.print();
                }
              }}
              style={({ pressed }) => [styles.printButton, pressed && styles.pressed]}
            >
              <Text style={styles.printButtonLabel}>Print / Save PDF</Text>
            </Pressable>
          ) : null}
        </View>

        <View nativeID="setlist-export-print-root" style={styles.printRoot}>
          <View style={styles.setlistBanner}>
            <Text style={styles.setlistTitle}>{setlist.name}</Text>
            <Text style={styles.setlistSubtitle}>
              {orderedSongs.length} song{orderedSongs.length === 1 ? '' : 's'} in performance order, ready for an offline backup
            </Text>
          </View>

          {orderedSongs.map((song, index) => {
            const chart = flattenSongRowsToChart(song);
            const { stringNames, bars } = parseTab(chart.tab);

            return (
              <View
                nativeID={`setlist-export-page-${index}`}
                key={song.id}
                style={[
                  styles.pageSheet,
                  index < orderedSongs.length - 1 && styles.pageBreakSheet,
                ]}
              >
                <View style={styles.pageHeader}>
                  <View style={styles.pageTitleRow}>
                    <View style={styles.pageTitleBlock}>
                      <View style={styles.songTitleRow}>
                        <Text style={styles.songTitle}>{song.title}</Text>
                        <Text style={styles.songInlineMeta}>{song.artist} • {song.key} • {song.tuning}</Text>
                      </View>
                    </View>
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderText}>{index + 1}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.chartBody}>
                  <TabPagePreview
                    stringNames={stringNames}
                    bars={bars}
                    rowAnnotations={chart.rowAnnotations ?? []}
                    rowBarCounts={chart.rowBarCounts}
                    tone="light"
                    compact
                    renderMode={renderMode}
                    svgScaleProfile="standard"
                  />
                </View>
                <Text style={styles.exportCredit}>created by Dad Band Bass - www.domainhere</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ece7df',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 10,
  },
  toolbar: {
    width: '100%',
    maxWidth: 820,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  toolbarCopy: {
    flex: 1,
    gap: 4,
  },
  renderModeSelector: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 6,
  },
  renderModeOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#94a3b8',
    backgroundColor: '#f8fafc',
  },
  renderModeOptionActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#dbeafe',
  },
  renderModeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  renderModeOptionTextActive: {
    color: '#1e3a8a',
  },
  toolbarTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: brandDisplayFontFamily,
    letterSpacing: 0.2,
    color: '#111827',
  },
  toolbarSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  printButton: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printButtonLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  setlistBanner: {
    width: '100%',
    maxWidth: 820,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    gap: 4,
  },
  printRoot: {
    width: '100%',
    maxWidth: 820,
    gap: 10,
  },
  setlistTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: brandDisplayFontFamily,
    letterSpacing: 0.2,
    color: '#111827',
  },
  setlistSubtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  pageSheet: {
    width: '100%',
    maxWidth: 820,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    gap: 14,
  },
  pageBreakSheet: {
    marginBottom: 16,
  },
  pageHeader: {
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
    paddingBottom: 12,
  },
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  pageTitleBlock: {
    flex: 1,
    gap: 4,
  },
  songTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  songInlineMeta: {
    fontSize: 14,
    color: '#4b5563',
  },
  orderBadge: {
    minWidth: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  chartBody: {
    gap: 12,
  },
  exportCredit: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
  lockedCard: {
    width: '100%',
    maxWidth: 820,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#0b0b0f',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 12,
  },
  lockedEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: '#f59e0b',
  },
  lockedTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#f8fafc',
  },
  lockedSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#cbd5e1',
  },
  lockedStringInfo: {
    fontSize: 13,
    color: '#fbbf24',
  },
  teaserCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 14,
    gap: 6,
  },
  teaserTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  teaserMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  teaserLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: '#f59e0b',
  },
  teaserItem: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
  },
  lockedActions: {
    gap: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
});
