import { Fragment } from 'react';
import { Platform, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { palette } from '../constants/colors';
import { ParsedBar, TabRowAnnotation } from '../utils/tabLayout';

interface TabPagePreviewProps {
  stringNames: string[];
  bars: ParsedBar[];
  rowAnnotations?: TabRowAnnotation[];
  barsPerRow?: number;
  tone?: 'light' | 'dark';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
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
  if (!value || value === '-') {
    return '--';
  }

  return value.padEnd(2, '-').slice(0, 2);
};

const parseAlignment = (value: string): AnnotationFormat => {
  const trimmed = value.trim();
  const match = trimmed.match(/^\[(left|center|right)\]\s*/i);

  if (!match) {
    return { align: 'left', text: trimmed };
  }

  return {
    align: match[1].toLowerCase() as AnnotationFormat['align'],
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

export function TabPagePreview({
  stringNames,
  bars,
  rowAnnotations = [],
  barsPerRow = 4,
  tone = 'light',
  compact = false,
  style,
}: TabPagePreviewProps) {
  const isDark = tone === 'dark';

  return (
    <View style={[styles.preview, style]}>
      {Array.from({ length: Math.max(1, Math.ceil(bars.length / barsPerRow)) }, (_, rowIndex) => {
        const rowBars = bars.slice(rowIndex * barsPerRow, rowIndex * barsPerRow + barsPerRow);
        const annotation = rowAnnotations[rowIndex];

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
              <AnnotationLine
                value={annotation.beforeText}
                compact={compact}
                dark={isDark}
              />
            ) : null}

            <Text
              style={[
                compact ? styles.compactTabText : styles.tabText,
                isDark ? styles.darkTabText : styles.lightTabText,
              ]}
            >
              {rowBars.map(() => beatGuide).join(' ')}
            </Text>

            {stringNames.map((stringName) => (
              <Text
                key={`preview-row-${rowIndex}-${stringName}`}
                style={[
                  compact ? styles.compactTabText : styles.tabText,
                  isDark ? styles.darkTabText : styles.lightTabText,
                ]}
              >
                {`${stringName} ${rowBars
                  .map((bar) =>
                    `|${(bar.cells[stringName] ?? []).map(slotToSegment).join('')}|`,
                  )
                  .join(' ')}`}
              </Text>
            ))}

            {annotation?.afterText?.trim() ? (
              <AnnotationLine
                value={annotation.afterText}
                compact={compact}
                dark={isDark}
              />
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
});
