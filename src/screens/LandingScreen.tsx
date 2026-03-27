import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '../constants/colors';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbA} />
      <View style={styles.backgroundOrbB} />

      <View style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>BassTab</Text>
          <Text style={styles.title}>Bass charts built for rehearsal, not playback.</Text>
          <Text style={styles.subtitle}>
            Organize songs, edit tab fast, and open a performance view that keeps the chart readable on stage.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => navigation.replace('MainTabs')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonLabel}>Open App</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.featureGrid}>
          <FeatureCard
            title="Library"
            description="Keep rehearsal charts in one place and jump into editing quickly."
          />
          <FeatureCard
            title="Performance View"
            description="Read one section at a time with manual navigation instead of unreliable auto-scroll."
          />
          <FeatureCard
            title="Import Drafts"
            description="Start from pasted tab now, then clean up structure and notes inside the editor."
          />
        </View>

        <Text style={styles.footer}>
          {Platform.OS === 'web'
            ? 'Web preview for layout and workflow validation.'
            : 'BassTab'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6efe2',
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    justifyContent: 'space-between',
    gap: 28,
  },
  hero: {
    gap: 18,
    maxWidth: 760,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#9a3412',
  },
  title: {
    fontSize: 48,
    lineHeight: 54,
    fontWeight: '800',
    color: '#111827',
    maxWidth: 720,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 30,
    color: '#374151',
    maxWidth: 640,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f9fafb',
  },
  pressed: {
    opacity: 0.88,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  featureCard: {
    flexGrow: 1,
    flexBasis: 220,
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(154, 52, 18, 0.12)',
    gap: 8,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  featureDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },
  footer: {
    fontSize: 14,
    color: '#6b7280',
  },
  backgroundOrbA: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  backgroundOrbB: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(15, 118, 110, 0.14)',
  },
});
