import { Fragment } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { palette } from '../constants/colors';
import { ParsedBar, TabRowAnnotation, SLOTS_PER_BAR, EMPTY_SLOT } from '../utils/tabLayout';
import { getNoteRenderStyle, isEmptySlotValue } from '../utils/tabPreviewTimeline';

export type TabPreviewRenderMode = 'ascii' | 'svg';

interface TabPreviewContentProps {
  stringNames: string[];
  bars: ParsedBar[];
  rowAnnotations?: TabRowAnnotation[];
  rowBarCounts?: number[];
  barsPerRow?: number;
  tone?: 'light' | 'dark';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface TabPagePreviewProps extends TabPreviewContentProps {
  renderMode?: TabPreviewRenderMode;
}

interface AnnotationFormat {
  align: 'left' | 'center' | 'right';
  text: string;
}

interface Segment {
  text: string;
  bold?: boolean;
  underline?: boolean;
}

const beatGuide = '  |1 & 2 & 3 & 4 &';
const slotToSegment = (value: string): string => {
  if (!value || isEmptySlotValue(value)) {
    return '--';
  }

  return value.padEnd(2, '-').slice(0, 2);
};

const joinRenderedBars = (segments: string[]) =>
  segments.map((segment, index) => (index === 0 ? segment : segment.slice(1))).join('');

const parseAlignment = (value: string): AnnotationFormat => {
  const trimmed = value.trim();
  const match = trimmed.match(/^\[(left|center|right)\]\s*/i);

  if (!match) {
    return { align: 'left', text: trimmed };
  }

  return {
    align: match[1].toLowerCase() as 'left' | 'center' | 'right',
    text: trimmed.slice(match[0].length),
  };
};

const parseSegments = (value: string): Segment[] => {
  const segments: Segment[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__)/g;
  let lastIndex = 0;

  value.replace(pattern, (match, _group, offset) => {
    if (offset > lastIndex) {
      segments.push({ text: value.slice(lastIndex, offset) });
    }

    if (match.startsWith('**')) {
      segments.push({ text: match.slice(2, -2), bold: true });
    } else {
      segments.push({ text: match.slice(2, -2), underline: true });
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < value.length) {
    segments.push({ text: value.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text: value }];
};

const resolveRowBarCounts = (
  bars: ParsedBar[],
  rowBarCounts?: number[],
  barsPerRow = 4,
) =>
  rowBarCounts && rowBarCounts.length > 0
    ? rowBarCounts.filter((count) => count > 0)
    : Array.from({ length: Math.max(1, Math.ceil(bars.length / barsPerRow)) }, () => barsPerRow);

export function TabPagePreview({ renderMode = 'ascii', ...contentProps }: TabPagePreviewProps) {
  return renderMode === 'svg' ? (
    <SvgTabPagePreview {...contentProps} />
  ) : (
    <AsciiTabPagePreview {...contentProps} />
  );
}

const renderStem = (
  stemX: number,
  baseY: number,
  accentColor: string,
  keyPrefix: string,
) => {
  const stemTop = baseY - SVG_STEM_HEIGHT;

  return (
    <Line
      key={`${keyPrefix}-${stemX}-${baseY}`}
      x1={stemX}
      x2={stemX}
      y1={baseY}
      y2={stemTop}
      stroke={accentColor}
      strokeWidth={1.4}
      strokeLinecap="round"
    />
  );
};

const renderNoteMarker = (stemX: number, fretY: number, accentColor: string) =>
  renderStem(stemX, fretY, accentColor, 'note-marker');

const renderHoldTail = (stemX: number, circleTopY: number, accentColor: string) =>
  renderStem(stemX, circleTopY, accentColor, 'hold-tail');

const renderQuaverFlag = (stemX: number, stemTop: number, accentColor: string) => (
  <Path
    key={`quaver-flag-${stemX}-${stemTop}`}
    d={`M${stemX},${stemTop} L${stemX + SVG_FLAG_WIDTH},${stemTop + 4} L${stemX},${stemTop + SVG_FLAG_HEIGHT}`}
    stroke={accentColor}
    strokeWidth={1.4}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

function AsciiTabPagePreview({
  stringNames,
  bars,
  rowAnnotations = [],
  rowBarCounts,
  barsPerRow = 4,
  tone = 'light',
  compact = false,
  style,
}: TabPreviewContentProps) {
  const isDark = tone === 'dark';
  const resolvedRowBarCounts = resolveRowBarCounts(bars, rowBarCounts, barsPerRow);
  let barCursor = 0;

  return (
    <View style={[styles.preview, style]}>
      {resolvedRowBarCounts.map((barCount, rowIndex) => {
        const rowBars = bars.slice(barCursor, barCursor + barCount);
        const annotation = rowAnnotations[rowIndex];
        barCursor += barCount;

        return (
          <View key={`preview-row-${rowIndex}`} style={styles.rowBlock}>
            {annotation?.label?.trim() ? (
              <Text
                style={[
                  compact ? styles.compactBlockLabel : styles.blockLabel,
                  isDark ? styles.darkMetaText : styles.lightMetaText,
                ]}
              >
                {annotation.label.trim()}
              </Text>
            ) : null}

            {annotation?.beforeText?.trim() ? (
              <AnnotationLine value={annotation.beforeText} compact={compact} dark={isDark} />
            ) : null}

            <Text
              style={[
                compact ? styles.compactTabText : styles.tabText,
                isDark ? styles.darkTabText : styles.lightTabText,
              ]}
            >
              {joinRenderedBars(rowBars.map(() => beatGuide))}
            </Text>

            {stringNames.map((stringName) => (
              <Text
                key={`preview-row-${rowIndex}-${stringName}`}
                style={[
                  compact ? styles.compactTabText : styles.tabText,
                  isDark ? styles.darkTabText : styles.lightTabText,
                ]}
              >
                {`${stringName} ${joinRenderedBars(
                  rowBars.map((bar) =>
                    `|${(bar.cells[stringName] ?? Array.from({ length: SLOTS_PER_BAR }, () => EMPTY_SLOT))
                      .map(slotToSegment)
                      .join('')}|`,
                  ),
                )}`}
              </Text>
            ))}

            {annotation?.afterText?.trim() ? (
              <AnnotationLine value={annotation.afterText} compact={compact} dark={isDark} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const SVG_SLOT_WIDTH = 18;
const SVG_SLOT_GAP = 4;
const SVG_ROW_PADDING = 12;
const SVG_STRING_SPACING = 20;
const SVG_MIN_ROW_WIDTH = 240;
const SVG_MIN_ROW_HEIGHT = 70;
const SVG_LINE_STROKE = 1;
const SVG_BAR_STROKE = 1.4;
const SVG_FRET_FONT_SIZE = 12;
const SVG_NOTE_MARGIN = 32;
const SVG_STEM_HEIGHT = 26;
const SVG_HOLD4_RADIUS = 12;
const SVG_HOLD2_RADIUS = 9;
const SVG_CIRCLE_OFFSET = 5;
const SVG_FLAG_WIDTH = 6;
const SVG_FLAG_HEIGHT = 8;
const SVG_STEM_X_OFFSET = 5;
const SVG_SHORT_BEAT_STEM_LEFT_ADJUST = 3;
const SVG_SHORT_BEAT_STEM_Y_OFFSET = 10;

function SvgTabPagePreview({
  stringNames,
  bars,
  rowAnnotations = [],
  rowBarCounts,
  barsPerRow = 4,
  tone = 'light',
  compact = false,
  style,
}: TabPreviewContentProps) {
  const isDark = tone === 'dark';
  const resolvedRowBarCounts = resolveRowBarCounts(bars, rowBarCounts, barsPerRow);
  let barCursor = 0;

  const slotAdvance = SVG_SLOT_WIDTH + SVG_SLOT_GAP;

  return (
    <View style={[styles.preview, style]}>
      {resolvedRowBarCounts.map((barCount, rowIndex) => {
        const rowBars = bars.slice(barCursor, barCursor + barCount);
        const annotation = rowAnnotations[rowIndex];
        barCursor += barCount;

        const effectiveBarCount = Math.max(rowBars.length, 1);
        const gridWidth = effectiveBarCount * SLOTS_PER_BAR * slotAdvance;
        const svgWidth = Math.max(gridWidth + SVG_ROW_PADDING * 2 + SVG_NOTE_MARGIN, SVG_MIN_ROW_WIDTH);
        const stringPositions =
          stringNames.length > 0
            ? stringNames.map((_, index) => SVG_ROW_PADDING + index * SVG_STRING_SPACING)
            : [SVG_ROW_PADDING];
        const svgHeight = Math.max(
          (stringPositions[stringPositions.length - 1] ?? SVG_ROW_PADDING) + SVG_ROW_PADDING,
          SVG_MIN_ROW_HEIGHT,
        );
        const lineColor = isDark ? palette.liveText : palette.border;
        const fretColor = isDark ? palette.liveAccent : palette.primary;
        const accentColor = isDark ? palette.liveAccent : palette.accent;

        return (
          <View key={`preview-row-${rowIndex}`} style={[styles.rowBlock, styles.svgRow]}>
            {annotation?.label?.trim() ? (
              <Text
                style={[
                  compact ? styles.compactBlockLabel : styles.blockLabel,
                  isDark ? styles.darkMetaText : styles.lightMetaText,
                ]}
              >
                {annotation.label.trim()}
              </Text>
            ) : null}

            {annotation?.beforeText?.trim() ? (
              <AnnotationLine value={annotation.beforeText} compact={compact} dark={isDark} />
            ) : null}

            <View style={[styles.svgRowContent, { minHeight: svgHeight }]}>
              <View style={[styles.svgLabelColumn, { height: svgHeight + 4 }]}>
                {stringNames.map((stringName, stringIndex) => (
                  <Text
                    key={`svg-label-${stringIndex}`}
                    style={[
                      styles.svgLabelText,
                      compact && styles.compactSvgLabelText,
                      isDark ? styles.darkMetaText : styles.lightMetaText,
                    ]}
                  >
                    {stringName}
                  </Text>
                ))}
              </View>

              <Svg width={svgWidth} height={svgHeight}>
                {stringPositions.map((position, stringIndex) => (
                  <Line
                    key={`svg-string-${stringIndex}`}
                    x1={SVG_ROW_PADDING}
                    x2={svgWidth - SVG_ROW_PADDING}
                    y1={position}
                    y2={position}
                    stroke={lineColor}
                    strokeWidth={SVG_LINE_STROKE}
                  />
                ))}

                {Array.from({ length: effectiveBarCount + 1 }).map((_, lineIndex) => {
                  const xPosition = SVG_ROW_PADDING + lineIndex * SLOTS_PER_BAR * slotAdvance;
                  return (
                    <Line
                      key={`svg-bar-${lineIndex}`}
                      x1={xPosition}
                      x2={xPosition}
                      y1={stringPositions[0]}
                      y2={stringPositions[stringPositions.length - 1]}
                      stroke={lineColor}
                      strokeWidth={SVG_BAR_STROKE}
                    />
                  );
                })}

                {rowBars.map((bar, barIndex) =>
                  stringNames.map((stringName, stringIndex) =>
                    (bar.cells[stringName] ?? Array.from({ length: SLOTS_PER_BAR }, () => EMPTY_SLOT)).map(
                      (slot, slotIndex) => {
                        if (isEmptySlotValue(slot)) {
                          return null;
                        }

                        const trimmed = slot.trim();
                        const fretX =
                          SVG_ROW_PADDING +
                          barIndex * SLOTS_PER_BAR * slotAdvance +
                          slotIndex * slotAdvance +
                          SVG_SLOT_WIDTH / 2;
                        const fretY = stringPositions[stringIndex];
                        const noteStyle = getNoteRenderStyle({
                          rowBars,
                          stringName,
                          barIndex,
                          slotIndex,
                        });
                        const shortBeatStemBaseY = fretY - SVG_SHORT_BEAT_STEM_Y_OFFSET;
                        const stemTop = shortBeatStemBaseY - SVG_STEM_HEIGHT;
                        const circleCenterY =
                          noteStyle === 'hold4' || noteStyle === 'hold2'
                            ? fretY - SVG_CIRCLE_OFFSET
                            : fretY;
                        const circleRadius =
                          noteStyle === 'hold4'
                            ? SVG_HOLD4_RADIUS
                            : noteStyle === 'hold2'
                              ? SVG_HOLD2_RADIUS
                              : 0;
                        const circleTopY = circleCenterY - circleRadius;
                        const tailOriginY =
                          noteStyle === 'short'
                            ? stemTop
                            : noteStyle === 'hold2'
                              ? circleTopY
                              : undefined;
                        const shouldDrawStem = noteStyle === 'short' || noteStyle === 'beat';
                        const shouldDrawHoldTail = noteStyle === 'hold2';
                        const stemX =
                          noteStyle === 'short' || noteStyle === 'beat'
                            ? fretX + SVG_STEM_X_OFFSET - SVG_SHORT_BEAT_STEM_LEFT_ADJUST
                            : fretX;

                        return (
                          <Fragment key={`svg-fret-${rowIndex}-${barIndex}-${stringName}-${slotIndex}`}>
                            <SvgText
                              x={fretX}
                              y={fretY}
                              fill={fretColor}
                              fontSize={SVG_FRET_FONT_SIZE}
                              textAnchor="middle"
                              alignmentBaseline="middle"
                            >
                              {trimmed}
                            </SvgText>

                            {shouldDrawStem && renderNoteMarker(stemX, shortBeatStemBaseY, accentColor)}
                            {shouldDrawHoldTail && renderHoldTail(fretX, circleTopY, accentColor)}
                            {tailOriginY !== undefined && noteStyle !== 'hold2' &&
                              renderQuaverFlag(stemX, tailOriginY, accentColor)}
                            {(noteStyle === 'hold4' || noteStyle === 'hold2') && (
                              <Circle
                                cx={fretX}
                                cy={circleCenterY}
                                r={circleRadius}
                                stroke={accentColor}
                                strokeWidth={2}
                                fill="none"
                              />
                            )}
                          </Fragment>
                        );
                      },
                    ),
                  ),
                )}
              </Svg>
            </View>

            {annotation?.afterText?.trim() ? (
              <AnnotationLine value={annotation.afterText} compact={compact} dark={isDark} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function AnnotationLine({
  value,
  compact,
  dark,
}: {
  value: string;
  compact: boolean;
  dark: boolean;
}) {
  const { align, text } = parseAlignment(value);
  const segments = parseSegments(text);

  return (
    <View
      style={[
        styles.annotationRow,
        align === 'center' && styles.centerAlign,
        align === 'right' && styles.rightAlign,
      ]}
    >
      <Text
        style={[
          compact ? styles.compactAnnotationText : styles.annotationText,
          dark ? styles.darkAnnotationText : styles.lightAnnotationText,
        ]}
      >
        {segments.map((segment, index) => (
          <Fragment key={`${segment.text}-${index}`}>
            <Text
              style={[
                segment.bold && styles.boldText,
                segment.underline && styles.underlineText,
              ]}
            >
              {segment.text}
            </Text>
          </Fragment>
        ))}
      </Text>
    </View>
  );
}

const monoWeb = Platform.select({
  web: {
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    wordBreak: 'normal',
  } as TextStyle,
  default: {},
});

const styles = StyleSheet.create({
  preview: {
    gap: 8,
  },
  rowBlock: {
    gap: 2,
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  compactBlockLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  annotationRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 1,
  },
  centerAlign: {
    alignItems: 'center',
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  annotationText: {
    fontSize: 11,
    lineHeight: 14,
  },
  compactAnnotationText: {
    fontSize: 9,
    lineHeight: 11,
  },
  tabText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 14,
    ...monoWeb,
  },
  compactTabText: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 12,
    ...monoWeb,
  },
  darkTabText: {
    color: palette.liveText,
  },
  lightTabText: {
    color: '#111827',
  },
  darkAnnotationText: {
    color: palette.liveAccent,
  },
  lightAnnotationText: {
    color: palette.primary,
  },
  darkMetaText: {
    color: palette.liveMuted,
  },
  lightMetaText: {
    color: '#475569',
  },
  boldText: {
    fontWeight: '700',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  svgRow: {
    gap: 8,
  },
  svgRowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  svgLabelColumn: {
    justifyContent: 'space-between',
  },
  svgLabelText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 18,
  },
  compactSvgLabelText: {
    fontSize: 10,
  },
});
