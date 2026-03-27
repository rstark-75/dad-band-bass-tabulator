import { MutableRefObject, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
  useWindowDimensions,
} from 'react-native';

import { palette } from '../constants/colors';
import { Section, TabRowAnnotation } from '../types/models';
import {
  getRowCount,
  insertBar,
  parseTab,
  ParsedBar,
  removeBar,
  renderTab,
  updateBarCell,
} from '../utils/tabLayout';
import { PrimaryButton } from './PrimaryButton';
import { TabPagePreview } from './TabPagePreview';

interface SectionEditorCardProps {
  section: Section;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  showSectionControls?: boolean;
  onChange: (updates: Partial<Section>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

const beatLabels = ['1', '&', '2', '&', '3', '&', '4', '&'];
const barsPerRow = 4;

const parseAnnotationControls = (value: string) => {
  const alignMatch = value.trim().match(/^\[(left|center|right)\]\s*/i);
  const align = (alignMatch?.[1].toLowerCase() as 'left' | 'center' | 'right' | undefined) ?? 'left';
  const textWithoutAlign = alignMatch ? value.trim().slice(alignMatch[0].length) : value;
  const bold = /^\*\*.*\*\*$/.test(textWithoutAlign.trim());
  const underline = /^__.*__$/.test(textWithoutAlign.trim());
  const plainText = textWithoutAlign.trim().replace(/^\*\*(.*)\*\*$/, '$1').replace(/^__(.*)__$/, '$1');

  return { align, bold, underline, plainText };
};

const withAnnotationStyle = (
  value: string,
  next: Partial<{ align: 'left' | 'center' | 'right'; bold: boolean; underline: boolean }>,
) => {
  const current = parseAnnotationControls(value);
  const align = next.align ?? current.align;
  const bold = next.bold ?? current.bold;
  const underline = next.underline ?? current.underline;
  let text = current.plainText;

  if (bold) {
    text = `**${text}**`;
  } else if (underline) {
    text = `__${text}__`;
  }

  return `${align === 'left' ? '' : `[${align}] `}${text}`.trim();
};

const withAnnotationText = (value: string, nextText: string) => {
  const current = parseAnnotationControls(value);
  let text = nextText;

  if (current.bold) {
    text = `**${text}**`;
  } else if (current.underline) {
    text = `__${text}__`;
  }

  return `${current.align === 'left' ? '' : `[${current.align}] `}${text}`.trim();
};

export function SectionEditorCard({
  section,
  index,
  isFirst,
  isLast,
  showSectionControls = true,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: SectionEditorCardProps) {
  const { width } = useWindowDimensions();
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState<{
    bars: ReturnType<typeof parseTab>['bars'];
    annotation: TabRowAnnotation;
  } | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const { stringNames, bars } = useMemo(() => parseTab(section.tab), [section.tab]);
  const rowCount = useMemo(() => getRowCount(bars, barsPerRow), [bars]);
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
    () =>
      Array.from({ length: rowCount }, (_, rowIndex) => ({
        rowIndex,
        startBarIndex: rowIndex * barsPerRow,
        bars: bars.slice(rowIndex * barsPerRow, rowIndex * barsPerRow + barsPerRow),
        annotation: rowAnnotations[rowIndex],
      })),
    [bars, rowAnnotations, rowCount],
  );
  const splitLayout = Platform.OS === 'web' && width >= 1280 && previewVisible;

  const commitBars = (nextBars: ReturnType<typeof parseTab>['bars']) => {
    onChange({ tab: renderTab(stringNames, nextBars) });
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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          {showSectionControls ? `Section ${index + 1}` : 'Tab'}
        </Text>
        {showSectionControls ? (
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
        ) : null}
      </View>

      {showSectionControls ? (
        <Field
          label="Section Name"
          value={section.name}
          onChangeText={(value) => onChange({ name: value })}
        />
      ) : null}
      <View style={styles.toolbar}>
        <View style={styles.toolbarCopy}>
          <Text style={styles.builderTitle}>Fast Tab Editor</Text>
          <Text style={styles.builderSubtitle}>
            Edit one four-bar row at a time. Use arrow keys, Enter, and Tab to move.
          </Text>
        </View>
        <View style={styles.toolbarActions}>
          <PrimaryButton
            label={previewVisible ? 'Hide Preview' : 'Show Preview'}
            onPress={() => setPreviewVisible((value) => !value)}
            variant="secondary"
          />
          <PrimaryButton
            label="Add Bar"
            onPress={() => commitBars(insertBar(bars, bars.length, stringNames))}
            variant="ghost"
          />
          <PrimaryButton
            label="Repeat Last"
            onPress={() =>
              commitBars(insertBar(bars, bars.length, stringNames, bars[bars.length - 1]))
            }
            variant="ghost"
          />
        </View>
      </View>

      <View style={[styles.workspace, splitLayout && styles.workspaceSplit]}>
        <View style={[styles.editorColumn, splitLayout && styles.editorColumnSplit]}>
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

                commitBars(nextBars);
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

                commitBars(nextBars);
              };
              const insertRowAfter = () => {
                let nextBars = bars;
                const insertIndex = row.startBarIndex + row.bars.length;

                for (let index = 0; index < barsPerRow; index += 1) {
                  nextBars = insertBar(nextBars, insertIndex + index, stringNames);
                }

                commitBars(nextBars);
              };
              const pasteBlockAt = (insertIndex: number) => {
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
                nextAnnotations.splice(Math.floor(insertIndex / barsPerRow), 0, {
                  label: copiedBlock.annotation.label,
                  beforeText: copiedBlock.annotation.beforeText,
                  afterText: copiedBlock.annotation.afterText,
                });

                onChange({
                  tab: renderTab(stringNames, nextBars),
                  rowAnnotations: nextAnnotations,
                });
              };

              return (
                <View key={`${section.id}-row-${row.rowIndex}`} style={styles.rowCard}>
                  <View style={styles.rowCardHeader}>
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
                        <TabPagePreview
                          stringNames={stringNames}
                          bars={row.bars}
                          rowAnnotations={[row.annotation]}
                          compact
                          style={styles.rowMiniPreview}
                        />
                      ) : null}
                    </View>
                    <View style={styles.rowSidebar}>
                      <View style={styles.rowHeaderActions}>
                        <PrimaryButton
                          label="Copy Block"
                          onPress={duplicateRow}
                          variant="ghost"
                          style={styles.sidebarButton}
                          size="compact"
                        />
                        <PrimaryButton
                          label="Paste Before"
                          onPress={() => pasteBlockAt(row.startBarIndex)}
                          variant="ghost"
                          style={[
                            styles.sidebarButton,
                            !copiedBlock ? styles.disabled : undefined,
                          ]}
                          size="compact"
                        />
                        <PrimaryButton
                          label="Paste After"
                          onPress={() => pasteBlockAt(row.startBarIndex + row.bars.length)}
                          variant="ghost"
                          style={[
                            styles.sidebarButton,
                            !copiedBlock ? styles.disabled : undefined,
                          ]}
                          size="compact"
                        />
                        <PrimaryButton
                          label="Insert Row"
                          onPress={insertRowAfter}
                          variant="ghost"
                          style={styles.sidebarButton}
                          size="compact"
                        />
                        <PrimaryButton
                          label="Clear Row"
                          onPress={clearRow}
                          variant="ghost"
                          style={styles.sidebarButton}
                          size="compact"
                        />
                        <PrimaryButton
                          label="Delete"
                          onPress={deleteRow}
                          variant="ghost"
                          style={styles.sidebarButton}
                          size="compact"
                        />
                        <PrimaryButton
                          label="Edit"
                          onPress={() => setActiveRowIndex(row.rowIndex)}
                          variant="ghost"
                          style={styles.sidebarButtonWide}
                          size="compact"
                        />
                      </View>
                      <Field
                        label="Block Label"
                        value={row.annotation.label}
                        onChangeText={(value) => updateRowAnnotation(row.rowIndex, 'label', value)}
                        compact
                      />
                    </View>
                  </View>
                  {activeRowIndex === row.rowIndex ? (
                    <RowEditor
                      sectionId={section.id}
                      stringNames={stringNames}
                      row={row}
                      bars={bars}
                      inputRefs={inputRefs}
                      onSelectRow={setActiveRowIndex}
                      onRowAnnotationChange={updateRowAnnotation}
                      onBarsChange={commitBars}
                      onCellChange={handleCellChange}
                      onCellKeyPress={handleCellKeyPress}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {previewVisible ? (
          <View style={[styles.previewColumn, splitLayout && styles.previewColumnSplit]}>
            <View style={styles.pageSheet}>
              <View style={styles.pageMeta}>
                <Text style={styles.pageHeading}>A4 Preview</Text>
                <Text style={styles.pageSubheading}>Portrait print layout</Text>
              </View>
              <View style={styles.pageCanvas}>
                <TabPagePreview
                  stringNames={stringNames}
                  bars={bars}
                  rowAnnotations={rowAnnotations}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
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
  };
  bars: ReturnType<typeof parseTab>['bars'];
  inputRefs: MutableRefObject<Record<string, TextInput | null>>;
  onSelectRow: (rowIndex: number) => void;
  onRowAnnotationChange: (
    rowIndex: number,
    field: keyof TabRowAnnotation,
    value: string,
  ) => void;
  onBarsChange: (bars: ReturnType<typeof parseTab>['bars']) => void;
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
  inputRefs,
  onSelectRow,
  onRowAnnotationChange,
  onBarsChange,
  onCellChange,
  onCellKeyPress,
}: RowEditorProps) {
  const { width } = useWindowDimensions();
  const [copiedBar, setCopiedBar] = useState<ParsedBar | null>(null);
  const isCompactViewport = width < 900;
  const isSmallViewport = width < 640;
  const cellSize = isSmallViewport ? 26 : isCompactViewport ? 28 : 32;
  const cellGap = isSmallViewport ? 3 : 4;
  const barPadding = isSmallViewport ? 4 : 6;
  const barWidth = cellSize * beatLabels.length + cellGap * (beatLabels.length - 1) + barPadding * 2;
  const footerButtonWidth = Math.floor((barWidth - barPadding * 2 - cellGap) / 2);

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
            Bars {row.startBarIndex + 1}-{row.startBarIndex + row.bars.length}. Dense grid for faster entry.
          </Text>
        </View>
        <PrimaryButton
          label="Close"
          onPress={() => onSelectRow(-1)}
          variant="secondary"
        />
      </View>

      <AnnotationField
        label="Before Row"
        value={row.annotation.beforeText}
        onChangeText={(value) => onRowAnnotationChange(row.rowIndex, 'beforeText', value)}
      />

      <ScrollView
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
              <View
                key={`${sectionId}-row-head-${rowBarIndex}`}
                style={[styles.barBlock, { width: barWidth, padding: barPadding }]}
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
              </View>
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
                    style={[styles.barBlock, { width: barWidth, padding: barPadding }]}
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
                            value={cellValue === '-' ? '' : cellValue}
                            onChangeText={(value) =>
                              onCellChange(globalBarIndex, stringName, slotIndex, value)
                            }
                            onKeyPress={(event) =>
                              onCellKeyPress(
                                event,
                                row.rowIndex,
                                rowBarIndex,
                                stringIndex,
                                slotIndex,
                                cellValue === '-' ? '' : cellValue,
                              )
                            }
                            maxLength={2}
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

          <View style={styles.gridRow}>
            <View style={styles.labelCell} />
            {row.bars.map((bar, rowBarIndex) => {
              const globalBarIndex = row.startBarIndex + rowBarIndex;

              return (
                <View
                  key={`${sectionId}-bar-actions-${globalBarIndex}`}
                  style={[styles.barBlock, { width: barWidth, padding: barPadding }]}
                >
                  <View style={[styles.barFooter, { gap: cellGap }]}>
                    <PrimaryButton
                      label="Insert"
                      onPress={() =>
                        onBarsChange(insertBar(bars, globalBarIndex, stringNames))
                      }
                      variant="ghost"
                      style={[styles.barFooterButton, { width: footerButtonWidth }]}
                    />
                    <PrimaryButton
                      label="Duplicate"
                      onPress={() =>
                        onBarsChange(insertBar(bars, globalBarIndex + 1, stringNames, bar))
                      }
                      variant="ghost"
                      style={[styles.barFooterButton, { width: footerButtonWidth }]}
                    />
                    <PrimaryButton
                      label="Copy"
                      onPress={() => setCopiedBar(cloneBar(bar))}
                      variant="ghost"
                      style={[styles.barFooterButton, { width: footerButtonWidth }]}
                    />
                    <PrimaryButton
                      label="Paste Here"
                      onPress={() =>
                        copiedBar
                          ? replaceBar(globalBarIndex, copiedBar)
                          : undefined
                      }
                      variant="ghost"
                      style={[
                        styles.barFooterButton,
                        { width: footerButtonWidth },
                        !copiedBar ? styles.disabled : undefined,
                      ]}
                    />
                    <PrimaryButton
                      label="Paste New"
                      onPress={() =>
                        copiedBar
                          ? onBarsChange(
                              insertBar(
                                bars,
                                globalBarIndex + 1,
                                stringNames,
                                copiedBar,
                              ),
                            )
                          : undefined
                      }
                      variant="ghost"
                      style={[
                        styles.barFooterButton,
                        { width: footerButtonWidth },
                        !copiedBar ? styles.disabled : undefined,
                      ]}
                    />
                    <PrimaryButton
                      label="Clear"
                      onPress={() => clearBar(globalBarIndex)}
                      variant="ghost"
                      style={[styles.barFooterButton, { width: footerButtonWidth }]}
                    />
                    <PrimaryButton
                      label="Delete"
                      onPress={() => onBarsChange(removeBar(bars, globalBarIndex, stringNames))}
                      variant="danger"
                      style={[styles.barFooterButton, { width: footerButtonWidth }]}
                    />
                  </View>
                  <View style={styles.barFooterSpacer} />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

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
}

function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  minHeight = 50,
  monospace = false,
  compact = false,
}: FieldProps) {
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
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

function AnnotationField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const controls = parseAnnotationControls(value);

  return (
    <View style={styles.field}>
      <View style={styles.annotationHeader}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.annotationControls}>
          <FormatToggle
            label="L"
            active={controls.align === 'left'}
            onPress={() => onChangeText(withAnnotationStyle(value, { align: 'left' }))}
          />
          <FormatToggle
            label="C"
            active={controls.align === 'center'}
            onPress={() => onChangeText(withAnnotationStyle(value, { align: 'center' }))}
          />
          <FormatToggle
            label="R"
            active={controls.align === 'right'}
            onPress={() => onChangeText(withAnnotationStyle(value, { align: 'right' }))}
          />
          <FormatToggle
            label="B"
            active={controls.bold}
            onPress={() =>
              onChangeText(
                withAnnotationStyle(value, {
                  bold: !controls.bold,
                  underline: controls.bold ? controls.underline : false,
                }),
              )
            }
          />
          <FormatToggle
            label="U"
            active={controls.underline}
            onPress={() =>
              onChangeText(
                withAnnotationStyle(value, {
                  underline: !controls.underline,
                  bold: controls.underline ? controls.bold : false,
                }),
              )
            }
          />
        </View>
      </View>
      <TextInput
        value={controls.plainText}
        onChangeText={(nextText) => onChangeText(withAnnotationText(value, nextText))}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.annotationInput]}
        placeholderTextColor={palette.textMuted}
      />
    </View>
  );
}

function FormatToggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.formatToggle, active && styles.formatToggleActive]}
    >
      {label}
    </Text>
  );
}

const getCellKey = (
  rowIndex: number,
  rowBarIndex: number,
  stringIndex: number,
  slotIndex: number,
) => `${rowIndex}-${rowBarIndex}-${stringIndex}-${slotIndex}`;

const styles = StyleSheet.create({
  card: {
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
  workspace: {
    gap: 16,
  },
  workspaceSplit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  editorColumn: {
    gap: 16,
  },
  editorColumnSplit: {
    flex: 1.2,
  },
  previewColumn: {
    gap: 16,
  },
  previewColumnSplit: {
    flex: 0.9,
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
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowSidebar: {
    width: 216,
    gap: 8,
    alignItems: 'stretch',
  },
  rowHeaderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  sidebarButton: {
    width: 104,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  annotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  annotationControls: {
    flexDirection: 'row',
    gap: 6,
  },
  formatToggle: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  formatToggleActive: {
    backgroundColor: palette.primaryMuted,
    borderColor: palette.primary,
    color: palette.primary,
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
  activeRowHint: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
    marginTop: 3,
  },
  activeRowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  annotationInput: {
    minHeight: 58,
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
  barFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  barFooterButton: {
    minHeight: 34,
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
});
