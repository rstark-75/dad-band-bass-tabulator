import { SongBar, SongRow } from '../types/models';

export interface SongMetadataDto {
  id: string;
  title: string;
  artist: string;
  key: string;
  feelNote: string;
  tuning: string;
  updatedAt: string;
}

export interface SongChartDto {
  stringNames: string[];
  rows: SongRow[];
}

export interface SongDto extends SongMetadataDto {
  chart: SongChartDto;
}

export interface PlaylistDto {
  id: string;
  name: string;
  updatedAt: string;
  songIds: string[];
}

export interface CreateSongRequestDto {
  title: string;
  artist: string;
  key: string;
  feelNote: string;
  tuning: string;
  chart: SongChartDto;
}

export interface UpdateSongMetadataRequestDto {
  title?: string;
  artist?: string;
  key?: string;
  feelNote?: string;
  tuning?: string;
}

export interface ReplaceSongChartRequestDto {
  chart: SongChartDto;
}

export interface ReplacePlaylistOrderRequestDto {
  songIds: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isSongBar = (value: unknown): value is SongBar => {
  if (!isRecord(value)) {
    return false;
  }

  const { cells } = value;

  if (!isRecord(cells)) {
    return false;
  }

  return Object.values(cells).every((slots) => isStringArray(slots));
};

const isSongRow = (value: unknown): value is SongRow => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.beforeText === 'string' &&
    typeof value.afterText === 'string' &&
    Array.isArray(value.bars) &&
    value.bars.every((bar) => isSongBar(bar))
  );
};

const isSongChartDto = (value: unknown): value is SongChartDto => {
  if (!isRecord(value)) {
    return false;
  }

  return isStringArray(value.stringNames) && Array.isArray(value.rows) && value.rows.every((row) => isSongRow(row));
};

const isSongMetadataDto = (value: unknown): value is SongMetadataDto => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.artist === 'string' &&
    typeof value.key === 'string' &&
    typeof value.feelNote === 'string' &&
    typeof value.tuning === 'string' &&
    typeof value.updatedAt === 'string'
  );
};

const isSongDto = (value: unknown): value is SongDto =>
  isSongMetadataDto(value) && isSongChartDto((value as SongDto).chart);

const isPlaylistDto = (value: unknown): value is PlaylistDto => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.updatedAt === 'string' &&
    isStringArray(value.songIds)
  );
};

export const parseSongMetadataListDto = (value: unknown): SongMetadataDto[] => {
  if (!Array.isArray(value) || !value.every((item) => isSongMetadataDto(item))) {
    throw new Error('Invalid songs metadata response payload.');
  }

  return value;
};

export const parseSongMetadataDto = (value: unknown): SongMetadataDto => {
  if (!isSongMetadataDto(value)) {
    throw new Error('Invalid song metadata response payload.');
  }

  return value;
};

export const parseSongChartDto = (value: unknown): SongChartDto => {
  if (!isSongChartDto(value)) {
    throw new Error('Invalid song chart response payload.');
  }

  return value;
};

export const parseSongDto = (value: unknown): SongDto => {
  if (!isSongDto(value)) {
    throw new Error('Invalid song response payload.');
  }

  return value;
};

export const parsePlaylistDto = (value: unknown): PlaylistDto => {
  if (!isPlaylistDto(value)) {
    throw new Error('Invalid playlist response payload.');
  }

  return value;
};
