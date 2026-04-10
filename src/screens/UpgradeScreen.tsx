import { ScrollView, StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { useSubscription } from '../features/subscription';
import { RootStackParamList } from '../navigation/types';
import { brandDisplayFontFamily } from '../constants/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Upgrade'>;

const benefits = [
  {
    icon: '∞',
    title: 'Unlimited Songs',
    detail: 'Keep every rehearsal and gig chart in one library.',
  },
  {
    icon: '🗂',
    title: 'Unlimited Setlists',
    detail: 'Build separate run-orders for each venue and set.',
  },
  {
    icon: '⚡',
    title: 'Performance Mode (SVG)',
    detail: 'Clean, stage-readable tabs when lights are low.',
  },
  {
    icon: '🎸',
    title: '5 String Support',
    detail: 'Write extended-range parts for low-B and beyond.',
  },
  {
    icon: '🌍',
    title: 'Community Access',
    detail: 'Save and keep unlimited community charts.',
  },
  {
    icon: '🤝',
    title: 'Support from creators',
    detail: 'Help fund ongoing updates, fixes, and new bass-first tools.',
  },
];

export function UpgradeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { tier, upgrade, isLoading, priceLabel } = useSubscription();
  const useTwoColumns = width > 560;
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setUpgradeError(null);
    try {
      await upgrade();
      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setUpgradeError(message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowWarm} />
          <View style={styles.heroGlowCool} />
          <Text style={styles.heroEyebrow}>BassTab Pro</Text>
          <Text style={styles.heroTitle}>Play Without Limits 🎸</Text>
          <Text style={styles.heroSubtitle}>
            Keep every song tight, every setlist ready, and every chart readable on stage.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What Pro Unlocks</Text>
          <View style={styles.benefitList}>
            {benefits.map((benefit) => (
              <View
                key={benefit.title}
                style={[styles.benefitCard, useTwoColumns && styles.benefitCardTwoColumn]}
              >
                <View style={styles.benefitIconBadge}>
                  <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDetail}>{benefit.detail}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingRow}>
            <Text style={styles.price}>{priceLabel}/month</Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>PRO</Text>
            </View>
            <Text style={styles.priceQuip}>Come on guys, the cost of a beer! 🍺</Text>
          </View>
          <Text style={styles.priceNote}>No lock-in. Cancel anytime.</Text>
        </View>

        {tier === 'PRO' ? (
          <View style={styles.proCard}>
            <Text style={styles.proTitle}>You’re already on Pro 🎸</Text>
            <Text style={styles.proText}>Everything is unlocked for performance mode.</Text>
          </View>
        ) : null}

        <Pressable
          disabled={isLoading || tier === 'PRO'}
          onPress={() => {
            void handleUpgrade();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            (isLoading || tier === 'PRO') && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonLabel}>
            {tier === 'PRO' ? 'Pro Unlocked' : isLoading ? 'Unlocking Pro...' : `Buy Now - ${priceLabel}/month`}
          </Text>
        </Pressable>

        {upgradeError ? (
          <Text style={styles.errorText}>{upgradeError}</Text>
        ) : null}

        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonLabel}>Maybe later</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 26,
    gap: 14,
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 18,
    gap: 8,
  },
  heroGlowWarm: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    top: -70,
    right: -56,
  },
  heroGlowCool: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 211, 238, 0.14)',
    bottom: -50,
    left: -30,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#f59e0b',
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    fontFamily: brandDisplayFontFamily,
    color: '#f8fafc',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#cbd5e1',
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  benefitList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  benefitCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    padding: 12,
    gap: 6,
  },
  benefitCardTwoColumn: {
    width: '48%',
  },
  benefitIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  benefitIcon: {
    fontSize: 14,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  benefitDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: '#e2e8f0',
  },
  pricingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
  },
  priceTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f59e0b',
  },
  priceTagText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#111827',
  },
  priceQuip: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#fbbf24',
  },
  priceNote: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  proCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    backgroundColor: '#1e3a8a',
    padding: 14,
    gap: 6,
  },
  proTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#dbeafe',
  },
  proText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#dbeafe',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  errorText: {
    fontSize: 14,
    color: '#f87171',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.65,
  },
});
