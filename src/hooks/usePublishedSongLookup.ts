import { useCallback, useEffect, useMemo, useState } from 'react';

import { BassTabApi, createBassTabApiFromEnv } from '../api';
import { OwnershipStatus } from '../types/models';

export type PublishedSongInfo = {
  publishedSongId: string;
  title: string;
  artist: string;
  key?: string | null;
  tuning?: string | null;
  publishedAt: string;
  updatedAt: string;
  ownershipStatus?: OwnershipStatus | null;
  ownerUserId?: string | null;
};

export function usePublishedSongLookup(backendApi?: BassTabApi | null) {
  const memoApi = useMemo(() => createBassTabApiFromEnv(), []);
  const api = backendApi ?? memoApi;
  const [lookup, setLookup] = useState<Record<string, PublishedSongInfo>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (): Promise<Record<string, PublishedSongInfo>> => {
    if (!api) {
      setLookup({});
      return {};
    }

    setIsLoading(true);

    try {
      const publishedSongs = await api.listCommunitySongs();
      const nextLookup = publishedSongs.reduce<Record<string, PublishedSongInfo>>((acc, entry) => {
        const sourceSongId = entry.sourceSongId ?? entry.id ?? null;
        const publishedSongId = entry.publishedSongId ?? entry.id ?? null;

        if (sourceSongId && publishedSongId) {
          acc[sourceSongId] = {
            publishedSongId,
            title: entry.title,
            artist: entry.artist,
            key: entry.key ?? null,
            tuning: entry.tuning ?? null,
            publishedAt: entry.publishedAt,
            updatedAt: entry.updatedAt,
            ownershipStatus: entry.ownershipStatus ?? null,
            ownerUserId: entry.author?.userId ?? null,
          };
        }

        return acc;
      }, {});

      setLookup(nextLookup);
      return nextLookup;
    } catch (error) {
      console.warn('Failed to refresh published song lookup', error);
      setLookup({});
      return {};
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { lookup, refresh, isLoading, api };
}
