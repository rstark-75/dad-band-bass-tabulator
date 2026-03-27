import { useMemo } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { palette } from '../constants/colors';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';
import { Song } from '../types/models';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Setlist'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function SetlistScreen({ navigation }: Props) {
  const { songs, setlist, reorderSetlist } = useBassTab();

  const orderedSongs = useMemo(
    () =>
      setlist.songIds
        .map((songId) => songs.find((song) => song.id === songId))
        .filter(Boolean) as Song[],
    [setlist.songIds, songs],
  );

  const renderCard = (item: Song, isActive = false, drag?: () => void) => (
    <Pressable
      onLongPress={drag}
      onPress={() => navigation.navigate('PerformanceView', { songId: item.id })}
      style={[styles.card, isActive && styles.cardActive]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>
            {orderedSongs.findIndex((song) => song.id === item.id) + 1}
          </Text>
        </View>
        <View style={styles.copyBlock}>
          <Text style={styles.songTitle}>{item.title}</Text>
          <Text style={styles.artistText}>{item.artist}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{item.key}</Text>
        <Text style={styles.metaText}>{item.feelNote}</Text>
          <Text style={styles.metaText}>Chart ready</Text>
      </View>

      <Text style={styles.hint}>
        {Platform.OS === 'web'
          ? 'Tap to open performance view.'
          : 'Tap to open performance view. Long press to reorder.'}
      </Text>
    </Pressable>
  );

  const renderNativeList = () => {
    const { default: DraggableFlatList, ScaleDecorator } = require(
      'react-native-draggable-flatlist'
    );

    return (
      <DraggableFlatList
        data={orderedSongs}
        keyExtractor={(item: Song) => item.id}
        onDragEnd={({ data }: { data: Song[] }) =>
          reorderSetlist(data.map((song) => song.id))
        }
        renderItem={({
          item,
          drag,
          isActive,
        }: {
          item: Song;
          drag: () => void;
          isActive: boolean;
        }) => <ScaleDecorator>{renderCard(item, isActive, drag)}</ScaleDecorator>}
        contentContainerStyle={styles.listContent}
        activationDistance={8}
      />
    );
  };

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{setlist.name}</Text>
        <Text style={styles.subtitle}>
          Drag songs into performance order for rehearsal or gigs.
        </Text>
        {orderedSongs.length > 0 ? (
          <PrimaryButton
            label="Export Setlist PDF"
            onPress={() => navigation.navigate('ExportSetlist')}
            variant="ghost"
          />
        ) : null}
      </View>

      {orderedSongs.length === 0 ? (
        <EmptyState
          title="Setlist is empty"
          description="Add a song from the library to build the running order."
        />
      ) : (
        Platform.OS === 'web' ? (
          <FlatList
            data={orderedSongs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderCard(item)}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          renderNativeList()
        )
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textMuted,
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  cardActive: {
    borderColor: palette.primary,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  orderBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: palette.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary,
  },
  copyBlock: {
    flex: 1,
    gap: 4,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.text,
  },
  artistText: {
    fontSize: 15,
    color: palette.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaText: {
    fontSize: 14,
    color: palette.textMuted,
  },
  hint: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '600',
  },
});
