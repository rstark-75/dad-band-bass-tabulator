import { SongBar, SongBarEvent } from '../types/models';
import { DEFAULT_BEAT_COUNT, normalizeBeatCount } from './tabLayout';

export const EDITOR_EMPTY_SLOT = '--';

export type EditorBeatSplit = 2 | 3 | 4;

export interface EditorBeat {
  beatNumber: number;
  split: EditorBeatSplit;
  pulseLabels: string[];
  sourceEventId?: string;
  segmentsByString: Record<string, string[]>;
}

export interface EditorBar {
  note?: string;
  beats: EditorBeat[];
}

const clampSplit = (value: number): EditorBeatSplit => {
  if (value <= 2) {
    return 2;
  }

  if (value === 3) {
    return 3;
  }

  return 4;
};

export const normalizeEditorSlotToken = (value: string | undefined): string => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : EDITOR_EMPTY_SLOT;
};

const buildDefaultPulseLabels = (beatNumber: number, split: EditorBeatSplit): string[] => {
  if (split === 2) {
    return [String(beatNumber), '&'];
  }

  if (split === 3) {
    return [String(beatNumber), '&', 'a'];
  }

  return [String(beatNumber), 'e', '&', 'a'];
};

const normalizeSegments = (segments: string[], split: EditorBeatSplit): string[] => {
  const next = segments.slice(0, split).map((segment) => normalizeEditorSlotToken(segment));
  while (next.length < split) {
    next.push(EDITOR_EMPTY_SLOT);
  }
  return next;
};

const getEventPulseCount = (event: SongBarEvent): number =>
  Math.max(
    1,
    event.pulseLabels.length,
    ...Object.values(event.cells).map((eventCells) => eventCells?.[0]?.segments.length ?? 0),
  );

const buildLegacyBeats = (
  bar: SongBar,
  stringNames: string[],
  fallbackBeatCount: number,
): EditorBeat[] => {
  const beatCount = normalizeBeatCount(bar.beatCount ?? fallbackBeatCount ?? DEFAULT_BEAT_COUNT);
  const beats: EditorBeat[] = [];

  for (let beatIndex = 0; beatIndex < beatCount; beatIndex += 1) {
    const beatNumber = beatIndex + 1;
    const split: EditorBeatSplit = 2;
    const startSlot = beatIndex * split;
    const segmentsByString: Record<string, string[]> = {};

    for (const stringName of stringNames) {
      segmentsByString[stringName] = normalizeSegments(
        (bar.cells[stringName] ?? []).slice(startSlot, startSlot + split),
        split,
      );
    }

    beats.push({
      beatNumber,
      split,
      pulseLabels: buildDefaultPulseLabels(beatNumber, split),
      segmentsByString,
    });
  }

  return beats;
};

export const projectSongBarToEditorBar = (
  bar: SongBar,
  stringNames: string[],
  fallbackBeatCount = DEFAULT_BEAT_COUNT,
): EditorBar => {
  if (!Array.isArray(bar.events) || bar.events.length === 0) {
    return {
      note: bar.note,
      beats: buildLegacyBeats(bar, stringNames, fallbackBeatCount),
    };
  }

  const orderedEvents = [...bar.events].sort(
    (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
  );

  const beats = orderedEvents.map((event, eventIndex) => {
    const beatNumber =
      typeof event.beatStart === 'number' && Number.isFinite(event.beatStart)
        ? Math.max(1, Math.round(event.beatStart))
        : eventIndex + 1;
    const split = clampSplit(getEventPulseCount(event));
    const segmentsByString: Record<string, string[]> = {};

    for (const stringName of stringNames) {
      const eventSegments = event.cells[stringName]?.[0]?.segments ?? [];
      segmentsByString[stringName] = normalizeSegments(eventSegments, split);
    }

    const pulseLabels = normalizeSegments(event.pulseLabels, split).map((value, pulseIndex) =>
      value === EDITOR_EMPTY_SLOT
        ? buildDefaultPulseLabels(beatNumber, split)[pulseIndex]
        : value,
    );

    return {
      beatNumber,
      split,
      pulseLabels,
      sourceEventId: event.id,
      segmentsByString,
    };
  });

  return {
    note: bar.note,
    beats,
  };
};

const buildEventCells = (segments: string[]): SongBarEvent['cells'][string] => {
  const normalized = segments.map((segment) => normalizeEditorSlotToken(segment));
  if (normalized.every((segment) => segment === EDITOR_EMPTY_SLOT)) {
    return [];
  }
  return [{ text: normalized.join(''), segments: normalized }];
};

export const projectEditorBarToSongBar = (
  editorBar: EditorBar,
  stringNames: string[],
): SongBar => {
  const events: SongBarEvent[] = editorBar.beats.map((beat, beatIndex) => {
    const pulseLabels =
      beat.pulseLabels.length === beat.split
        ? [...beat.pulseLabels]
        : buildDefaultPulseLabels(beat.beatNumber, beat.split);
    const cells: SongBarEvent['cells'] = Object.fromEntries(
      stringNames.map((stringName) => [
        stringName,
        buildEventCells(normalizeSegments(beat.segmentsByString[stringName] ?? [], beat.split)),
      ]),
    );

    return {
      ...(beat.sourceEventId ? { id: beat.sourceEventId } : {}),
      order: beatIndex + 1,
      timingText: pulseLabels.join(''),
      beatStart: beat.beatNumber,
      beatEnd: beat.beatNumber,
      pulseLabels,
      cells,
    };
  });

  const cells = Object.fromEntries(
    stringNames.map((stringName) => [
      stringName,
      editorBar.beats.flatMap((beat) => normalizeSegments(beat.segmentsByString[stringName] ?? [], beat.split)),
    ]),
  );

  return {
    ...(editorBar.note !== undefined ? { note: editorBar.note } : {}),
    beatCount: editorBar.beats.length,
    events,
    cells,
  };
};

export const getSongBarBeatCountFromEvents = (
  bar: SongBar,
  stringNames: string[],
  fallbackBeatCount = DEFAULT_BEAT_COUNT,
): number => projectSongBarToEditorBar(bar, stringNames, fallbackBeatCount).beats.length;

export const getSongBarSlotCountFromEvents = (
  bar: SongBar,
  stringNames: string[],
  fallbackBeatCount = DEFAULT_BEAT_COUNT,
): number =>
  projectSongBarToEditorBar(bar, stringNames, fallbackBeatCount).beats.reduce(
    (sum, beat) => sum + beat.split,
    0,
  );

