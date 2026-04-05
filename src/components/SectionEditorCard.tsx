import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
  useWindowDimensions,
} from 'react-native';

import { palette } from '../constants/colors';
import { SongChart, TabRowAnnotation } from '../types/models';
import { normalizeRowBarCounts } from '../utils/songChart';
import {
  insertBar,
  parseTab,
  ParsedBar,
  removeBar,
  renderTab,
  updateBarCell,
} from '../utils/tabLayout';
import { useSubscription, useUpgradePrompt } from '../features/subscription';
import { PrimaryButton } from './PrimaryButton';
import { TabPagePreview, TabPreviewRenderMode } from './TabPagePreview';

interface SectionEditorCardProps {
  section: SongChart;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  showSectionControls?: boolean;
  saveSignal?: number;
  onChange: (updates: Partial<SongChart>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

const beatLabels = ['1', '&', '2', '&', '3', '&', '4', '&'];
const mobileBeatLabels = ['1', '1&', '2', '2&', '3', '3&', '4', '4&'];
const barsPerRow = 4;
const baseFretOptions = Array.from({ length: 12 }, (_value, index) => String(index + 1));
const extendedFretOptions = ['13', '14', '15', '16', '17', '18', '19', '/', '\\'];
const PREVIEW_RENDER_MODES: TabPreviewRenderMode[] = ['ascii', 'svg'];

export function SectionEditorCard({
  section,
  index,
  isFirst,
  isLast,
  showSectionControls = true,
  saveSignal = 0,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: SectionEditorCardProps) {
  const { width } = useWindowDimensions();
  const { capabilities } = useSubscription();
  const { showUpgradePrompt } = useUpgradePrompt();
  const isPreviewCompact = width < 760;
  const isCompactLayout = width < 760;
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState<{
    bars: ReturnType<typeof parseTab>['bars'];
    annotation: TabRowAnnotation;
  } | null>(null);
  const [renderMode, setRenderMode] = useState<TabPreviewRenderMode>('ascii');
  const [rowEditSnapshot, setRowEditSnapshot] = useState<{
    tab: string;
    rowAnnotations?: TabRowAnnotation[];
    rowBarCounts?: number[];
  } | null>(null);
  const lastHandledSaveSignal = useRef(saveSignal);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const quickPreviewRenderMode: TabPreviewRenderMode = !capabilities.svgEnabled ? 'ascii' : renderMode;

  const { stringNames, bars } = useMemo(() => parseTab(section.tab), [section.tab]);
  const rowBarCounts = useMemo(
    () => normalizeRowBarCounts(bars.length, section.rowBarCounts),
    [bars.length, section.rowBarCounts],
  );
  const rowCount = rowBarCounts.length;
  const rowAnnotations = useMemo<TabRowAnnotation[]>(
    () =>
      Array.from({ length: rowCount }, (_, rowIndex) => ({
        label: section.rowAnnotations?.[rowIndex]?.label ?? '',
        beforeText: section.rowAnnotations?.[rowIndex]?.beforeText ?? '',
        afterText: section.rowAnnotations?.[rowIndex]?.afterText ?? '',
      })),
    [rowCount, section.rowAnnotations],
  );
  const rowSlices = useMemo(
    () => {
      let startBarIndex = 0;

      return rowBarCounts.map((barCount, rowIndex) => {
        const nextRow = {
          rowIndex,
          startBarIndex,
          bars: bars.slice(startBarIndex, startBarIndex + barCount),
          annotation: rowAnnotations[rowIndex],
          barCount,
        };

        startBarIndex += barCount;
        return nextRow;
      });
    },
    [bars, rowAnnotations, rowBarCounts],
  );

  const commitBars = (nextBars: ReturnType<typeof parseTab>['bars']) => {
    onChange({ tab: renderTab(stringNames, nextBars) });
  };

  const commitChart = (
    nextBars: ReturnType<typeof parseTab>['bars'],
    nextRowAnnotations = rowAnnotations,
    nextRowBarCounts = rowBarCounts,
  ) => {
    onChange({
      tab: renderTab(stringNames, nextBars),
      rowAnnotations: nextRowAnnotations,
      rowBarCounts: normalizeRowBarCounts(nextBars.length, nextRowBarCounts),
    });
  };

  const updateRowAnnotation = (
    rowIndex: number,
    field: keyof TabRowAnnotation,
    value: string,
  ) => {
    onChange({
      rowAnnotations: rowAnnotations.map((annotation, currentIndex) =>
        currentIndex === rowIndex
          ? { ...annotation, [field]: value }
          : annotation,
      ),
    });
  };

  const focusCell = (rowIndex: number, stringIndex: number, slotIndex: number) => {
    const clampedRowIndex = Math.max(0, Math.min(rowCount - 1, rowIndex));
    const nextRow = rowSlices[clampedRowIndex];
    const nextBarIndex = Math.max(0, Math.min(nextRow.bars.length - 1, Math.floor(slotIndex / beatLabels.length)));
    const nextSlotIndex = Math.max(0, Math.min(beatLabels.length - 1, slotIndex % beatLabels.length));
    const key = getCellKey(
      clampedRowIndex,
      nextBarIndex,
      Math.max(0, Math.min(stringNames.length - 1, stringIndex)),
      nextSlotIndex,
    );

    setActiveRowIndex(clampedRowIndex);
    inputRefs.current[key]?.focus();
  };

  const handleCellChange = (
    barIndex: number,
    stringName: string,
    slotIndex: number,
    value: string,
  ) => {
    commitBars(updateBarCell(bars, barIndex, stringName, slotIndex, value));
  };

  const handleCellKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    rowIndex: number,
    rowBarIndex: number,
    stringIndex: number,
    slotIndex: number,
    currentValue: string,
  ) => {
    const key = event.nativeEvent.key;
    const globalSlotIndex = rowBarIndex * beatLabels.length + slotIndex;

    if (key === 'ArrowRight') {
      focusCell(rowIndex, stringIndex, globalSlotIndex + 1);
      return;
    }

    if (key === 'ArrowLeft') {
      focusCell(rowIndex, stringIndex, globalSlotIndex - 1);
      return;
    }

    if (key === 'ArrowDown' || key === 'Enter') {
      focusCell(rowIndex, stringIndex + 1, globalSlotIndex);
      return;
    }

    if (key === 'ArrowUp') {
      focusCell(rowIndex, stringIndex - 1, globalSlotIndex);
      return;
    }

    if (key === 'Tab') {
      focusCell(rowIndex, stringIndex, globalSlotIndex + 1);
      return;
    }

    if (key === 'Backspace' && !currentValue) {
      focusCell(rowIndex, stringIndex, globalSlotIndex - 1);
    }
  };

  const beginRowEdit = (rowIndex: number) => {
    setRowEditSnapshot({
      tab: section.tab,
      rowAnnotations: section.rowAnnotations?.map((annotation) => ({ ...annotation })),
      rowBarCounts: section.rowBarCounts ? [...section.rowBarCounts] : undefined,
    });
    setActiveRowIndex(rowIndex);
  };

  const handleSaveRowEdit = () => {
    setActiveRowIndex(-1);
    setRowEditSnapshot(null);
  };

  const handleCancelRowEdit = () => {
    if (rowEditSnapshot) {
      onChange({
        tab: rowEditSnapshot.tab,
        rowAnnotations: rowEditSnapshot.rowAnnotations,
        rowBarCounts: rowEditSnapshot.rowBarCounts,
      });
    }

    setActiveRowIndex(-1);
    setRowEditSnapshot(null);
  };

  useEffect(() => {
    if (saveSignal === lastHandledSaveSignal.current) {
      return;
    }

    lastHandledSaveSignal.current = saveSignal;

    if (activeRowIndex >= 0) {
      handleSaveRowEdit();
    }
  }, [activeRowIndex, saveSignal]);

  return (
    <View style={styles.card}>
      {showSectionControls ? (
        <View style={styles.header}>
          <Text style={styles.heading}>{`Section ${index + 1}`}</Text>
          <View style={styles.controls}>
            <PrimaryButton
              label="Up"
              onPress={onMoveUp}
              variant="ghost"
              style={isFirst ? styles.disabled : undefined}
            />
            <PrimaryButton
              label="Down"
              onPress={onMoveDown}
              variant="ghost"
              style={isLast ? styles.disabled : undefined}
            />
            <PrimaryButton label="Delete" onPress={onDelete} variant="danger" />
          </View>
        </View>
      ) : null}

      {showSectionControls ? (
        <Field
          label="Section Name"
          value={section.name ?? 'Chart'}
          onChangeText={(value) => onChange({ name: value })}
        />
      ) : null}
      <View style={styles.toolbar}>
        {showSectionControls ? (
          <View style={styles.toolbarCopy}>
            <Text style={styles.builderTitle}>Fast Tab Editor</Text>
            <Text style={styles.builderSubtitle}>
              Edit one row at a time. New rows start with 4 bars and can be resized from 1 to 8.
            </Text>
          </View>
        ) : null}
        <View style={styles.toolbarActions}>
          <View style={styles.renderModeControl}>
            <Text style={styles.renderModeLabel}>Preview mode</Text>
            <View style={styles.renderModeSelector}>
              {PREVIEW_RENDER_MODES.map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setRenderMode(mode)}
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
          </View>
          <PrimaryButton
            label="Quick Preview"
            onPress={() => setPreviewVisible((value) => !value)}
            variant="secondary"
          />
        </View>
      </View>

      <View style={styles.workspace}>
        <View style={styles.editorColumn}>
          <View style={styles.rowRail}>
            {rowSlices.map((row) => {
              const lastBarNumber = row.startBarIndex + row.bars.length;
              const duplicateRow = () => {
                setCopiedBlock({
                  bars: row.bars.map((bar) => ({
                    cells: Object.fromEntries(
                      stringNames.map((stringName) => [
                        stringName,
                        [...(bar.cells[stringName] ?? Array.from({ length: beatLabels.length }, () => '-'))],
                      ]),
                    ),
                  })),
                  annotation: {
                    label: row.annotation.label,
                    beforeText: row.annotation.beforeText,
                    afterText: row.annotation.afterText,
                  },
                });
              };
              const deleteRow = () => {
                let nextBars = bars;

                for (let index = row.bars.length - 1; index >= 0; index -= 1) {
                  nextBars = removeBar(
                    nextBars,
                    row.startBarIndex + index,
                    stringNames,
                  );
                }

                const nextRowAnnotations = rowAnnotations.filter(
                  (_annotation, currentIndex) => currentIndex !== row.rowIndex,
                );
                const nextRowBarCounts = rowBarCounts.filter(
                  (_count, currentIndex) => currentIndex !== row.rowIndex,
                );

                commitChart(nextBars, nextRowAnnotations, nextRowBarCounts);
                setActiveRowIndex((currentIndex) =>
                  currentIndex > row.rowIndex
                    ? currentIndex - 1
                    : Math.min(currentIndex, Math.max(0, rowCount - 2)),
                  );
              };
              const clearRow = () => {
                const nextBars = bars.map((bar, currentBarIndex) => {
                  if (
                    currentBarIndex < row.startBarIndex ||
                    currentBarIndex >= row.startBarIndex + row.bars.length
                  ) {
                    return bar;
                  }

                  return {
                    cells: Object.fromEntries(
                      stringNames.map((stringName) => [
                        stringName,
                        Array.from({ length: beatLabels.length }, () => '-'),
                      ]),
                    ),
                  };
                });

                commitChart(nextBars);
              };
              const insertRowAfter = () => {
                let nextBars = bars;
                const insertIndex = row.startBarIndex + row.bars.length;

                for (let index = 0; index < barsPerRow; index += 1) {
                  nextBars = insertBar(nextBars, insertIndex + index, stringNames);
                }

                const nextRowAnnotations = [...rowAnnotations];
                nextRowAnnotations.splice(row.rowIndex + 1, 0, {
                  label: '',
                  beforeText: '',
                  afterText: '',
                });
                const nextRowBarCounts = [...rowBarCounts];
                nextRowBarCounts.splice(row.rowIndex + 1, 0, barsPerRow);

                commitChart(nextBars, nextRowAnnotations, nextRowBarCounts);
              };
              const updateRowBarCount = (value: string) => {
                const nextCount = Math.max(1, Math.min(8, Number(value.replace(/[^0-9]/g, '')) || 1));

                if (nextCount === row.barCount) {
                  return;
                }

                let nextBars = bars;

                if (nextCount > row.barCount) {
                  for (let index = 0; index < nextCount - row.barCount; index += 1) {
                    nextBars = insertBar(
                      nextBars,
                      row.startBarIndex + row.barCount + index,
                      stringNames,
                    );
                  }
                } else {
                  for (let index = row.barCount - 1; index >= nextCount; index -= 1) {
                    nextBars = removeBar(nextBars, row.startBarIndex + index, stringNames);
                  }
                }

                const nextRowBarCounts = [...rowBarCounts];
                nextRowBarCounts[row.rowIndex] = nextCount;

                commitChart(nextBars, rowAnnotations, nextRowBarCounts);
              };
              const pasteBlockAt = (insertIndex: number, insertRowIndex: number) => {
                if (!copiedBlock) {
                  return;
                }

                let nextBars = bars;

                copiedBlock.bars.forEach((bar, copiedBarIndex) => {
                  nextBars = insertBar(
                    nextBars,
                    insertIndex + copiedBarIndex,
                    stringNames,
                    bar,
                  );
                });

                const nextAnnotations = [...rowAnnotations];
                nextAnnotations.splice(insertRowIndex, 0, {
                  label: copiedBlock.annotation.label,
                  beforeText: copiedBlock.annotation.beforeText,
                  afterText: copiedBlock.annotation.afterText,
                });
                const nextRowBarCounts = [...rowBarCounts];
                nextRowBarCounts.splice(insertRowIndex, 0, copiedBlock.bars.length);

                commitChart(nextBars, nextAnnotations, nextRowBarCounts);
              };

              return (
                <View key={`${section.id}-row-${row.rowIndex}`} style={styles.rowCard}>
                  <View style={[styles.rowCardHeader, isCompactLayout && styles.rowCardHeaderCompact]}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>
                        {row.annotation.label?.trim()
                          ? `${row.annotation.label.trim()}`
                          : `Bars ${row.startBarIndex + 1}-${lastBarNumber}`}
                      </Text>
                      <Text style={styles.rowSummary}>
                        Bars {row.startBarIndex + 1}-{lastBarNumber}
                        {row.annotation.beforeText || row.annotation.afterText
                          ? ' • instructions added'
                          : ''}
                      </Text>
                      {activeRowIndex !== row.rowIndex ? (
                        isCompactLayout ? (
                          <ScrollView
                            horizontal
                            nestedScrollEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.rowPreviewScroll}
                            contentContainerStyle={styles.rowPreviewScrollContent}
                          >
                            <TabPagePreview
                              stringNames={stringNames}
                              bars={row.bars}
                              rowAnnotations={[row.annotation]}
                              rowBarCounts={[row.barCount]}
                              compact
                              renderMode={renderMode}
                              style={styles.rowMiniPreview}
                            />
                          </ScrollView>
                        ) : (
                          <TabPagePreview
                            stringNames={stringNames}
                            bars={row.bars}
                            rowAnnotations={[row.annotation]}
                            rowBarCounts={[row.barCount]}
                            compact
                            renderMode={renderMode}
                            style={styles.rowMiniPreview}
                          />
                        )
                      ) : null}
                    </View>
                    {activeRowIndex !== row.rowIndex ? (
                      <View style={[styles.rowSidebar, isCompactLayout && styles.rowSidebarCompact]}>
                        <View
                          style={[
                            styles.rowHeaderActions,
                            isCompactLayout && styles.rowHeaderActionsCompact,
                          ]}
                        >
                          <PrimaryButton
                            label="Edit"
                            onPress={() => beginRowEdit(row.rowIndex)}
                            variant="ghost"
                            style={[
                              styles.sidebarButtonWide,
                              isCompactLayout && styles.sidebarButtonCompact,
                            ]}
                            size="compact"
                          />
                          <PrimaryButton
                            label="Insert Row"
                            onPress={insertRowAfter}
                            variant="ghost"
                            style={[
                              styles.sidebarButton,
                              isCompactLayout && styles.sidebarButtonCompact,
                            ]}
                            size="compact"
                          />
                          <PrimaryButton
                            label="Clear Row"
                            onPress={clearRow}
                            variant="ghost"
                            style={[
                              styles.sidebarButton,
                              isCompactLayout && styles.sidebarButtonCompact,
                            ]}
                            size="compact"
                          />
                          <PrimaryButton
                            label="Delete"
                            onPress={deleteRow}
                            variant="ghost"
                            style={[styles.sidebarButton, isCompactLayout && styles.sidebarButtonCompact]}
                            size="compact"
                          />
                          <PrimaryButton
                            label="Copy Block"
                            onPress={duplicateRow}
                            variant="ghost"
                            style={[styles.sidebarButton, isCompactLayout && styles.sidebarButtonCompact]}
                            size="compact"
                          />
                          <PrimaryButton
                            label="Paste Before"
                            onPress={() => pasteBlockAt(row.startBarIndex, row.rowIndex)}
                            variant="ghost"
                            style={[
                              styles.sidebarButton,
                              isCompactLayout && styles.sidebarButtonCompact,
                              !copiedBlock ? styles.disabled : undefined,
                            ]}
                            size="compact"
                          />
                          <PrimaryButton
                            label="Paste After"
                            onPress={() =>
                              pasteBlockAt(row.startBarIndex + row.bars.length, row.rowIndex + 1)
                            }
                            variant="ghost"
                            style={[
                              styles.sidebarButton,
                              isCompactLayout && styles.sidebarButtonCompact,
                              !copiedBlock ? styles.disabled : undefined,
                            ]}
                            size="compact"
                          />
                        </View>
                        <View style={[styles.rowMetaFields, isCompactLayout && styles.rowMetaFieldsCompact]}>
                          <View style={styles.rowMetaLabelField}>
                            <Field
                              label="Block Label"
                              value={row.annotation.label}
                              onChangeText={(value) => updateRowAnnotation(row.rowIndex, 'label', value)}
                              compact
                            />
                          </View>
                          <View style={styles.rowMetaCountField}>
                            <RowBarCountField
                              label="Bars"
                              value={row.barCount}
                              onCommit={updateRowBarCount}
                            />
                          </View>
                        </View>
                      </View>
                    ) : null}
                  </View>
                  {activeRowIndex === row.rowIndex ? (
                    <RowEditor
                      sectionId={section.id}
                      stringNames={stringNames}
                      row={row}
                      bars={bars}
                      rowBarCounts={rowBarCounts}
                      inputRefs={inputRefs}
                      onSave={handleSaveRowEdit}
                      onCancel={handleCancelRowEdit}
                      onRowAnnotationChange={updateRowAnnotation}
                      onBarsChange={commitBars}
                      onChartChange={commitChart}
                      onCellChange={handleCellChange}
                      onCellKeyPress={handleCellKeyPress}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {previewVisible ? (
        <View style={styles.previewOverlay}>
          <Pressable style={styles.previewBackdrop} onPress={() => setPreviewVisible(false)} />
          <View style={[styles.previewModal, isPreviewCompact && styles.previewModalCompact]}>
            <View
              style={[
                styles.previewModalHeader,
                isPreviewCompact && styles.previewModalHeaderCompact,
              ]}
            >
              <View style={styles.previewModalCopy}>
                <Text style={styles.pageHeading}>Quick Preview</Text>
                <Text style={styles.pageSubheading}>
                  {isPreviewCompact
                    ? 'Scroll sideways to view the full chart'
                    : 'Current A4 output'}
                </Text>
                {!capabilities.svgEnabled ? (
                  <Text style={styles.quickPreviewUpgradeNote}>
                    Quick Preview stays ASCII on Free. Go Pro to unlock SVG for stage use.
                  </Text>
                ) : null}
              </View>
              {!isPreviewCompact ? (
                <PrimaryButton
                  label="Close"
                  onPress={() => setPreviewVisible(false)}
                  variant="secondary"
                  size="compact"
                />
              ) : null}
            </View>
            <ScrollView
              style={styles.previewModalScroll}
              contentContainerStyle={styles.previewModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.pageSheet}>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={isPreviewCompact}
                  contentContainerStyle={styles.previewCanvasScroller}
                >
                  <View style={[styles.pageCanvas, isPreviewCompact && styles.pageCanvasCompact]}>
                    <TabPagePreview
                      stringNames={stringNames}
                      bars={bars}
                      rowAnnotations={rowAnnotations}
                      rowBarCounts={rowBarCounts}
                      compact={isPreviewCompact}
                      renderMode={quickPreviewRenderMode}
                    />
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
            {isPreviewCompact ? (
              <View style={styles.previewFooterActions}>
                {!capabilities.svgEnabled ? (
                  <PrimaryButton
                    label="Go Pro for SVG Stage View"
                    onPress={() => showUpgradePrompt('SVG_MODE')}
                    variant="ghost"
                  />
                ) : null}
                <PrimaryButton
                  label="Close Preview"
                  onPress={() => setPreviewVisible(false)}
                  variant="secondary"
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

interface RowEditorProps {
  sectionId: string;
  stringNames: string[];
  row: {
    rowIndex: number;
    startBarIndex: number;
    bars: ReturnType<typeof parseTab>['bars'];
    annotation: TabRowAnnotation;
    barCount: number;
  };
  bars: ReturnType<typeof parseTab>['bars'];
  rowBarCounts: number[];
  inputRefs: MutableRefObject<Record<string, TextInput | null>>;
  onSave: () => void;
  onCancel: () => void;
  onRowAnnotationChange: (
    rowIndex: number,
    field: keyof TabRowAnnotation,
    value: string,
  ) => void;
  onBarsChange: (bars: ReturnType<typeof parseTab>['bars']) => void;
  onChartChange: (
    bars: ReturnType<typeof parseTab>['bars'],
    rowAnnotations?: TabRowAnnotation[],
    rowBarCounts?: number[],
  ) => void;
  onCellChange: (
    barIndex: number,
    stringName: string,
    slotIndex: number,
    value: string,
  ) => void;
  onCellKeyPress: (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    rowIndex: number,
    rowBarIndex: number,
    stringIndex: number,
    slotIndex: number,
    currentValue: string,
  ) => void;
}

function RowEditor({
  sectionId,
  stringNames,
  row,
  bars,
  rowBarCounts,
  inputRefs,
  onSave,
  onCancel,
  onRowAnnotationChange,
  onBarsChange,
  onChartChange,
  onCellChange,
  onCellKeyPress,
}: RowEditorProps) {
  const { width } = useWindowDimensions();
  const [copiedBar, setCopiedBar] = useState<ParsedBar | null>(null);
  const isCompactViewport = width < 900;
  const isSmallViewport = width < 640;
  const useMobileCellEditor = width < 760;
  const cellSize = isSmallViewport ? 26 : isCompactViewport ? 28 : 32;
  const cellGap = isSmallViewport ? 3 : 4;
  const barPadding = isSmallViewport ? 4 : 6;
  const barWidth = cellSize * beatLabels.length + cellGap * (beatLabels.length - 1) + barPadding * 2;
  const footerButtonWidth = Math.floor((barWidth - barPadding * 2 - cellGap) / 2);
  const actionButtonWidth = Math.max(86, Math.min(96, footerButtonWidth - 10));
  const gridScrollRef = useRef<ScrollView | null>(null);
  const pendingBarSelectionRef = useRef<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{
    globalBarIndex: number;
    rowBarIndex: number;
    stringName: string;
    stringIndex: number;
    slotIndex: number;
  } | null>(null);
  const [activeBarIndex, setActiveBarIndex] = useState(0);
  const [showExtendedFretPad, setShowExtendedFretPad] = useState(false);

  useEffect(() => {
    if (!useMobileCellEditor) {
      setSelectedCell(null);
      return;
    }

    setActiveBarIndex(0);
    setShowExtendedFretPad(false);
    setSelectedCell({
      globalBarIndex: row.startBarIndex,
      rowBarIndex: 0,
      stringName: stringNames[0],
      stringIndex: 0,
      slotIndex: 0,
    });
  }, [row.rowIndex, row.startBarIndex, stringNames, useMobileCellEditor]);

  useEffect(() => {
    if (!useMobileCellEditor) {
      return;
    }

    setSelectedCell((currentCell) => ({
      globalBarIndex: row.startBarIndex + activeBarIndex,
      rowBarIndex: activeBarIndex,
      stringName: currentCell?.stringName ?? stringNames[0],
      stringIndex: currentCell?.stringIndex ?? 0,
      slotIndex: currentCell?.slotIndex ?? 0,
    }));
  }, [activeBarIndex, row.startBarIndex, stringNames, useMobileCellEditor]);

  useEffect(() => {
    if (pendingBarSelectionRef.current !== null) {
      const nextBarIndex = pendingBarSelectionRef.current;
      pendingBarSelectionRef.current = null;
      selectBar(nextBarIndex);
      return;
    }

    setActiveBarIndex((current) => Math.max(0, Math.min(row.bars.length - 1, current)));
  }, [row.bars.length]);

  useEffect(() => {
    if (useMobileCellEditor || !gridScrollRef.current) {
      return;
    }

    const horizontalOffset = Math.max(0, activeBarIndex * (barWidth + 8) - barWidth);

    gridScrollRef.current.scrollTo({
      x: horizontalOffset,
      animated: true,
    });
  }, [activeBarIndex, barWidth, useMobileCellEditor]);

  const selectBar = (rowBarIndex: number) => {
    const nextBarIndex = Math.max(0, Math.min(row.bars.length - 1, rowBarIndex));
    setActiveBarIndex(nextBarIndex);
    setSelectedCell((currentCell) => {
      if (!useMobileCellEditor && !currentCell) {
        return currentCell;
      }

      const safeStringIndex = Math.max(0, Math.min(stringNames.length - 1, currentCell?.stringIndex ?? 0));
      const safeSlotIndex = Math.max(0, Math.min(beatLabels.length - 1, currentCell?.slotIndex ?? 0));

      return {
        globalBarIndex: row.startBarIndex + nextBarIndex,
        rowBarIndex: nextBarIndex,
        stringName: stringNames[safeStringIndex],
        stringIndex: safeStringIndex,
        slotIndex: safeSlotIndex,
      };
    });
  };

  const clearBar = (barIndex: number) => {
    const nextBars = bars.map((bar, currentBarIndex) => {
      if (currentBarIndex !== barIndex) {
        return bar;
      }

      return {
        cells: Object.fromEntries(
          stringNames.map((stringName) => [
            stringName,
            Array.from({ length: beatLabels.length }, () => '-'),
          ]),
        ),
      };
    });

    onBarsChange(nextBars);
  };

  const updateRowBarCount = (value: string) => {
    const nextCount = Math.max(1, Math.min(8, Number(value.replace(/[^0-9]/g, '')) || 1));

    if (nextCount === row.barCount) {
      return;
    }

    let nextBars = bars;

    if (nextCount > row.barCount) {
      for (let index = 0; index < nextCount - row.barCount; index += 1) {
        nextBars = insertBar(
          nextBars,
          row.startBarIndex + row.barCount + index,
          stringNames,
        );
      }
    } else {
      for (let index = row.barCount - 1; index >= nextCount; index -= 1) {
        nextBars = removeBar(nextBars, row.startBarIndex + index, stringNames);
      }
    }

    const nextRowBarCounts = [...rowBarCounts];
    nextRowBarCounts[row.rowIndex] = nextCount;
    onChartChange(nextBars, undefined, nextRowBarCounts);
  };

  const replaceBar = (barIndex: number, nextBar: ParsedBar) => {
    const nextBars = bars.map((bar, currentBarIndex) => {
      if (currentBarIndex !== barIndex) {
        return bar;
      }

      return cloneBar(nextBar);
    });

    onBarsChange(nextBars);
  };

  const cloneBar = (bar: ParsedBar): ParsedBar => ({
    cells: Object.fromEntries(
      stringNames.map((stringName) => [
        stringName,
        [...(bar.cells[stringName] ?? Array.from({ length: beatLabels.length }, () => '-'))],
      ]),
    ),
  });

  const commitRowMutation = (
    nextBars: ReturnType<typeof parseTab>['bars'],
    nextCount: number,
    nextSelectedBarIndex: number,
  ) => {
    const normalizedNextCount = Math.max(1, Math.min(8, nextCount));
    const nextRowBarCounts = [...rowBarCounts];
    nextRowBarCounts[row.rowIndex] = normalizedNextCount;
    pendingBarSelectionRef.current = Math.max(0, Math.min(normalizedNextCount - 1, nextSelectedBarIndex));
    onChartChange(nextBars, undefined, nextRowBarCounts);
  };

  const moveSelectedCell = (direction: -1 | 1) => {
    if (!selectedCell) {
      return;
    }

    const slotsPerRow = row.bars.length * beatLabels.length;
    const currentIndex = selectedCell.stringIndex * slotsPerRow + selectedCell.rowBarIndex * beatLabels.length + selectedCell.slotIndex;
    const nextIndex = Math.max(0, Math.min(stringNames.length * slotsPerRow - 1, currentIndex + direction));
    const nextStringIndex = Math.floor(nextIndex / slotsPerRow);
    const withinStringIndex = nextIndex % slotsPerRow;
    const nextRowBarIndex = Math.floor(withinStringIndex / beatLabels.length);
    const nextSlotIndex = withinStringIndex % beatLabels.length;

    setSelectedCell({
      globalBarIndex: row.startBarIndex + nextRowBarIndex,
      rowBarIndex: nextRowBarIndex,
      stringName: stringNames[nextStringIndex],
      stringIndex: nextStringIndex,
      slotIndex: nextSlotIndex,
    });
    setActiveBarIndex(nextRowBarIndex);
  };

  const selectedBar = row.bars[activeBarIndex] ?? row.bars[0];
  const selectedGlobalBarIndex = row.startBarIndex + activeBarIndex;
  const displayBeatLabels = useMobileCellEditor ? mobileBeatLabels : beatLabels;
  const visibleFretOptions = showExtendedFretPad ? extendedFretOptions : baseFretOptions;
  const selectedCellValue =
    selectedCell
      ? row.bars[selectedCell.rowBarIndex]?.cells[selectedCell.stringName]?.[selectedCell.slotIndex] ?? '-'
      : '-';

  const moveSelectedBar = (direction: -1 | 1) => {
    const nextBarIndex = activeBarIndex + direction;

    if (nextBarIndex < 0 || nextBarIndex >= row.bars.length) {
      return;
    }

    const sourceGlobalIndex = row.startBarIndex + activeBarIndex;
    const targetGlobalIndex = row.startBarIndex + nextBarIndex;
    const nextBars = [...bars];
    const sourceBar = nextBars[sourceGlobalIndex];
    nextBars[sourceGlobalIndex] = nextBars[targetGlobalIndex];
    nextBars[targetGlobalIndex] = sourceBar;
    onBarsChange(nextBars);
    selectBar(nextBarIndex);
  };

  const insertAfterSelectedBar = () => {
    commitRowMutation(
      insertBar(bars, selectedGlobalBarIndex + 1, stringNames),
      row.barCount + 1,
      activeBarIndex + 1,
    );
  };

  const duplicateSelectedBar = () => {
    commitRowMutation(
      insertBar(bars, selectedGlobalBarIndex + 1, stringNames, selectedBar),
      row.barCount + 1,
      activeBarIndex + 1,
    );
  };

  const deleteSelectedBar = () => {
    const nextCount = Math.max(1, row.barCount - 1);
    const nextSelectedIndex = Math.max(0, Math.min(activeBarIndex, nextCount - 1));
    commitRowMutation(
      removeBar(bars, selectedGlobalBarIndex, stringNames),
      nextCount,
      nextSelectedIndex,
    );
  };

  const renderSelectedBarToolbar = () => (
    <View style={styles.barToolbarRow}>
      <View style={styles.barToolbarCountField}>
        <RowBarCountField
          label="Bars"
          value={row.barCount}
          onCommit={updateRowBarCount}
          inline
        />
      </View>
      <View style={styles.barFooter}>
        <PrimaryButton
          label="＋ Insert"
          onPress={insertAfterSelectedBar}
          variant="ghost"
          size="compact"
          style={[styles.barFooterButton, { width: actionButtonWidth }]}
        />
        <PrimaryButton
          label="⧉ Duplicate"
          onPress={duplicateSelectedBar}
          variant="ghost"
          size="compact"
          style={[styles.barFooterButton, { width: actionButtonWidth }]}
        />
        <PrimaryButton
          label="← Move"
          onPress={() => moveSelectedBar(-1)}
          variant="ghost"
          size="compact"
          style={[styles.barFooterButton, { width: actionButtonWidth }]}
        />
        <PrimaryButton
          label="Move →"
          onPress={() => moveSelectedBar(1)}
          variant="ghost"
          size="compact"
          style={[styles.barFooterButton, { width: actionButtonWidth }]}
        />
        <PrimaryButton
          label="⎘ Copy"
          onPress={() => setCopiedBar(cloneBar(selectedBar))}
          variant="ghost"
          size="compact"
          style={[styles.barFooterButton, { width: actionButtonWidth }]}
        />
        <PrimaryButton
          label="⎘ Paste"
          onPress={() =>
            copiedBar
              ? replaceBar(selectedGlobalBarIndex, copiedBar)
              : undefined
          }
          variant="ghost"
          style={[
            styles.barFooterButton,
            { width: actionButtonWidth },
            !copiedBar ? styles.disabled : undefined,
          ]}
          size="compact"
        />
        <PrimaryButton
          label="✕ Clear"
          onPress={() => clearBar(selectedGlobalBarIndex)}
          variant="ghost"
          size="compact"
          style={[styles.barFooterButton, { width: actionButtonWidth }]}
        />
        <PrimaryButton
          label="🗑 Delete"
          onPress={deleteSelectedBar}
          variant="danger"
          size="compact"
          style={[styles.barFooterButton, { width: actionButtonWidth }]}
        />
      </View>
    </View>
  );

  const renderBarSelector = () => (
    <View style={styles.barSelectorPanel}>
      <Text style={styles.barSelectorTitle}>Select Bar</Text>
      <Text style={styles.barSelectorHint}>
        Bar actions apply to the selected bar.
      </Text>
      <View style={styles.barSelectorControls}>
        <PrimaryButton
          label="←"
          onPress={() => {
            if (activeBarIndex > 0) {
              selectBar(activeBarIndex - 1);
            }
          }}
          variant="ghost"
          size="compact"
          style={[styles.barStepButton, activeBarIndex === 0 ? styles.disabled : undefined]}
        />
        <View style={styles.barSelectorPills}>
          {row.bars.map((_bar, rowBarIndex) => (
            <Pressable
              key={`${sectionId}-selector-bar-${rowBarIndex}`}
              onPress={() => selectBar(rowBarIndex)}
              style={[
                styles.barSelectorPill,
                rowBarIndex === activeBarIndex && styles.barSelectorPillActive,
              ]}
            >
              <Text
                style={[
                  styles.barSelectorPillLabel,
                  rowBarIndex === activeBarIndex && styles.barSelectorPillLabelActive,
                ]}
              >
                {row.startBarIndex + rowBarIndex + 1}
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          label="→"
          onPress={() => {
            if (activeBarIndex < row.bars.length - 1) {
              selectBar(activeBarIndex + 1);
            }
          }}
          variant="ghost"
          size="compact"
          style={[
            styles.barStepButton,
            activeBarIndex === row.bars.length - 1 ? styles.disabled : undefined,
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.activeRowPanel}>
      <View style={styles.activeRowHeader}>
        <View style={styles.activeRowTitleBlock}>
          <Text style={styles.activeRowTitle}>
            {row.annotation.label?.trim()
              ? `Editing ${row.annotation.label.trim()}`
              : `Editing Bars ${row.startBarIndex + 1}-${row.startBarIndex + row.bars.length}`}
          </Text>
          <Text style={styles.activeRowHint}>
            {useMobileCellEditor
              ? `Bars ${row.startBarIndex + 1}-${row.startBarIndex + row.bars.length}. Tap a box, then use the bar and fret buttons below.`
              : `Bars ${row.startBarIndex + 1}-${row.startBarIndex + row.bars.length}. Click a bar header to select it, then use actions below.`}
          </Text>
          <Text style={styles.activeBarHint}>
            Editing Bar {activeBarIndex + 1} of {row.bars.length}
          </Text>
        </View>
        <View style={styles.activeRowActions}>
          <PrimaryButton
            label="Cancel"
            onPress={onCancel}
            variant="ghost"
            size="compact"
          />
          <PrimaryButton
            label="Save"
            onPress={onSave}
            variant="secondary"
            size="compact"
          />
        </View>
      </View>

      <Field
        label="Block Label"
        value={row.annotation.label}
        onChangeText={(value) => onRowAnnotationChange(row.rowIndex, 'label', value)}
        minHeight={46}
      />

      {useMobileCellEditor ? renderBarSelector() : null}

      {selectedBar ? renderSelectedBarToolbar() : null}

      <AnnotationField
        label="Before Row"
        value={row.annotation.beforeText}
        onChangeText={(value) => onRowAnnotationChange(row.rowIndex, 'beforeText', value)}
      />

      {useMobileCellEditor ? (
        <View style={styles.mobileEditorStack}>
          {selectedBar ? (
            <View style={styles.mobileSingleBarPanel}>
              <View style={styles.gridRow}>
                <View style={styles.labelCell} />
                <View style={[styles.barBlock, styles.mobileBarBlock, { width: barWidth, padding: barPadding }]}>
                  <Text style={styles.barBlockTitle}>Bar {selectedGlobalBarIndex + 1}</Text>
                  <View style={[styles.beatRow, { gap: cellGap }]}>
                    {displayBeatLabels.map((label) => (
                      <View
                        key={`${sectionId}-row-${row.rowIndex}-mobile-beat-${activeBarIndex}-${label}`}
                        style={[styles.beatCell, { width: cellSize }]}
                      >
                        <Text style={styles.beatLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {stringNames.map((stringName, stringIndex) => (
                <View
                  key={`${sectionId}-mobile-row-${row.rowIndex}-${stringName}`}
                  style={styles.gridRow}
                >
                  <View style={styles.labelCell}>
                    <Text style={styles.stringLabel}>{stringName}</Text>
                  </View>
                  <View style={[styles.barBlock, styles.mobileBarBlock, { width: barWidth, padding: barPadding }]}>
                    <View style={[styles.slotRow, { gap: cellGap }]}>
                      {(selectedBar.cells[stringName] ?? []).map((cellValue, slotIndex) => (
                        <Pressable
                          key={`${sectionId}-mobile-cell-${selectedGlobalBarIndex}-${stringName}-${slotIndex}`}
                          onPress={() =>
                            setSelectedCell({
                              globalBarIndex: selectedGlobalBarIndex,
                              rowBarIndex: activeBarIndex,
                              stringName,
                              stringIndex,
                              slotIndex,
                            })
                          }
                          style={[
                            styles.slotButton,
                            { width: cellSize, minHeight: cellSize + 2 },
                            selectedCell?.globalBarIndex === selectedGlobalBarIndex &&
                            selectedCell?.stringName === stringName &&
                            selectedCell?.slotIndex === slotIndex &&
                            styles.slotButtonActive,
                          ]}
                        >
                          <Text style={styles.slotButtonLabel}>
                            {cellValue === '-' ? '-' : cellValue}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {selectedCell ? (
            <View style={styles.mobilePadPanel}>
              <View style={styles.mobilePadHeader}>
                <Text style={styles.mobilePadTitle}>
                  {`${selectedCell.stringName} string • Bar ${selectedCell.globalBarIndex + 1} • Beat ${displayBeatLabels[selectedCell.slotIndex]}`}
                </Text>
                <Text style={styles.mobilePadValue}>
                  {selectedCellValue === '-' ? 'Empty' : `Fret ${selectedCellValue}`}
                </Text>
              </View>
              <View style={styles.mobilePadActions}>
                <PrimaryButton
                  label="Prev"
                  onPress={() => moveSelectedCell(-1)}
                  variant="ghost"
                  size="compact"
                  style={styles.mobilePadActionButton}
                />
                <PrimaryButton
                  label="Next"
                  onPress={() => moveSelectedCell(1)}
                  variant="ghost"
                  size="compact"
                  style={styles.mobilePadActionButton}
                />
                <PrimaryButton
                  label="Clear"
                  onPress={() =>
                    onCellChange(
                      selectedCell.globalBarIndex,
                      selectedCell.stringName,
                      selectedCell.slotIndex,
                      '',
                    )
                  }
                  variant="secondary"
                  size="compact"
                  style={styles.mobilePadActionButton}
                />
                <PrimaryButton
                  label={showExtendedFretPad ? '1-12' : '13+ / \\'}
                  onPress={() => setShowExtendedFretPad((value) => !value)}
                  variant="ghost"
                  size="compact"
                  style={styles.mobilePadActionButton}
                />
              </View>
              <View style={styles.mobileFretPad}>
                {visibleFretOptions.map((fret) => (
                  <Pressable
                    key={`${sectionId}-fret-${fret}`}
                    onPress={() =>
                      onCellChange(
                        selectedCell.globalBarIndex,
                        selectedCell.stringName,
                        selectedCell.slotIndex,
                        fret,
                      )
                    }
                    style={[
                      styles.mobileFretButton,
                      selectedCellValue === fret && styles.mobileFretButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mobileFretButtonLabel,
                        selectedCellValue === fret && styles.mobileFretButtonLabelActive,
                      ]}
                    >
                      {fret}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {selectedBar ? <View style={styles.barFooterSpacer} /> : null}
        </View>
      ) : (
        <ScrollView
          ref={gridScrollRef}
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          alwaysBounceHorizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator
          style={styles.gridScroll}
          contentContainerStyle={styles.gridScrollContent}
        >
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <View style={styles.labelCell} />
              {row.bars.map((_, rowBarIndex) => (
                <Pressable
                  key={`${sectionId}-row-head-${rowBarIndex}`}
                  onPress={() => selectBar(rowBarIndex)}
                  style={[
                    styles.barBlock,
                    rowBarIndex === activeBarIndex && styles.barBlockSelected,
                    rowBarIndex !== activeBarIndex && styles.barBlockSelectable,
                    { width: barWidth, padding: barPadding },
                  ]}
                >
                  <Text style={styles.barBlockTitle}>Bar {row.startBarIndex + rowBarIndex + 1}</Text>
                  <View style={[styles.beatRow, { gap: cellGap }]}>
                    {beatLabels.map((label) => (
                      <View
                        key={`${sectionId}-row-${row.rowIndex}-beat-${rowBarIndex}-${label}`}
                        style={[styles.beatCell, { width: cellSize }]}
                      >
                        <Text style={styles.beatLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              ))}
            </View>

            {stringNames.map((stringName, stringIndex) => (
              <View
                key={`${sectionId}-row-${row.rowIndex}-${stringName}`}
                style={styles.gridRow}
              >
                <View style={styles.labelCell}>
                  <Text style={styles.stringLabel}>{stringName}</Text>
                </View>

                {row.bars.map((bar, rowBarIndex) => {
                  const globalBarIndex = row.startBarIndex + rowBarIndex;

                  return (
                    <View
                      key={`${sectionId}-bar-grid-${globalBarIndex}-${stringName}`}
                      style={[
                        styles.barBlock,
                        rowBarIndex === activeBarIndex && styles.barBlockSelected,
                        { width: barWidth, padding: barPadding },
                      ]}
                    >
                      <View style={[styles.slotRow, { gap: cellGap }]}>
                        {(bar.cells[stringName] ?? []).map((cellValue, slotIndex) => {
                          const cellKey = getCellKey(
                            row.rowIndex,
                            rowBarIndex,
                            stringIndex,
                            slotIndex,
                          );

                          return (
                            <TextInput
                              key={cellKey}
                              ref={(element) => {
                                inputRefs.current[cellKey] = element;
                              }}
                              value={toEditableCellValue(cellValue)}
                              onChangeText={(value) =>
                                onCellChange(globalBarIndex, stringName, slotIndex, value)
                              }
                              onFocus={() => selectBar(rowBarIndex)}
                              onKeyPress={(event) =>
                                onCellKeyPress(
                                  event,
                                  row.rowIndex,
                                  rowBarIndex,
                                  stringIndex,
                                  slotIndex,
                                  toEditableCellValue(cellValue),
                                )
                              }
                              maxLength={2}
                              autoCapitalize="none"
                              autoCorrect={false}
                              spellCheck={false}
                              style={[styles.slotInput, { width: cellSize, minHeight: cellSize + 2 }]}
                              placeholder="-"
                              placeholderTextColor={palette.textMuted}
                            />
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

          </View>
        </ScrollView>
      )}

      <AnnotationField
        label="After Row"
        value={row.annotation.afterText}
        onChangeText={(value) => onRowAnnotationChange(row.rowIndex, 'afterText', value)}
      />
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  minHeight?: number;
  monospace?: boolean;
  compact?: boolean;
  keyboardType?: 'default' | 'numeric';
  maxLength?: number;
  selectTextOnFocus?: boolean;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
}

function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  minHeight = 50,
  monospace = false,
  compact = false,
  keyboardType = 'default',
  maxLength,
  selectTextOnFocus = false,
  onBlur,
  onSubmitEditing,
}: FieldProps) {
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        selectTextOnFocus={selectTextOnFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        textAlignVertical="top"
        style={[
          styles.input,
          compact && styles.compactInput,
          { minHeight },
          monospace && styles.monospaceInput,
        ]}
        placeholderTextColor={palette.textMuted}
      />
    </View>
  );
}

function RowBarCountField({
  label,
  value,
  onCommit,
  inline = false,
}: {
  label: string;
  value: number;
  onCommit: (value: string) => void;
  inline?: boolean;
}) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const commitDraft = () => {
    const digits = draftValue.replace(/[^0-9]/g, '').slice(0, 1);
    const normalizedValue = String(Math.max(1, Math.min(8, Number(digits || value))));

    setDraftValue(normalizedValue);

    if (normalizedValue !== String(value)) {
      onCommit(normalizedValue);
    }
  };

  if (inline) {
    return (
      <View style={styles.rowBarInlineField}>
        <Text style={styles.rowBarInlineLabel}>{label}</Text>
        <TextInput
          value={draftValue}
          onChangeText={(nextValue) => setDraftValue(nextValue.replace(/[^0-9]/g, '').slice(0, 1))}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
          onBlur={commitDraft}
          onSubmitEditing={commitDraft}
          style={[styles.input, styles.compactInput, styles.rowBarInlineInput]}
          placeholderTextColor={palette.textMuted}
        />
      </View>
    );
  }

  return (
    <Field
      label={label}
      value={draftValue}
      onChangeText={(nextValue) => setDraftValue(nextValue.replace(/[^0-9]/g, '').slice(0, 1))}
      compact
      keyboardType="numeric"
      maxLength={1}
      selectTextOnFocus
      onBlur={commitDraft}
      onSubmitEditing={commitDraft}
    />
  );
}

function AnnotationField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.annotationCard}>
        <View style={styles.annotationToolbar}>
          <Text style={styles.annotationHint}>
            Use leading spaces for placement. Use `<b>...</b>` and `<u>...</u>` for style.
          </Text>
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.annotationInput]}
          placeholder="e.g.   <b>Hold through bar 2</b>"
          placeholderTextColor={palette.textMuted}
        />
      </View>
    </View>
  );
}

const getCellKey = (
  rowIndex: number,
  rowBarIndex: number,
  stringIndex: number,
  slotIndex: number,
) => `${rowIndex}-${rowBarIndex}-${stringIndex}-${slotIndex}`;

const toEditableCellValue = (value: string) => {
  if (!value || value === '-') {
    return '';
  }

  return value.replace(/-+$/g, '');
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  header: {
    gap: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  disabled: {
    opacity: 0.45,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textMuted,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.text,
    fontSize: 15,
  },
  monospaceInput: {
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 22,
  },
  toolbar: {
    gap: 12,
  },
  toolbarCopy: {
    gap: 4,
  },
  builderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  builderSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
  },
  toolbarActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  renderModeControl: {
    gap: 4,
  },
  renderModeLabel: {
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: palette.textMuted,
  },
  renderModeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  renderModeOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
  },
  renderModeOptionActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryMuted,
  },
  renderModeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textMuted,
  },
  renderModeOptionTextActive: {
    color: palette.primary,
  },
  workspace: {
    gap: 16,
  },
  editorColumn: {
    gap: 16,
  },
  rowRail: {
    gap: 12,
  },
  rowCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  rowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowCardHeaderCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowSidebar: {
    width: 216,
    gap: 8,
    alignItems: 'stretch',
  },
  rowSidebarCompact: {
    width: '100%',
  },
  rowHeaderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  rowHeaderActionsCompact: {
    justifyContent: 'flex-start',
  },
  sidebarButton: {
    width: 104,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sidebarButtonCompact: {
    width: '100%',
  },
  sidebarButtonWide: {
    width: '100%',
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactField: {
    gap: 4,
  },
  rowMetaFields: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  rowMetaFieldsCompact: {
    flexDirection: 'column',
  },
  rowMetaLabelField: {
    flex: 1,
    minWidth: 0,
  },
  rowMetaCountField: {
    width: 72,
  },
  annotationCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  annotationToolbar: {
    gap: 10,
  },
  annotationHint: {
    fontSize: 12,
    lineHeight: 17,
    color: palette.textMuted,
  },
  compactInput: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
  },
  rowSummary: {
    fontSize: 13,
    color: palette.textMuted,
    marginTop: 2,
  },
  rowMiniPreview: {
    marginTop: 6,
  },
  rowPreviewScroll: {
    marginTop: 6,
  },
  rowPreviewScrollContent: {
    paddingRight: 12,
  },
  activeRowPanel: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    backgroundColor: '#fcfcfd',
  },
  activeRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  activeRowTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  activeRowTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  rowCountPanel: {
    gap: 6,
  },
  rowCountHint: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.textMuted,
  },
  activeRowHint: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
    marginTop: 3,
  },
  activeBarHint: {
    fontSize: 12,
    lineHeight: 17,
    color: palette.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  barSelectorPanel: {
    gap: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
  },
  barSelectorTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: palette.textMuted,
    fontWeight: '700',
  },
  barSelectorHint: {
    fontSize: 12,
    color: palette.textMuted,
  },
  barSelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barStepButton: {
    minHeight: 36,
    minWidth: 40,
    paddingHorizontal: 10,
  },
  barSelectorPills: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  barSelectorPill: {
    minWidth: 40,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barSelectorPillActive: {
    borderColor: palette.primary,
    backgroundColor: '#e0f3ef',
  },
  barSelectorPillLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
  },
  barSelectorPillLabelActive: {
    color: palette.primary,
  },
  activeRowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'flex-end',
  },
  activeMetaFields: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  activeMetaLabelField: {
    width: 88,
  },
  annotationInput: {
    minHeight: 64,
  },
  grid: {
    gap: 8,
    alignSelf: 'flex-start',
  },
  gridScroll: {
    width: '100%',
  },
  gridScrollContent: {
    minWidth: '100%',
    paddingBottom: 4,
  },
  mobileEditorStack: {
    gap: 12,
  },
  mobileBarSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobileBarButton: {
    minWidth: 42,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileBarButtonActive: {
    borderColor: palette.primary,
    backgroundColor: '#e0f3ef',
  },
  mobileBarButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
  },
  mobileBarButtonLabelActive: {
    color: palette.primary,
  },
  mobileSingleBarPanel: {
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  labelCell: {
    width: 28,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stringLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  barBlock: {
    gap: 6,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#eef2f7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  barBlockSelected: {
    borderColor: palette.accent,
    backgroundColor: '#fff7ed',
  },
  barBlockSelectable: {
    borderColor: palette.border,
  },
  mobileBarBlock: {
    maxWidth: '100%',
  },
  barBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textMuted,
    textAlign: 'center',
  },
  beatRow: {
    flexDirection: 'row',
  },
  beatCell: {
    alignItems: 'center',
  },
  beatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.primary,
  },
  slotRow: {
    flexDirection: 'row',
  },
  slotInput: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#ffffff',
    color: palette.text,
    fontFamily: 'monospace',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  slotButton: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  slotButtonActive: {
    borderColor: palette.accent,
    backgroundColor: '#fff7ed',
  },
  slotButtonLabel: {
    color: palette.text,
    fontFamily: 'monospace',
    fontSize: 14,
    textAlign: 'center',
  },
  mobilePadPanel: {
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.primary,
    backgroundColor: '#ffffff',
  },
  mobilePadHeader: {
    gap: 2,
  },
  mobilePadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
  },
  mobilePadValue: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.textMuted,
  },
  mobilePadActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobilePadActionButton: {
    minHeight: 38,
  },
  mobileFretPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobileFretButton: {
    minWidth: 46,
    minHeight: 42,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFretButtonActive: {
    borderColor: palette.primary,
    backgroundColor: '#e0f3ef',
  },
  mobileFretButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  mobileFretButtonLabelActive: {
    color: palette.primary,
  },
  mobileBarActionsBlock: {
    width: '100%',
  },
  barToolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 10,
  },
  barToolbarCountField: {
    width: 104,
  },
  barFooter: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    gap: 6,
  },
  barFooterButton: {
    minHeight: 34,
  },
  rowBarInlineField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
  },
  rowBarInlineLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textMuted,
  },
  rowBarInlineInput: {
    width: 42,
    minHeight: 34,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  barFooterSpacer: {
    height: 2,
  },
  pageSheet: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  pageMeta: {
    width: '100%',
    maxWidth: 640,
    gap: 4,
  },
  pageHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#78716c',
  },
  pageSubheading: {
    fontSize: 12,
    color: '#94a3b8',
  },
  quickPreviewUpgradeNote: {
    fontSize: 12,
    lineHeight: 18,
    color: '#9a3412',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  previewModal: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '92%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  previewModalCompact: {
    maxHeight: '96%',
    padding: 12,
    gap: 10,
  },
  previewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  previewModalHeaderCompact: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 8,
  },
  previewModalCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  previewModalScroll: {
    width: '100%',
  },
  previewModalScrollContent: {
    alignItems: 'center',
  },
  previewCanvasScroller: {
    width: '100%',
  },
  pageCanvas: {
    width: '100%',
    maxWidth: 640,
    aspectRatio: 1 / 1.414,
    backgroundColor: '#fffef8',
    borderRadius: 10,
    paddingTop: 34,
    paddingRight: 30,
    paddingBottom: 34,
    paddingLeft: 30,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: 'hidden',
  },
  pageCanvasCompact: {
    width: undefined,
    minWidth: 560,
    maxWidth: undefined,
    paddingTop: 22,
    paddingRight: 18,
    paddingBottom: 22,
    paddingLeft: 18,
  },
  previewFooterActions: {
    paddingTop: 4,
  },
});
