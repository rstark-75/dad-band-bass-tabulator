export interface TabRowAnnotation {
  label: string;
  beforeText: string;
  afterText: string;
}

export interface SongBar {
  cells: Record<string, string[]>;
}

export interface SongRow {
  id: string;
  label: string;
  beforeText: string;
  afterText: string;
  bars: SongBar[];
}

export interface SongChart {
  id: string;
  name?: string;
  tab: string;
  rowAnnotations: TabRowAnnotation[];
  rowBarCounts: number[];
}

export type PublishedSongStatus = 'PUBLISHED' | 'UNLISTED' | 'MODERATION_HIDDEN';

export type CommunitySongAuthor = {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type CommunitySongVoteDirection = 'UP' | 'DOWN';

export type CommunitySongVotes = {
  upVotes: number;
  downVotes: number;
  currentUserVote: CommunitySongVoteDirection | null;
};

export type CommunitySongCard = {
  id: string;
  publishedSongId?: string | null;
  sourceSongId?: string | null;
  title: string;
  artist: string;
  key?: string | null;
  tuning?: string | null;
  feelNote?: string | null;
  author?: CommunitySongAuthor;
  votes: CommunitySongVotes;
  publishedAt: string;
  updatedAt: string;
};

export type CommunitySongDetail = CommunitySongCard & {
  chart: SongChart;
  status?: PublishedSongStatus;
  sourceSongId?: string;
};

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  feelNote: string;
  tuning: string;
  updatedAt: string;
  stringNames: string[];
  rows: SongRow[];
}

export interface SetlistSong {
  songId: string;
  order: number;
}

export interface Setlist {
  id: string;
  name: string;
  updatedAt: string;
  songIds: string[];
}
