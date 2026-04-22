import { createId } from './ids';
import { DEFAULT_BEAT_COUNT, getSlotsPerBar, normalizeBeatCount } from './tabLayout';
import {
  SongBar,
  SongBarEvent,
  SongInstructionBar,
  SongPlayableBar,
  SongTextInstruction,
} from '../types/models';

const EMPTY_SLOT = '-';

export const isPlayableBar = (bar: SongBar): bar is SongPlayableBar => bar.type === 'PLAYABLE';
export const isInstructionBar = (bar: SongBar): bar is SongInstructionBar => bar.type === 'INSTRUCTION';

export const createPlayableBar = (
  stringNames: string[],
  beatCount = DEFAULT_BEAT_COUNT,
): SongPlayableBar => {
  const normalizedBeatCount = normalizeBeatCount(beatCount);
  const slotCount = getSlotsPerBar(normalizedBeatCount);

  return {
    id: createId('bar'),
    type: 'PLAYABLE',
    beatCount: normalizedBeatCount,
    note: '',
    events: [],
    cells: Object.fromEntries(
      stringNames.map((stringName) => [stringName, Array.from({ length: slotCount }, () => EMPTY_SLOT)]),
    ),
  };
};

export const createInstructionBar = (
  stringNames: string[],
  text = '',
): SongInstructionBar => ({
  id: createId('bar'),
  type: 'INSTRUCTION',
  instruction: {
    kind: 'TEXT',
    text,
  },
  note: '',
  cells: Object.fromEntries(stringNames.map((stringName) => [stringName, []])),
});

export const normalizePlayableEvents = (events: SongBarEvent[] | undefined): SongBarEvent[] =>
  Array.isArray(events) ? events : [];

export const normalizeInstruction = (instruction: SongTextInstruction | undefined): SongTextInstruction => ({
  kind: 'TEXT',
  text: typeof instruction?.text === 'string' ? instruction.text : '',
  ...(instruction ? instruction : {}),
});

export const normalizeBarForEditor = (
  bar: Partial<SongBar> & { cells?: Record<string, string[]>; events?: SongBarEvent[] },
  stringNames: string[],
  fallbackBeatCount = DEFAULT_BEAT_COUNT,
): SongBar => {
  const id = typeof bar.id === 'string' ? bar.id : createId('bar');
  const beatCount = normalizeBeatCount(bar.beatCount ?? fallbackBeatCount);
  const normalizedCells = Object.fromEntries(
    stringNames.map((stringName) => [stringName, [...(bar.cells?.[stringName] ?? [])]]),
  );
  const inferredType =
    bar.type === 'PLAYABLE' || bar.type === 'INSTRUCTION'
      ? bar.type
      : Array.isArray(bar.events)
        ? 'PLAYABLE'
        : bar.instruction
          ? 'INSTRUCTION'
          : 'PLAYABLE';

  if (inferredType === 'INSTRUCTION') {
    return {
      id,
      type: 'INSTRUCTION',
      note: typeof bar.note === 'string' ? bar.note : undefined,
      instruction: normalizeInstruction(bar.instruction as SongTextInstruction | undefined),
      cells: normalizedCells,
      beatCount,
    };
  }

  return {
    id,
    type: 'PLAYABLE',
    note: typeof bar.note === 'string' ? bar.note : undefined,
    events: normalizePlayableEvents(bar.events),
    cells: normalizedCells,
    beatCount,
  };
};

export interface BarValidationIssue {
  barIndex: number;
  message: string;
}

export const validateBar = (bar: SongBar, barIndex: number): BarValidationIssue[] => {
  const issues: BarValidationIssue[] = [];

  if (isInstructionBar(bar)) {
    if (Array.isArray((bar as SongBar & { events?: SongBarEvent[] }).events) && (bar as SongBar & { events?: SongBarEvent[] }).events!.length > 0) {
      issues.push({ barIndex, message: 'Instruction bars cannot contain events' });
    }

    if (bar.instruction.kind !== 'TEXT' || bar.instruction.text.trim().length === 0) {
      issues.push({ barIndex, message: 'Instruction text is required' });
    }

    return issues;
  }

  if (!Array.isArray(bar.events) || bar.events.length === 0) {
    const hasLegacyCells = Object.keys(bar.cells ?? {}).length > 0;
    if (!hasLegacyCells) {
      issues.push({ barIndex, message: 'Playable bars must include at least one event' });
    }
  }

  if ((bar as SongBar & { instruction?: SongTextInstruction }).instruction) {
    issues.push({ barIndex, message: 'Playable bars cannot contain instruction payload' });
  }

  return issues;
};
