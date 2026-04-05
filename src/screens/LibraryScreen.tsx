import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
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
import { RootStackParamList, TabParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { usePublishedSongLookup } from '../hooks/usePublishedSongLookup';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Library'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function LibraryScreen({ navigation }: Props) {
  const { tier } = useSubscription();
  const { showUpgradePrompt } = useUpgradePrompt();
  const {
    songs,
    createSong,
    deleteSong,
  } = useBassTab();
  const backendApi = useMemo(() => createBassTabApiFromEnv(), []);
  const { lookup: publishedBySourceSongId, refresh: refreshPublishedLookup } = usePublishedSongLookup(
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
      const existingPublishedSongId = publishedBySourceSongId[song.id];

      if (existingPublishedSongId) {
        await backendApi.unlistPublishedSong(existingPublishedSongId);
        await refreshPublishedLookup();
        setStatusMessage(`"${song.title}" unlisted from Community.`);
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
        <View style={styles.headingBlock}>
          <Text style={styles.title}>Dad Band Bass Library</Text>
          <Text style={styles.subtitle}>
            Keep rehearsal-night staples, pub-set survivors, and last-minute fixes ready to go.
          </Text>
        </View>
        <AppSectionNav
          current="Library"
          onHome={() => navigation.navigate('Home')}
          onLibrary={() => navigation.navigate('Library')}
          onSetlist={() => navigation.navigate('Setlist')}
          onImport={() => navigation.navigate('Import')}
          onGoPro={() => navigation.navigate('Upgrade')}
        />
        <View style={styles.actionRow}>
          <PrimaryButton label="New Song" onPress={handleCreateSong} />
        </View>
        <Text style={styles.actionHint}>Create a bass tab in under a minute.</Text>
      </View>

      {statusMessage ? <Text style={styles.storageNote}>{statusMessage}</Text> : null}

      <SearchBar value={query} onChangeText={setQuery} />

      {filteredSongs.length === 0 ? (
        <EmptyState
          title="No songs found"
          description="Try a different search term or create a new chart."
        />
      ) : (
        filteredSongs.map((song) => (
          <LibrarySongCard
            key={song.id}
            song={song}
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
            isPublishedToCommunity={Boolean(publishedBySourceSongId[song.id])}
            onLockedCommunityAction={() => showUpgradePrompt('COMMUNITY_SAVE')}
            isCommunityReleaseUpdating={publishingSongId === song.id}
            isCommunityActionLocked={tier === 'FREE'}
          />
        ))
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
                label="Bin Song"
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
    gap: 16,
  },
  headingBlock: {
    gap: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    fontFamily: brandDisplayFontFamily,
    letterSpacing: 0.2,
    color: palette.text,
  },
  subtitle: {
    fontSize: 17,
    color: '#4b5563',
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionHint: {
    marginTop: -4,
    fontSize: 13,
    color: palette.textMuted,
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
