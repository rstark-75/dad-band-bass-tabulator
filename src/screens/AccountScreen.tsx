import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg, Text as SvgText } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppSectionNav } from '../components/AppSectionNav';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { palette } from '../constants/colors';
import { brandDisplayFontFamily } from '../constants/typography';
import { useSubscription } from '../features/subscription';
import { RootStackParamList } from '../navigation/types';

const NAMEPLATE_BG = '#1a120a';
const NAMEPLATE_TEXT = '#f5e6c8';
const NAMEPLATE_MUTED = '#a8957e';
const NAMEPLATE_GOLD = '#c8a96e';

function DadBandBadge() {
  return (
    <Svg width={80} height={80} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r="54" fill="none" stroke={NAMEPLATE_GOLD} strokeWidth={3} />
      <Circle cx="60" cy="60" r="44" fill="none" stroke={NAMEPLATE_GOLD} strokeWidth={2} strokeDasharray="4 3" />
      <SvgText x="60" y="65" textAnchor="middle" fontSize={18} fontWeight="bold" letterSpacing={2} fill={NAMEPLATE_TEXT} fontFamily="Arial">DAD BAND</SvgText>
      <SvgText x="60" y="24" textAnchor="middle" fontSize={8} letterSpacing={1.5} fill={NAMEPLATE_GOLD} fontFamily="Arial">ACCOUNT</SvgText>
      <SvgText x="60" y="108" textAnchor="middle" fontSize={7} letterSpacing={1.2} fill={NAMEPLATE_GOLD} fontFamily="Arial">FINE. BE PROFESSIONAL.</SvgText>
    </Svg>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

export function AccountScreen({ navigation }: Props) {
  const { tier } = useSubscription();

  return (
    <ScreenContainer>
      <View style={styles.navRow}>
        <AppSectionNav
          current="GoPro"
          onHome={() => navigation.navigate('Home')}
          onLibrary={() => navigation.navigate('MainTabs', { screen: 'Library' })}
          onSetlist={() => navigation.navigate('MainTabs', { screen: 'Setlist' })}
          onImport={() => navigation.navigate('MainTabs', { screen: 'Import' })}
          onAICreate={() => navigation.navigate('MainTabs', { screen: 'AICreate' })}
          onGoPro={() => navigation.navigate('Upgrade')}
        />
      </View>

      <View style={styles.nameplate}>
        <View style={styles.nameplateInner}>
          <View style={styles.nameplateText}>
            <Text style={styles.nameplateTitle}>Dad Band Account 🎸</Text>
            <Text style={styles.nameplateSubtitle}>Fine. Let's be professional for a minute.</Text>
            <View style={styles.warningPill}>
              <Text style={styles.warningPillText}>⚠️ This is the boring bit</Text>
            </View>
          </View>
          <View style={styles.badgeSlap}>
            <DadBandBadge />
          </View>
        </View>
      </View>

      <View style={[styles.subscriptionCard, tier === 'PRO' && styles.subscriptionCardPro]}>
        <Text style={styles.sectionLabel}>The serious bit</Text>
        {tier === 'PRO' ? (
          <>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.planTitle}>You're on Pro 🎸</Text>
            <Text style={styles.planText}>
              All features unlocked. What you do with it is up to you.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.planTitle}>You're on Free Plan</Text>
            <Text style={styles.planText}>
              Upgrade for unlimited songs and setlists, SVG performance mode, and full community access.
            </Text>
            <PrimaryButton
              label="Upgrade to Pro"
              onPress={() => navigation.navigate('Upgrade')}
            />
          </>
        )}
      </View>
      <Text style={styles.microcopy}>Cheaper than new strings.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  microcopy: {
    fontSize: 11,
    color: palette.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
  },
  subscriptionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 18,
    gap: 12,
  },
  subscriptionCardPro: {
    borderColor: '#1d4ed8',
    backgroundColor: '#eff6ff',
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
    color: palette.textMuted,
  },
  proBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1e3a8a',
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#dbeafe',
  },
  planTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: palette.text,
  },
  planText: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textMuted,
  },
});
