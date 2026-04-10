import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg, Text as SvgText } from 'react-native-svg';

import { brandDisplayFontFamily } from '../constants/typography';

const NAMEPLATE_BG = '#1a120a';
const NAMEPLATE_TEXT = '#f5e6c8';
const NAMEPLATE_MUTED = '#b7a286';
const NAMEPLATE_GOLD = '#c8a96e';

type Variant = 'full' | 'compact';

interface DadBandBrandBannerProps {
  variant?: Variant;
  subtitle?: string;
  supportingLine?: string;
}

function DadBandMark({ variant }: { variant: Variant }) {
  const size = variant === 'full' ? 92 : 74;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r="54" fill="none" stroke={NAMEPLATE_GOLD} strokeWidth={3} />
      <Circle cx="60" cy="60" r="44" fill="none" stroke={NAMEPLATE_GOLD} strokeWidth={2} strokeDasharray="4 3" />
      <SvgText x="60" y="65" textAnchor="middle" fontSize={18} fontWeight="bold" letterSpacing={2} fill={NAMEPLATE_TEXT} fontFamily="Arial">
        DAD BAND
      </SvgText>
      <SvgText x="60" y="24" textAnchor="middle" fontSize={8} letterSpacing={1.5} fill={NAMEPLATE_GOLD} fontFamily="Arial">
        BASS TAB
      </SvgText>
      <SvgText x="60" y="108" textAnchor="middle" fontSize={7} letterSpacing={1.2} fill={NAMEPLATE_GOLD} fontFamily="Arial">
        REHEARSAL READY
      </SvgText>
    </Svg>
  );
}

export function DadBandBrandBanner({
  variant = 'full',
  subtitle = 'Rehearsal-night edition',
  supportingLine = 'Tabs, setlists, and stage-ready charts when the count-in starts.',
}: DadBandBrandBannerProps) {
  const compact = variant === 'compact';
  const markTilt = compact ? '-8deg' : '-10deg';

  return (
    <View style={[styles.banner, compact ? styles.bannerCompact : styles.bannerFull]}>
      <View style={styles.inner}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>DAD BAND BASS</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>Dad Band Bass</Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text>
          {!compact ? (
            <>
              <Text style={styles.supporting}>{supportingLine}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>PUB SET READY</Text>
              </View>
            </>
          ) : null}
        </View>
        <View style={[styles.markWrap, { transform: [{ rotate: markTilt }] }]}>
          <DadBandMark variant={variant} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: NAMEPLATE_BG,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: NAMEPLATE_GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  bannerFull: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bannerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '700',
    color: '#d6c2a3',
  },
  title: {
    fontFamily: brandDisplayFontFamily,
    fontSize: 30,
    lineHeight: 34,
    color: NAMEPLATE_TEXT,
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: NAMEPLATE_GOLD,
    fontWeight: '700',
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  supporting: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: NAMEPLATE_MUTED,
  },
  pill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#7a5520',
    backgroundColor: '#2e1f0a',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: '#d4a04a',
    letterSpacing: 0.6,
  },
  markWrap: {
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 0,
    elevation: 5,
  },
});
