import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { palette } from '../constants/colors';

export type SongListItemProps = {
  title: string;
  artist: string;
  keySignature: string;
  tuning: string;
  contributorName?: string;
  contributorEmoji?: string;
  contributionDate?: string;
  voteScore: number;
  userVote: 'UP' | 'DOWN' | null;
  onPreview?: () => void;
  onUpVote?: () => void;
  onDownVote?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  onMenu?: () => void;
  style?: ViewStyle;
};

export function SongListItem({
  title,
  artist,
  keySignature,
  tuning,
  contributorName,
  contributorEmoji,
  contributionDate,
  voteScore,
  userVote,
  onPreview,
  onUpVote,
  onDownVote,
  onAction,
  actionLabel,
  actionDisabled,
  onMenu,
  style,
}: SongListItemProps) {
  const highlightUp = userVote === 'UP';
  const highlightDown = userVote === 'DOWN';
  return (
    <View style={[styles.container, style]}>
      <View style={styles.voteColumn}>
        <Pressable onPress={onUpVote} style={highlightUp ? styles.voteHighlight : undefined}>
          <Text style={[styles.voteArrow, highlightUp && styles.voteArrowActive]}>▲</Text>
        </Pressable>
        <Text style={styles.voteScore}>{voteScore}</Text>
        <Pressable onPress={onDownVote} style={highlightDown ? styles.voteHighlight : undefined}>
          <Text style={[styles.voteArrow, highlightDown && styles.voteArrowActive]}>▼</Text>
        </Pressable>
      </View>

      <Pressable style={styles.content} onPress={onPreview}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artist}
        </Text>
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{keySignature}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{tuning}</Text>
          </View>
        </View>
        {(contributorName || contributionDate) && (
          <Text style={styles.contributorHint} numberOfLines={1}>
            {contributorEmoji ? `${contributorEmoji} ` : ''}
            {contributorName ? contributorName : 'Community contributor'}
            {contributionDate ? ` • ${contributionDate}` : ''}
          </Text>
        )}
      </Pressable>

      <View style={styles.actionsColumn}>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            disabled={actionDisabled}
            style={({ pressed }) => [
              styles.actionButton,
              actionDisabled && styles.actionDisabled,
              pressed && !actionDisabled && styles.actionPressed,
            ]}
          >
            <Text style={[styles.actionText, actionDisabled && styles.actionTextDisabled]}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
        {onMenu ? (
          <Pressable onPress={onMenu} style={styles.menuButton}>
            <Text style={styles.menuText}>⋯</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export const mockSongListItem: SongListItemProps = {
  title: 'Night Train Shuffle',
  artist: 'The Low-End Drivers',
  keySignature: 'E',
  tuning: 'Standard',
  contributorName: 'Mercy Vibes',
  contributorEmoji: '🎸',
  contributionDate: 'Apr 5, 2026',
  voteScore: 8,
  userVote: 'UP',
  onPreview: () => undefined,
  onUpVote: () => undefined,
  onDownVote: () => undefined,
  onMenu: () => undefined,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 14,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  voteColumn: {
    width: 56,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteArrow: {
    fontSize: 15,
    color: palette.textMuted,
  },
  voteArrowActive: {
    color: palette.accent,
  },
  voteHighlight: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#fefce8',
  },
  voteScore: {
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
  },
  artist: {
    fontSize: 13,
    color: palette.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f5f5f4',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textMuted,
  },
  contributorHint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  actionsColumn: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: palette.primary,
  },
  actionDisabled: {
    backgroundColor: palette.primaryMuted,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  actionTextDisabled: {
    color: '#475569',
  },
  menuButton: {
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  menuText: {
    fontSize: 20,
    color: palette.textMuted,
  },
});
