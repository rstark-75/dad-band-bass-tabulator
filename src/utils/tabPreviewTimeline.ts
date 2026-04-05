import type { ParsedBar } from './tabLayout.ts';
import { SLOTS_PER_BAR, EMPTY_SLOT } from './tabLayout.ts';

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

  // 8 slots = 4 beats in this grid. Empty count is duration-1.
  // Use circle+stem for anything longer than a beat and shorter than a whole note,
  // and reserve circle-only for whole note and longer sustains.
  if (emptyCount >= 7) {
    return 'hold4';
  }

  return 'hold2';
};

const hasNoteAtSlotOnString = (
  rowBars: ParsedBar[],
  stringName: string,
  absoluteSlotIndex: number,
): boolean => {
  const barIndex = Math.floor(absoluteSlotIndex / SLOTS_PER_BAR);
  const slotIndex = absoluteSlotIndex % SLOTS_PER_BAR;
  const bar = rowBars[barIndex];

  if (!bar) {
    return false;
  }

  const value = bar.cells[stringName]?.[slotIndex];

  if (typeof value !== 'string') {
    return false;
  }

  return isNumericTabValue(value);
};

const computeEmptySlotsOnString = (
  rowBars: ParsedBar[],
  stringName: string,
  absoluteSlotIndex: number,
): number => {
  const totalSlots = rowBars.length * SLOTS_PER_BAR;
  let lookahead = absoluteSlotIndex + 1;
  let emptyCount = 0;

  while (lookahead < totalSlots) {
    if (hasNoteAtSlotOnString(rowBars, stringName, lookahead)) {
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
  const absoluteSlotIndex = barIndex * SLOTS_PER_BAR + slotIndex;

  if (!hasNoteAtSlotOnString(rowBars, stringName, absoluteSlotIndex)) {
    return 'short';
  }

  const emptyCount = computeEmptySlotsOnString(rowBars, stringName, absoluteSlotIndex);

  return mapEmptyCountToStyle(emptyCount);
};
