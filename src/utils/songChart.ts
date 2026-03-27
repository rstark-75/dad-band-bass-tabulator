import { Section, TabRowAnnotation } from '../types/models';
import { ParsedBar, getRowCount, parseTab, renderTab } from './tabLayout';

const barsPerRow = 4;

const cloneAnnotation = (annotation?: TabRowAnnotation): TabRowAnnotation => ({
  label: annotation?.label ?? '',
  beforeText: annotation?.beforeText ?? '',
  afterText: annotation?.afterText ?? '',
});

const getSectionBars = (section: Section) =>
  section.tab.trim() ? parseTab(section.tab).bars : [];

const getSectionBarCounts = (sections: Section[]) =>
  sections.map((section) => getSectionBars(section).length);

const rebalanceSectionBarCounts = (counts: number[], targetTotalBars: number) => {
  const nextCounts = [...counts];
  const currentTotalBars = counts.reduce((total, count) => total + count, 0);
  let delta = targetTotalBars - currentTotalBars;

  if (delta > 0) {
    nextCounts[nextCounts.length - 1] += delta;
    return nextCounts;
  }

  for (let index = nextCounts.length - 1; index >= 0 && delta < 0; index -= 1) {
    const removable = Math.min(nextCounts[index], Math.abs(delta));
    nextCounts[index] -= removable;
    delta += removable;
  }

  return nextCounts;
};

export const flattenSectionsToChart = (sections: Section[]): Section => {
  const sourceSections =
    sections.length > 0
      ? sections
      : [
          {
            id: 'chart',
            name: 'Chart',
            notes: '',
            tab: '',
            rowAnnotations: [],
          },
        ];

  let stringNames: string[] | null = null;
  const bars: ParsedBar[] = [];
  const rowAnnotations: TabRowAnnotation[] = [];

  sourceSections.forEach((section, sectionIndex) => {
    const parsed = parseTab(section.tab);

    if (!stringNames) {
      stringNames = parsed.stringNames;
    }

    bars.push(...parsed.bars);

    const sectionRowCount = getRowCount(parsed.bars, barsPerRow);

    for (let rowIndex = 0; rowIndex < sectionRowCount; rowIndex += 1) {
      const existing = cloneAnnotation(section.rowAnnotations?.[rowIndex]);

      if (rowIndex === 0 && !existing.label.trim()) {
        existing.label = section.name || `Block ${sectionIndex + 1}`;
      }

      rowAnnotations.push(existing);
    }
  });

  const resolvedStringNames = stringNames ?? ['G', 'D', 'A', 'E'];

  return {
    id: sourceSections[0].id,
    name: 'Chart',
    notes: '',
    tab: renderTab(resolvedStringNames, bars),
    rowAnnotations,
  };
};

export const mergeChartIntoSections = (
  sourceSections: Section[],
  editedChart: Pick<Section, 'tab' | 'rowAnnotations'>,
): Section[] => {
  if (sourceSections.length === 0) {
    return [
      {
        id: 'chart',
        name: 'Chart',
        notes: '',
        tab: editedChart.tab,
        rowAnnotations: editedChart.rowAnnotations ?? [],
      },
    ];
  }

  const { stringNames, bars } = parseTab(editedChart.tab);
  const nextSectionBarCounts = rebalanceSectionBarCounts(
    getSectionBarCounts(sourceSections),
    bars.length,
  );
  const nextRowAnnotations = editedChart.rowAnnotations ?? [];

  let barCursor = 0;
  let rowCursor = 0;

  return sourceSections.map((section, sectionIndex) => {
    const barCount = nextSectionBarCounts[sectionIndex] ?? 0;
    const sectionBars = bars.slice(barCursor, barCursor + barCount);
    const sectionRowCount = barCount > 0 ? getRowCount(sectionBars, barsPerRow) : 0;
    const sectionAnnotations = nextRowAnnotations
      .slice(rowCursor, rowCursor + sectionRowCount)
      .map(cloneAnnotation);
    const nextName =
      sectionAnnotations[0]?.label?.trim() || section.name || `Block ${sectionIndex + 1}`;

    barCursor += barCount;
    rowCursor += sectionRowCount;

    return {
      ...section,
      name: nextName,
      tab: sectionBars.length > 0 ? renderTab(stringNames, sectionBars) : '',
      rowAnnotations: sectionAnnotations,
    };
  });
};
