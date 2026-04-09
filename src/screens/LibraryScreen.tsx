import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Circle, Svg, Text as SvgText } from 'react-native-svg';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createBassTabApiFromEnv } from '../api';
import { EmptyState } from '../components/EmptyState';
import { AppSectionNav } from '../components/AppSectionNav';
import { LibrarySongCard } from '../components/LibrarySongCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { palette } from '../constants/colors';
import { brandDisplayFontFamily } from '../constants/typography';
import { resolveUpgradeTrigger, useSubscription, useUpgradePrompt } from '../features/subscription';
import { useAuth } from '../features/auth';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { Song } from '../types/models';
import { usePublishedSongLookup, PublishedSongInfo } from '../hooks/usePublishedSongLookup';

const NAMEPLATE_BG = '#1a120a';
const NAMEPLATE_TEXT = '#f5e6c8';
const NAMEPLATE_MUTED = '#a8957e';
const NAMEPLATE_GOLD = '#c8a96e';

const SONG_QUIPS = [
  'We\'ll start this too fast.',
  'Solid until the chorus.',
  'We\'ll get away with it.',
  'Needs confidence.',
  'Good if we\'ve rehearsed it.',
  'The one we overplay.',
  'Works better live.',
  'Deceptively simple.',
  'Everyone has a different version.',
  'The bass carries this one.',
];

function getSongQuip(id: string): string {
  const code = id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return SONG_QUIPS[code % SONG_QUIPS.length];
}

function DadBandBadge() {
  return (
    <Svg width={80} height={80} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r="54" fill="none" stroke={NAMEPLATE_GOLD} strokeWidth={3} />
      <Circle cx="60" cy="60" r="44" fill="none" stroke={NAMEPLATE_GOLD} strokeWidth={2} strokeDasharray="4 3" />
      <SvgText x="60" y="65" textAnchor="middle" fontSize={18} fontWeight="bold" letterSpacing={2} fill={NAMEPLATE_TEXT} fontFamily="Arial">DAD BAND</SvgText>
      <SvgText x="60" y="24" textAnchor="middle" fontSize={8} letterSpacing={1.5} fill={NAMEPLATE_GOLD} fontFamily="Arial">LIBRARY</SvgText>
      <SvgText x="60" y="108" textAnchor="middle" fontSize={7} letterSpacing={1.2} fill={NAMEPLATE_GOLD} fontFamily="Arial">SORT OF KNOW THESE</SvgText>
    </Svg>
  );
}

