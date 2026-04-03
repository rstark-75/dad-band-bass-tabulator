import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../components/EmptyState';
import { AppSectionNav } from '../components/AppSectionNav';
import { LibrarySongCard } from '../components/LibrarySongCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { palette } from '../constants/colors';
import { brandDisplayFontFamily } from '../constants/typography';
import { useAuth } from '../features/auth/state/useAuth';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Library'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function LibraryScreen({ navigation }: Props) {
  const { authState, logout, loadingAction } = useAuth();
  const {
    songs,
    createSong,
    deleteSong,
    loadStateFromFile,
    saveStateToFile,
  } = useBassTab();
  const [query, setQuery] = useState('');
  const [songPendingDelete, setSongPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [fileActionMessage, setFileActionMessage] = useState(
    'Pack Away saves your charts here; Bring It Back restores that saved copy.',
  );
  const signedInEmail = authState.type === 'AUTHENTICATED' ? authState.user.email : null;

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
      navigation.navigate('SongEditor', { songId: song.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create song.';
      setFileActionMessage(`Could not create song: ${message}`);
    }
  };

  const handleSaveState = async () => {
    try {
      const target = await saveStateToFile();
      setFileActionMessage(`Packed away for later in ${target}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not pack it away.';
      setFileActionMessage(`Could not pack it away: ${message}`);
    }
  };

  const handleLoadState = async () => {
    try {
      const source = await loadStateFromFile();
      setFileActionMessage(`Packed charts brought back from ${source}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not bring it back.';
      setFileActionMessage(`Could not bring it back: ${message}`);
    }
  };

  const handleDeleteSong = (songId: string, songTitle: string) => {
    setSongPendingDelete({ id: songId, title: songTitle });
  };

  const confirmDeleteSong = () => {
    if (!songPendingDelete) {
      return;
    }

    deleteSong(songPendingDelete.id);
    setSongPendingDelete(null);
    setFileActionMessage('Song binned.');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headingBlock}>
          <Text style={styles.title}>Dad Band Bass Library</Text>
          <Text style={styles.subtitle}>
            Keep rehearsal-night staples, pub-set survivors, and last-minute fixes ready to go.
          </Text>
          {signedInEmail ? <Text style={styles.accountText}>Signed in as {signedInEmail}</Text> : null}
        </View>
        <AppSectionNav
          current="Library"
          onLibrary={() => navigation.navigate('Library')}
          onSetlist={() => navigation.navigate('Setlist')}
          onAbout={() => navigation.navigate('Welcome')}
        />
        <View style={styles.actionRow}>
          <PrimaryButton label="Pack Away" onPress={handleSaveState} variant="secondary" />
          <PrimaryButton label="Bring It Back" onPress={handleLoadState} variant="ghost" />
          <PrimaryButton label="New Song" onPress={handleCreateSong} />
          <PrimaryButton
            label={loadingAction === 'logout' ? 'Signing out...' : 'Sign out'}
            onPress={() => {
              if (loadingAction !== 'logout') {
                void handleLogout();
              }
            }}
            variant="ghost"
            disabled={loadingAction === 'logout'}
          />
        </View>
      </View>

      <Text style={styles.storageNote}>{fileActionMessage}</Text>

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
  accountText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
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
