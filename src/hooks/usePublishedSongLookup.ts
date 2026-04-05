import { useCallback, useEffect, useMemo, useState } from 'react';

import { BassTabApi, createBassTabApiFromEnv } from '../api';

export function usePublishedSongLookup(backendApi?: BassTabApi | null) {
  const memoApi = useMemo(() => createBassTabApiFromEnv(), []);
  const api = backendApi ?? memoApi;
  const [lookup, setLookup] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (): Promise<Record<string, string>> => {
    if (!api) {
      setLookup({});
      return {};
    }

    setIsLoading(true);

    try {
      const publishedSongs = await api.listCommunitySongs();
      const nextLookup = publishedSongs.reduce<Record<string, string>>((acc, entry) => {
        const sourceSongId = entry.sourceSongId ?? entry.id ?? null;
        const publishedSongId = entry.publishedSongId ?? entry.id ?? null;

        if (sourceSongId && publishedSongId) {
          acc[sourceSongId] = publishedSongId;
        }

        return acc;
      }, {});

      setLookup(nextLookup);
      return nextLookup;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { lookup, refresh, isLoading, api };
}