const needsRepublish = (song: Song, publishedInfo?: PublishedSongInfo): boolean => {
  if (!publishedInfo) {
    return false;
  }

  return song.updatedAt !== publishedInfo.updatedAt;
};

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Library'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function LibraryScreen({ navigation }: Props) {
  const { tier } = useSubscription();
  const { showUpgradePrompt } = useUpgradePrompt();
  const { authState } = useAuth();
  const currentUserId = authState.type === 'AUTHENTICATED' ? authState.user.id : null;
  const {
    songs,
    createSong,
    deleteSong,
  } = useBassTab();
  const backendApi = useMemo(() => createBassTabApiFromEnv(), []);
  const { lookup: publishedLookup, refresh: refreshPublishedLookup } = usePublishedSongLookup(
    backendApi,
  );
  const [query, setQuery] = useState('');
  const [publishingSongId, setPublishingSongId] = useState<string | null>(null);
  const [songPendingDelete, setSongPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const filteredSongs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return songs;
    }

    return songs.filter((song) =>
      [song.title, song.artist, song.key, song.tuning]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, songs]);

  const handleCreateSong = async () => {
    try {
      const song = await createSong();
      navigation.navigate('SongEditor', { songId: song.id, isNew: true });
    } catch (error) {
      const trigger = resolveUpgradeTrigger(error);

      if (trigger) {
        showUpgradePrompt(trigger);
        return;
      }

      const message = error instanceof Error ? error.message : 'Could not create song.';
      setStatusMessage(`Could not create song: ${message}`);
    }
  };

  const handleDeleteSong = (songId: string, songTitle: string) => {
    setSongPendingDelete({ id: songId, title: songTitle });
  };

  const handleToggleCommunityRelease = async (songId: string) => {
    if (!backendApi || publishingSongId) {
      return;
    }

    const song = songs.find((item) => item.id === songId);

    if (!song) {
      return;
    }

    setPublishingSongId(song.id);

    try {
      const publishedInfo = publishedLookup[song.id];
      const existingPublishedSongId = publishedInfo?.publishedSongId;
      const isOrphaned = publishedInfo?.ownershipStatus === 'ORPHANED';

      if (existingPublishedSongId && !isOrphaned) {
        await backendApi.disownCommunitySong(existingPublishedSongId);
        // deleteSong fires a fire-and-forget HTTP delete internally (void return).
        // Only call it after the disown API call confirms success above.
        deleteSong(song.id);
        setStatusMessage(`"${song.title}" released — it's now free to be claimed by the community.`);
      } else {
        await backendApi.publishSong(song.id);
        const nextLookup = await refreshPublishedLookup();
        setStatusMessage(
          nextLookup[song.id]
            ? `"${song.title}" is now live in Community.`
            : `"${song.title}" published. It may take a moment to appear in Community.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update community publish state.';
      setStatusMessage(message);
    } finally {
      setPublishingSongId(null);
    }
  };

  const handleRepublish = async (songId: string) => {
    if (!backendApi || publishingSongId) {
      return;
    }

    const song = songs.find((item) => item.id === songId);

    if (!song) {
      return;
    }

    setPublishingSongId(song.id);

    try {
      await backendApi.publishSong(song.id);
      await refreshPublishedLookup();
      setStatusMessage(`"${song.title}" republished to Community.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not republish this song to community.';
      setStatusMessage(message);
    } finally {
      setPublishingSongId(null);
    }
  };

  const confirmDeleteSong = () => {
    if (!songPendingDelete) {
      return;
    }

    deleteSong(songPendingDelete.id);
    setSongPendingDelete(null);
    setStatusMessage('Song binned.');
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.navRow}>
          <AppSectionNav
            current="Library"
            onHome={() => navigation.navigate('Home')}
            onLibrary={() => navigation.navigate('Library')}
            onSetlist={() => navigation.navigate('Setlist')}
            onImport={() => navigation.navigate('Import')}
            onAICreate={() => navigation.navigate('AICreate')}
            onGoPro={() => navigation.navigate('Upgrade')}
          />
        </View>

        <View style={styles.nameplate}>
          <View style={styles.nameplateInner}>
            <View style={styles.nameplateText}>
              <Text style={styles.nameplateTitle}>Dad Band Library 🎸</Text>
              <Text style={styles.nameplateSubtitle}>All the songs we sort of know.</Text>
              <View style={styles.warningPill}>
                <Text style={styles.warningPillText}>⚠️ Accuracy varies. Confidence does not.</Text>
              </View>
            </View>
            <View style={styles.badgeSlap}>
              <DadBandBadge />
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <PrimaryButton label="New Song" onPress={handleCreateSong} />
        </View>
      </View>

      {statusMessage ? <Text style={styles.storageNote}>{statusMessage}</Text> : null}

      <SearchBar value={query} onChangeText={setQuery} placeholder="Search songs, artists, or something we half remember" />

      {filteredSongs.length === 0 ? (
        query.trim() ? (
          <EmptyState
            title="Nothing matches that."
            description="Try a different search, or we genuinely don't have it."
          />
        ) : (
          <EmptyState
            title="Nothing in here yet."
            description="Time to learn something. Or pretend to."
          />
        )
      ) : (
        filteredSongs.map((song) => {
          const publishedInfo = publishedLookup[song.id];
          const isOrphanedInCommunity =
            Boolean(publishedInfo?.publishedSongId) &&
            (publishedInfo?.ownershipStatus === 'ORPHANED' ||
              (publishedInfo?.ownerUserId != null &&
                publishedInfo?.ownerUserId !== currentUserId));

          return (
            <LibrarySongCard
              key={song.id}
              song={song}
              subtext={getSongQuip(song.id)}
              onEdit={() => navigation.navigate('SongEditor', { songId: song.id })}
              onLive={() => navigation.navigate('PerformanceView', { songId: song.id })}
              onDelete={() => handleDeleteSong(song.id, song.title)}
              onToggleCommunityRelease={
                backendApi
                  ? () => {
                    void handleToggleCommunityRelease(song.id);
                  }
                  : undefined
              }
              isPublishedToCommunity={
                Boolean(publishedInfo?.publishedSongId) &&
                publishedInfo?.ownershipStatus !== 'ORPHANED'
              }
              isOrphanedInCommunity={isOrphanedInCommunity}
              onLockedCommunityAction={() => showUpgradePrompt('COMMUNITY_SAVE')}
              isCommunityReleaseUpdating={publishingSongId === song.id}
              isCommunityActionLocked={tier === 'FREE'}
              onRepublish={
                !isOrphanedInCommunity && publishedInfo?.publishedSongId
                  ? () => {
                    void handleRepublish(song.id);
                  }
                  : undefined
              }
              showRepublish={!isOrphanedInCommunity && needsRepublish(song, publishedInfo)}
              isRepublishDisabled={publishingSongId === song.id}
            />
          );
        })
      )}

      <Modal
        visible={Boolean(songPendingDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setSongPendingDelete(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bin song?</Text>
            <Text style={styles.modalText}>
              {songPendingDelete
                ? `Are you sure you want to bin "${songPendingDelete.title}"?`
                : ''}
            </Text>
            <View style={styles.modalActions}>
              <PrimaryButton
                label="Cancel"
                onPress={() => setSongPendingDelete(null)}
                variant="ghost"
              />
              <PrimaryButton
                label="Bin it"
                onPress={confirmDeleteSong}
                variant="danger"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
  },
  navRow: {
    marginBottom: 0,
  },
  nameplate: {
    backgroundColor: NAMEPLATE_BG,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: NAMEPLATE_GOLD,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  nameplateInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nameplateText: {
    flex: 1,
    gap: 8,
  },
  nameplateTitle: {
    fontFamily: brandDisplayFontFamily,
    fontSize: 20,
    fontWeight: '800',
    color: NAMEPLATE_TEXT,
    flexShrink: 1,
  },
  nameplateSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: NAMEPLATE_MUTED,
    fontStyle: 'italic',
  },
  warningPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#2e1f0a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7a5520',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  warningPillText: {
    fontSize: 11,
    color: '#d4a04a',
    fontWeight: '600',
  },
  badgeSlap: {
    transform: [{ rotate: '-10deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 5,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  storageNote: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.textMuted,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
});
