import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { PrimaryButton } from './PrimaryButton';
import { useAuth } from '../features/auth/state/useAuth';
import { findAvatarPreset } from '../features/auth/utils/avatarPresets';
import { useSubscription } from '../features/subscription';

interface AppSectionNavProps {
  current: 'Home' | 'Library' | 'Setlist' | 'Import' | 'AICreate' | 'GoPro' | 'Account';
  onHome: () => void;
  onLibrary: () => void;
  onSetlist: () => void;
  onImport: () => void;
  onAICreate: () => void;
  onGoPro: () => void;
  onAccount: () => void;
}

export function AppSectionNav({
  current,
  onHome,
  onLibrary,
  onSetlist,
  onImport,
  onAICreate,
  onGoPro,
  onAccount,
}: AppSectionNavProps) {
  const { width } = useWindowDimensions();
  const isCompactLayout = width < 760;
  const isVeryCompactLayout = width < 390;
  const { authState, logout } = useAuth();
  const { tier } = useSubscription();

  const signedInUser = authState.type === 'AUTHENTICATED' ? authState.user : null;
  const signedInUserId = signedInUser?.userId ?? null;

  const avatarUrl = signedInUser?.avatarUrl ?? '';
  const avatarPreset = findAvatarPreset(avatarUrl);
  const showAvatarImage =
    !avatarPreset &&
    (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'));
  const avatarInitial = (signedInUserId ?? 'b').slice(0, 1).toUpperCase();

  const navButtonStyle = isCompactLayout
    ? [styles.navRailButton, isVeryCompactLayout && styles.navRailButtonTiny]
    : undefined;
  const navButtonLabelStyle = isVeryCompactLayout ? styles.navRailLabelTiny : undefined;
  const handleSignOut = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      {isCompactLayout ? (
        <View style={styles.navRail}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navRailContent}
          >
            <PrimaryButton
              label="Home"
              onPress={onHome}
              variant={current === 'Home' ? 'secondary' : 'ghost'}
              size="compact"
              style={navButtonStyle}
              labelStyle={navButtonLabelStyle}
            />
            <PrimaryButton
              label="Library"
              onPress={onLibrary}
              variant={current === 'Library' ? 'secondary' : 'ghost'}
              size="compact"
              style={navButtonStyle}
              labelStyle={navButtonLabelStyle}
            />
            <PrimaryButton
              label="Setlist"
              onPress={onSetlist}
              variant={current === 'Setlist' ? 'secondary' : 'ghost'}
              size="compact"
              style={navButtonStyle}
              labelStyle={navButtonLabelStyle}
            />
            <PrimaryButton
              label="Community"
              onPress={onImport}
              variant={current === 'Import' ? 'secondary' : 'ghost'}
              size="compact"
              style={navButtonStyle}
              labelStyle={navButtonLabelStyle}
            />
            <PrimaryButton
              label="AI Create"
              onPress={onAICreate}
              variant={current === 'AICreate' ? 'secondary' : 'ghost'}
              size="compact"
              style={navButtonStyle}
              labelStyle={navButtonLabelStyle}
            />
            <PrimaryButton
              label="Go Pro"
              onPress={onGoPro}
              variant={current === 'GoPro' ? 'secondary' : 'ghost'}
              size="compact"
              style={navButtonStyle}
              labelStyle={navButtonLabelStyle}
            />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.row}>
          <PrimaryButton
            label="Home"
            onPress={onHome}
            variant={current === 'Home' ? 'secondary' : 'ghost'}
            size="compact"
          />
          <PrimaryButton
            label="Library"
            onPress={onLibrary}
            variant={current === 'Library' ? 'secondary' : 'ghost'}
            size="compact"
          />
          <PrimaryButton
            label="Setlist"
            onPress={onSetlist}
            variant={current === 'Setlist' ? 'secondary' : 'ghost'}
            size="compact"
          />
          <PrimaryButton
            label="Community"
            onPress={onImport}
            variant={current === 'Import' ? 'secondary' : 'ghost'}
            size="compact"
          />
          <PrimaryButton
            label="AI Create"
            onPress={onAICreate}
            variant={current === 'AICreate' ? 'secondary' : 'ghost'}
            size="compact"
          />
          <PrimaryButton
            label="Go Pro"
            onPress={onGoPro}
            variant={current === 'GoPro' ? 'secondary' : 'ghost'}
            size="compact"
          />
        </View>
      )}
      {signedInUser ? (
        <View style={[styles.accountCluster, isCompactLayout && styles.accountClusterCompact]}>
          <View style={[styles.accountIdentityRow, isCompactLayout && styles.accountIdentityRowCompact]}>
            <View style={styles.navAvatarWrap}>
              {showAvatarImage ? (
                <Image source={{ uri: avatarUrl }} style={styles.navAvatarImage} />
              ) : avatarPreset ? (
                <View style={[styles.navAvatarFallback, { backgroundColor: avatarPreset.background }]}>
                  <Text style={[styles.navAvatarGlyph, { color: avatarPreset.textColor }]}>
                    {avatarPreset.glyph}
                  </Text>
                </View>
              ) : (
                <View style={styles.navAvatarFallback}>
                  <Text style={styles.navAvatarInitial}>{avatarInitial}</Text>
                </View>
              )}
            </View>
            <Text style={styles.accountUserId} numberOfLines={1} ellipsizeMode="tail">
              @{signedInUserId ?? 'unknown'}
            </Text>
            <View style={[styles.tierPill, tier === 'PRO' ? styles.tierPillPro : styles.tierPillFree]}>
              <Text style={[styles.tierPillText, tier === 'PRO' ? styles.tierPillTextPro : styles.tierPillTextFree]}>
                {tier}
              </Text>
            </View>
          </View>
          <View style={[styles.accountActionsRow, isCompactLayout && styles.accountActionsRowCompact]}>
            <PrimaryButton
              label="Account"
              onPress={onAccount}
              variant={current === 'Account' ? 'secondary' : 'ghost'}
              size="compact"
              style={[styles.clusterButton, isCompactLayout && styles.clusterButtonCompact]}
            />
            <PrimaryButton
              label="Sign out"
              onPress={handleSignOut}
              variant="ghost"
              size="compact"
              style={[styles.clusterButton, isCompactLayout && styles.clusterButtonCompact]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    flex: 1,
  },
  navRail: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe2f1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  navRailContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  navRailButton: {
    minHeight: 32,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  navRailButtonTiny: {
    minHeight: 30,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  navRailLabelTiny: {
    fontSize: 12,
  },
  accountClusterCompact: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 8,
  },
  accountCluster: {
    minWidth: 280,
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe2f1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  accountIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  accountIdentityRowCompact: {
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  accountActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  accountActionsRowCompact: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe2f1',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  navAvatarWrap: {
    width: 26,
    height: 26,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  navAvatarImage: {
    width: '100%',
    height: '100%',
  },
  navAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e',
  },
  navAvatarInitial: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f8fafc',
  },
  navAvatarGlyph: {
    fontSize: 13,
  },
  accountUserId: {
    fontSize: 13,
    lineHeight: 17,
    color: '#0f172a',
    fontWeight: '800',
    marginRight: 2,
  },
  clusterButton: {
    minHeight: 32,
    paddingHorizontal: 9,
  },
  clusterButtonCompact: {
    borderRadius: 10,
    minHeight: 30,
    paddingHorizontal: 10,
  },
  tierPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tierPillPro: {
    borderColor: '#22c55e',
    backgroundColor: '#dcfce7',
  },
  tierPillFree: {
    borderColor: '#cbd5e1',
    backgroundColor: '#e2e8f0',
  },
  tierPillText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tierPillTextPro: {
    color: '#166534',
  },
  tierPillTextFree: {
    color: '#334155',
  },
});
