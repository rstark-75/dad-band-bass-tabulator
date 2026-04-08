import type { ParsedBar } from './tabLayout.ts';
import { EMPTY_SLOT, getBarSlotCount } from './tabLayout.ts';

export type NoteRenderStyle = 'short' | 'beat' | 'hold2' | 'hold4';

export const isEmptySlotValue = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === EMPTY_SLOT || /^-+$/.test(trimmed);
};

export const isNumericTabValue = (value: string): boolean => {
  const trimmed = value.trim();

  if (!trimmed || trimmed === EMPTY_SLOT) {
    return false;
  }

  return /^\d+$/.test(trimmed.replace(/-+$/g, ''));
};

const mapEmptyCountToStyle = (emptyCount: number): NoteRenderStyle => {
  if (emptyCount === 0) {
    return 'short';
  }

  if (emptyCount === 1) {
    return 'beat';
  }

  // Empty count is duration-1 across the current row's slot grid.
  // Use circle+stem for anything longer than a beat and shorter than a whole note,
  // and reserve circle-only for whole note and longer sustains.
  if (emptyCount >= 7) {
    return 'hold4';
  }

  return 'hold2';
};

const getBarAndSlotAtAbsolute = (
  rowBars: ParsedBar[],
  absoluteSlotIndex: number,
): { barIndex: number; slotIndex: number } | null => {
  let cursor = 0;

  for (let index = 0; index < rowBars.length; index += 1) {
    const slotCount = getBarSlotCount(rowBars[index]);
    if (absoluteSlotIndex < cursor + slotCount) {
      return {
        barIndex: index,
        slotIndex: absoluteSlotIndex - cursor,
      };
    }
    cursor += slotCount;
  }

  return null;
};

const hasNoteAtSlotOnString = (
  rowBars: ParsedBar[],
  stringName: string,
  absoluteSlotIndex: number,
): boolean => {
  const location = getBarAndSlotAtAbsolute(rowBars, absoluteSlotIndex);

  if (!location) {
    return false;
  }

  const bar = rowBars[location.barIndex];

  if (!bar) {
    return false;
  }

  const value = bar.cells[stringName]?.[location.slotIndex];

  if (typeof value !== 'string') {
    return false;
  }

  return isNumericTabValue(value);
};

const hasAnyNoteAtAbsoluteSlot = (
  rowBars: ParsedBar[],
  absoluteSlotIndex: number,
): boolean => {
  const location = getBarAndSlotAtAbsolute(rowBars, absoluteSlotIndex);

  if (!location) {
    return false;
  }

  const bar = rowBars[location.barIndex];

  return Object.values(bar.cells).some((slots) => {
    const value = slots?.[location.slotIndex];
    return typeof value === 'string' && isNumericTabValue(value);
  });
};

const computeEmptySlotsUntilNextOnset = (
  rowBars: ParsedBar[],
  absoluteSlotIndex: number,
  stopAtAbsoluteSlotExclusive?: number,
): number => {
  const totalSlots = rowBars.reduce((sum, bar) => sum + getBarSlotCount(bar), 0);
  const maxSlotExclusive =
    typeof stopAtAbsoluteSlotExclusive === 'number'
      ? Math.min(totalSlots, stopAtAbsoluteSlotExclusive)
      : totalSlots;
  let lookahead = absoluteSlotIndex + 1;
  let emptyCount = 0;

  while (lookahead < maxSlotExclusive) {
    if (hasAnyNoteAtAbsoluteSlot(rowBars, lookahead)) {
      break;
    }

    emptyCount += 1;
    lookahead += 1;
  }

  return emptyCount;
};

export const getNoteRenderStyle = ({
  rowBars,
  stringName,
  barIndex,
  slotIndex,
}: {
  rowBars: ParsedBar[];
  stringName: string;
  barIndex: number;
  slotIndex: number;
}): NoteRenderStyle => {
  const absoluteBarStartSlot = rowBars
    .slice(0, barIndex)
    .reduce((sum, bar) => sum + getBarSlotCount(bar), 0);
  const absoluteSlotIndex = absoluteBarStartSlot + slotIndex;
  const absoluteBarEndSlotExclusive = absoluteBarStartSlot + getBarSlotCount(rowBars[barIndex]);

  if (!hasNoteAtSlotOnString(rowBars, stringName, absoluteSlotIndex)) {
    return 'short';
  }

  const emptyCount = computeEmptySlotsUntilNextOnset(
    rowBars,
    absoluteSlotIndex,
    absoluteBarEndSlotExclusive,
  );

  return mapEmptyCountToStyle(emptyCount);
};
