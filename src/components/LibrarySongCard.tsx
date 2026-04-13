import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '../constants/colors';
import { Song } from '../types/models';
import { formatUpdatedAt } from '../utils/date';
import { PrimaryButton } from './PrimaryButton';

interface LibrarySongCardProps {
  song: Song;
  subtext?: string;
  onEdit: () => void;
  onLive: () => void;
  onDelete: () => void;
  onExportPdf?: () => void;
  onLockedPdfExport?: () => void;
  isPdfExportLocked?: boolean;
  isPublishedToCommunity?: boolean;
  isOrphanedInCommunity?: boolean;
  onToggleCommunityRelease?: () => void;
  onLockedCommunityAction?: () => void;
  isCommunityReleaseUpdating?: boolean;
  isCommunityActionLocked?: boolean;
  onRepublish?: () => void;
  showRepublish?: boolean;
  isRepublishDisabled?: boolean;
}

export function LibrarySongCard({
  song,
  subtext,
  onEdit,
  onLive,
  onDelete,
  onExportPdf,
  onLockedPdfExport,
  isPdfExportLocked = false,
  isPublishedToCommunity = false,
  isOrphanedInCommunity = false,
  onToggleCommunityRelease,
  onLockedCommunityAction,
  isCommunityReleaseUpdating = false,
  isCommunityActionLocked = false,
  onRepublish,
  showRepublish = false,
  isRepublishDisabled = false,
}: LibrarySongCardProps) {
  const handleCommunityActionPress = () => {
    if (isCommunityActionLocked) {
      onLockedCommunityAction?.();
      return;
    }

    onToggleCommunityRelease?.();
  };

  const handlePdfExportPress = () => {
    if (isPdfExportLocked) {
      onLockedPdfExport?.();
      return;
    }

    onExportPdf?.();
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={onEdit} style={({ pressed }) => [styles.summary, pressed && styles.pressed]}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.titleLine} numberOfLines={1} ellipsizeMode="tail">
              {song.title} • {song.artist}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{song.key}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
            {`${song.tuning} • Updated ${formatUpdatedAt(song.updatedAt)}`}
          </Text>
          {isOrphanedInCommunity ? (
            <View style={[styles.communityBadge, styles.orphanedBadge]}>
              <Text style={[styles.communityBadgeText, styles.orphanedBadgeText]}>Orphaned</Text>
            </View>
          ) : isPublishedToCommunity ? (
            <View style={styles.communityBadge}>
              <Text style={styles.communityBadgeText}>In Community</Text>
            </View>
          ) : null}
        </View>
        {song.authorComment?.trim() ? (
          <Text style={styles.authorComment} numberOfLines={3}>
            {song.authorComment.trim()}
          </Text>
        ) : null}
        {subtext ? (
          <Text style={styles.subtext} numberOfLines={1}>{subtext}</Text>
        ) : null}
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.actions}>
          <PrimaryButton label="Edit" onPress={onEdit} variant="ghost" />
          <PrimaryButton label="Perform" onPress={onLive} variant="secondary" />
          {onRepublish && showRepublish ? (
            <PrimaryButton
              label="Republish"
              onPress={onRepublish}
              variant="secondary"
              disabled={isRepublishDisabled}
            />
          ) : null}
          {onToggleCommunityRelease ? (
            <PrimaryButton
              label={
                isCommunityReleaseUpdating
                  ? (isPublishedToCommunity ? 'Updating...' : 'Adding...')
                  : isPublishedToCommunity
                    ? 'Release Song'
                    : 'Add to Community'
              }
              onPress={handleCommunityActionPress}
              variant="ghost"
              disabled={isCommunityReleaseUpdating}
              style={isCommunityActionLocked ? styles.lockedAction : undefined}
            />
          ) : null}
          {onExportPdf || onLockedPdfExport ? (
            <PrimaryButton
              label="Export PDF"
              onPress={handlePdfExportPress}
              variant="ghost"
              style={isPdfExportLocked ? styles.lockedAction : undefined}
            />
          ) : null}
          <PrimaryButton label="Bin it" onPress={onDelete} variant="danger" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 14,
  },
  summary: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  titleLine: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  badge: {
    minWidth: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: palette.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 15,
    color: palette.textMuted,
  },
  communityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#dcfce7',
  },
  communityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#166534',
  },
  orphanedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  orphanedBadgeText: {
    color: '#b45309',
  },
  lockedAction: {
    opacity: 0.55,
  },
  subtext: {
    fontSize: 11,
    color: palette.textMuted,
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: -6,
  },
  authorComment: {
    marginTop: -4,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
  },
  footer: {
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pressed: {
    opacity: 0.85,
  },
});
