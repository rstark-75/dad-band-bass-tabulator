const DEFAULT_STRING_NAMES = ['G', 'D', 'A', 'E'];
const SLOTS_PER_BAR = 8;
const CHARS_PER_SLOT = 2;
const EMPTY_SLOT = '-';
const BARS_PER_ROW = 4;

export interface ParsedBar {
  cells: Record<string, string[]>;
}

export interface ParsedTabLayout {
  stringNames: string[];
  bars: ParsedBar[];
}

export interface TabRowAnnotation {
  label: string;
  beforeText: string;
  afterText: string;
}

const createEmptyBar = (stringNames: string[]): ParsedBar => ({
  cells: Object.fromEntries(
    stringNames.map((stringName) => [
      stringName,
      Array.from({ length: SLOTS_PER_BAR }, () => EMPTY_SLOT),
    ]),
  ),
});

const normalizeSlot = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    return EMPTY_SLOT;
  }

  return trimmed.slice(0, CHARS_PER_SLOT);
};

const segmentToSlots = (segment: string): string[] => {
  const sanitized = segment.replace(/\s/g, '');

  if (!sanitized) {
    return Array.from({ length: SLOTS_PER_BAR }, () => EMPTY_SLOT);
  }

  const chunkSize = sanitized.length <= SLOTS_PER_BAR ? 1 : CHARS_PER_SLOT;
  const slots: string[] = [];

  for (let index = 0; index < sanitized.length && slots.length < SLOTS_PER_BAR; index += chunkSize) {
    slots.push(normalizeSlot(sanitized.slice(index, index + chunkSize)));
  }

  while (slots.length < SLOTS_PER_BAR) {
    slots.push(EMPTY_SLOT);
  }

  return slots;
};

const slotToSegment = (value: string): string => {
  const normalized = normalizeSlot(value);

  if (normalized === EMPTY_SLOT) {
    return '--';
  }

  return normalized.padEnd(CHARS_PER_SLOT, '-');
};

export const parseTab = (tab: string): ParsedTabLayout => {
  const lines = tab
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.includes('|'));

  if (lines.length === 0) {
    return {
      stringNames: DEFAULT_STRING_NAMES,
      bars: [createEmptyBar(DEFAULT_STRING_NAMES)],
    };
  }

  const parsedLines = lines.map((line) => {
    const [label, ...rawSegments] = line.split('|');
    const segments = rawSegments.filter((segment, index) => {
      const isLastEmpty = index === rawSegments.length - 1 && segment === '';
      return !isLastEmpty;
    });

    return {
      label: label.trim() || DEFAULT_STRING_NAMES[0],
      segments,
    };
  });

  const stringNames = parsedLines.map((line) => line.label);
  const barCount = Math.max(
    1,
    ...parsedLines.map((line) => line.segments.length),
  );

  const bars = Array.from({ length: barCount }, (_, barIndex) => {
    const bar = createEmptyBar(stringNames);

    parsedLines.forEach((line) => {
      bar.cells[line.label] = segmentToSlots(line.segments[barIndex] ?? '');
    });

    return bar;
  });

  return { stringNames, bars };
};

export const renderTab = (stringNames: string[], bars: ParsedBar[]): string =>
  stringNames
    .map((stringName) => {
      const renderedBars = bars
        .map((bar) =>
          (bar.cells[stringName] ?? Array.from({ length: SLOTS_PER_BAR }, () => EMPTY_SLOT))
            .map(slotToSegment)
            .join(''),
        )
        .map((segment) => `|${segment}`)
        .join('');

      return `${stringName}${renderedBars}|`;
    })
    .join('\n');

const beatGuide = '  |1 & 2 & 3 & 4 &';

export const buildTabPagePreview = (
  stringNames: string[],
  bars: ParsedBar[],
  rowAnnotations: TabRowAnnotation[] = [],
  barsPerRow = BARS_PER_ROW,
): string => {
  const rows: string[] = [];

  for (let index = 0; index < bars.length; index += barsPerRow) {
    const rowBars = bars.slice(index, index + barsPerRow);
    const rowIndex = Math.floor(index / barsPerRow);
    const annotation = rowAnnotations[rowIndex];

    if (annotation?.label?.trim()) {
      rows.push(`{${annotation.label.trim()}}`);
    }

    if (annotation?.beforeText?.trim()) {
      rows.push(`[${annotation.beforeText.trim()}]`);
    }

    rows.push(rowBars.map(() => beatGuide).join(' '));

    stringNames.forEach((stringName) => {
      const renderedLine = rowBars
        .map((bar) =>
          `|${(bar.cells[stringName] ?? Array.from({ length: SLOTS_PER_BAR }, () => EMPTY_SLOT))
            .map(slotToSegment)
            .join('')}|`,
        )
        .join(' ');

      rows.push(`${stringName} ${renderedLine}`);
    });

    if (annotation?.afterText?.trim()) {
      rows.push(`[${annotation.afterText.trim()}]`);
    }

    if (index + barsPerRow < bars.length) {
      rows.push('');
    }
  }

  return rows.join('\n');
};

export const updateBarCell = (
  bars: ParsedBar[],
  barIndex: number,
  stringName: string,
  slotIndex: number,
  value: string,
): ParsedBar[] =>
  bars.map((bar, currentBarIndex) => {
    if (currentBarIndex !== barIndex) {
      return bar;
    }

    return {
      cells: {
        ...bar.cells,
        [stringName]: (bar.cells[stringName] ?? []).map((slot, currentSlotIndex) =>
          currentSlotIndex === slotIndex ? normalizeSlot(value) : slot,
        ),
      },
    };
  });

export const insertBar = (
  bars: ParsedBar[],
  index: number,
  stringNames: string[],
  sourceBar?: ParsedBar,
): ParsedBar[] => {
  const nextBar =
    sourceBar ??
    createEmptyBar(stringNames);

  return [
    ...bars.slice(0, index),
    {
      cells: Object.fromEntries(
        stringNames.map((stringName) => [
          stringName,
          [...(nextBar.cells[stringName] ?? Array.from({ length: SLOTS_PER_BAR }, () => EMPTY_SLOT))],
        ]),
      ),
    },
    ...bars.slice(index),
  ];
};

export const removeBar = (bars: ParsedBar[], index: number, stringNames: string[]): ParsedBar[] => {
  if (bars.length === 1) {
    return [createEmptyBar(stringNames)];
  }

  return bars.filter((_, currentIndex) => currentIndex !== index);
};

export const getRowCount = (bars: ParsedBar[], barsPerRow = BARS_PER_ROW): number =>
  Math.max(1, Math.ceil(bars.length / barsPerRow));
