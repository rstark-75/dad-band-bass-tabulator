export interface TabRowAnnotation {
  label: string;
  beforeText: string;
  afterText: string;
}

export interface Section {
  id: string;
  name: string;
  notes: string;
  tab: string;
  rowAnnotations?: TabRowAnnotation[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  feelNote: string;
  tuning: string;
  updatedAt: string;
  sections: Section[];
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
