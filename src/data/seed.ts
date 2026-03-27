import { Setlist, Song } from '../types/models';

export const seededSongs: Song[] = [
  {
    id: 'song-midnight-train',
    title: 'Midnight Train',
    artist: 'Northline',
    key: 'A',
    feelNote: 'Mid-tempo pocket',
    tuning: 'Standard (E A D G)',
    updatedAt: '2026-03-26T18:30:00.000Z',
    sections: [
      {
        id: 'section-midnight-intro',
        name: 'Intro',
        notes: 'Palm mute the first bar, then open up on the slide.',
        tab: 'G|----------------|\nD|----------------|\nA|--5-5---5/7--7--|\nE|0-----0---------|',
      },
      {
        id: 'section-midnight-verse',
        name: 'Verse',
        notes: 'Sit behind the kick. Keep the eighths even.',
        tab: 'G|----------------|\nD|----------------|\nA|7-7-7-7--5-5-5-5|\nE|----------------|',
      },
      {
        id: 'section-midnight-chorus',
        name: 'Chorus',
        notes: 'Open the chorus with more sustain and let bar 4 breathe.',
        tab: 'G|----------------|\nD|----------------|\nA|7---7---9---5---|\nE|0---0---0---0---|',
      },
    ],
  },
  {
    id: 'song-dockside',
    title: 'Dockside Lights',
    artist: 'The Harbors',
    key: 'E',
    feelNote: 'Driving with space',
    tuning: 'Drop D (D A D G)',
    updatedAt: '2026-03-24T08:15:00.000Z',
    sections: [
      {
        id: 'section-dockside-intro',
        name: 'Intro',
        notes: 'Count 2 bars before the pickup. Guitar is sparse here.',
        tab: 'G|----------------|\nD|----------------|\nA|----------------|\nD|0-0-3-5---------|',
      },
      {
        id: 'section-dockside-verse',
        name: 'Verse',
        notes: 'Root-fifth pattern. Hold the downbeat on bar 8.',
        tab: 'G|----------------|\nD|----------------|\nA|2---2---5---5---|\nD|0---0---3---3---|',
      },
      {
        id: 'section-dockside-bridge',
        name: 'Bridge',
        notes: 'Move up the neck and keep the phrasing legato.',
        tab: 'G|----------------|\nD|7---7---9---9---|\nA|----------------|\nD|----------------|',
      },
    ],
  },
  {
    id: 'song-glass-river',
    title: 'Glass River',
    artist: 'Ivy Arcade',
    key: 'D',
    feelNote: 'Laid back ballad',
    tuning: 'Standard (E A D G)',
    updatedAt: '2026-03-20T21:05:00.000Z',
    sections: [
      {
        id: 'section-glass-verse',
        name: 'Verse',
        notes: 'Lay back behind the vocal. Sparse notes, lots of space.',
        tab: 'G|----------------|\nD|--------7-------|\nA|5---5-------5---|\nE|----------------|',
      },
      {
        id: 'section-glass-chorus',
        name: 'Chorus',
        notes: 'Drive the chorus without rushing the snare.',
        tab: 'G|----------------|\nD|7---7---9---7---|\nA|5---5---7---5---|\nE|----------------|',
      },
      {
        id: 'section-glass-outro',
        name: 'Outro',
        notes: 'Fade with drummer. Watch the MD for the cutoff.',
        tab: 'G|----------------|\nD|----------------|\nA|5---5-----------|\nE|----3---1---0---|',
      },
    ],
  },
];

export const seededSetlist: Setlist = {
  id: 'setlist-main',
  name: 'Saturday Rehearsal',
  updatedAt: '2026-03-26T19:00:00.000Z',
  songIds: ['song-midnight-train', 'song-dockside', 'song-glass-river'],
};
