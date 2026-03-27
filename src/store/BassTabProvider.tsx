import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { tuningOptions } from '../constants/tunings';
import { seededSetlist, seededSongs } from '../data/seed';
import { Section, Setlist, Song } from '../types/models';
import { createId } from '../utils/ids';

interface SongInput {
  title?: string;
  artist?: string;
  key?: string;
  feelNote?: string;
  tuning?: string;
}

interface BassTabContextValue {
  songs: Song[];
  setlist: Setlist;
  createSong: (input?: SongInput) => Song;
  updateSong: (songId: string, updates: Partial<Song>) => void;
  addSection: (songId: string) => void;
  updateSection: (
    songId: string,
    sectionId: string,
    updates: Partial<Section>,
  ) => void;
  deleteSection: (songId: string, sectionId: string) => void;
  moveSection: (songId: string, sectionId: string, direction: -1 | 1) => void;
  reorderSetlist: (songIds: string[]) => void;
}

const BassTabContext = createContext<BassTabContextValue | undefined>(undefined);

const defaultSectionNames = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'];
const storageKeys = {
  songs: 'basstab:songs',
  setlist: 'basstab:setlist',
};

const updateTimestamp = (song: Song): Song => ({
  ...song,
  updatedAt: new Date().toISOString(),
});

export function BassTabProvider({ children }: PropsWithChildren) {
  const [songs, setSongs] = useState<Song[]>(seededSongs);
  const [setlist, setSetlist] = useState<Setlist>(seededSetlist);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const [storedSongs, storedSetlist] = await Promise.all([
          AsyncStorage.getItem(storageKeys.songs),
          AsyncStorage.getItem(storageKeys.setlist),
        ]);

        const parsedSongs = storedSongs ? (JSON.parse(storedSongs) as Song[]) : null;
        const parsedSetlist = storedSetlist ? (JSON.parse(storedSetlist) as Setlist) : null;

        if (!isMounted) {
          return;
        }

        if (parsedSongs && Array.isArray(parsedSongs)) {
          setSongs(parsedSongs);
        }

        if (parsedSetlist) {
          setSetlist(parsedSetlist);
        }
      } catch (error) {
        console.warn('BassTab storage hydrate failed', error);
      } finally {
        if (isMounted) {
          setHasHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const persist = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(storageKeys.songs, JSON.stringify(songs)),
          AsyncStorage.setItem(storageKeys.setlist, JSON.stringify(setlist)),
        ]);
      } catch (error) {
        console.warn('BassTab storage persist failed', error);
      }
    };

    persist();
  }, [hasHydrated, setlist, songs]);

  const createSong = (input?: SongInput) => {
    const newSong: Song = {
      id: createId('song'),
      title: input?.title ?? 'Untitled Song',
      artist: input?.artist ?? 'Unknown Artist',
      key: input?.key ?? 'C',
      feelNote: input?.feelNote ?? 'Mid-tempo pocket',
      tuning: input?.tuning ?? tuningOptions[0],
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: createId('section'),
          name: 'Intro',
          notes: 'Add groove notes here.',
          tab: 'G|----------------|\nD|----------------|\nA|----------------|\nE|----------------|',
        },
      ],
    };

    setSongs((current) => [newSong, ...current]);
    setSetlist((current) => ({
      ...current,
      songIds: [...current.songIds, newSong.id],
      updatedAt: new Date().toISOString(),
    }));

    return newSong;
  };

  const updateSong = (songId: string, updates: Partial<Song>) => {
    setSongs((current) =>
      current.map((song) =>
        song.id === songId ? updateTimestamp({ ...song, ...updates }) : song,
      ),
    );
  };

  const addSection = (songId: string) => {
    setSongs((current) =>
      current.map((song) => {
        if (song.id !== songId) {
          return song;
        }

        const nextName =
          defaultSectionNames[song.sections.length] ??
          `Section ${song.sections.length + 1}`;

        return updateTimestamp({
          ...song,
          sections: [
            ...song.sections,
            {
              id: createId('section'),
              name: nextName,
              notes: '',
              tab: 'G|----------------|\nD|----------------|\nA|----------------|\nE|----------------|',
            },
          ],
        });
      }),
    );
  };

  const updateSection = (
    songId: string,
    sectionId: string,
    updates: Partial<Section>,
  ) => {
    setSongs((current) =>
      current.map((song) => {
        if (song.id !== songId) {
          return song;
        }

        return updateTimestamp({
          ...song,
          sections: song.sections.map((section) =>
            section.id === sectionId ? { ...section, ...updates } : section,
          ),
        });
      }),
    );
  };

  const deleteSection = (songId: string, sectionId: string) => {
    setSongs((current) =>
      current.map((song) => {
        if (song.id !== songId || song.sections.length === 1) {
          return song;
        }

        return updateTimestamp({
          ...song,
          sections: song.sections.filter((section) => section.id !== sectionId),
        });
      }),
    );
  };

  const moveSection = (songId: string, sectionId: string, direction: -1 | 1) => {
    setSongs((current) =>
      current.map((song) => {
        if (song.id !== songId) {
          return song;
        }

        const index = song.sections.findIndex((section) => section.id === sectionId);
        const nextIndex = index + direction;

        if (index < 0 || nextIndex < 0 || nextIndex >= song.sections.length) {
          return song;
        }

        const nextSections = [...song.sections];
        const [moved] = nextSections.splice(index, 1);
        nextSections.splice(nextIndex, 0, moved);

        return updateTimestamp({
          ...song,
          sections: nextSections,
        });
      }),
    );
  };

  const reorderSetlist = (songIds: string[]) => {
    setSetlist((current) => ({
      ...current,
      songIds,
      updatedAt: new Date().toISOString(),
    }));
  };

  const value = useMemo(
    () => ({
      songs,
      setlist,
      createSong,
      updateSong,
      addSection,
      updateSection,
      deleteSection,
      moveSection,
      reorderSetlist,
    }),
    [setlist, songs],
  );

  return (
    <BassTabContext.Provider value={value}>{children}</BassTabContext.Provider>
  );
}

export const useBassTab = () => {
  const context = useContext(BassTabContext);

  if (!context) {
    throw new Error('useBassTab must be used within a BassTabProvider');
  }

  return context;
};
