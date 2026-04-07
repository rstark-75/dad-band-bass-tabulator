import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WelcomeExperience } from '../components/WelcomeExperience';
import { useSubscription } from '../features/subscription';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
  const { tier, priceLabel } = useSubscription();
  const isPro = tier === 'PRO';

  return (
    <WelcomeExperience
      actionLabel="Open App"
      onPrimaryAction={() => navigation.replace('MainTabs')}
      subscriptionPromo={{
        title: isPro ? 'Pro Unlocked for Every Gig' : 'Play Without Limits',
        subtitle: isPro
          ? 'You are ready for stage mode, export, and full library access.'
          : 'Unlock the full BassTab performance flow and keep every chart ready on stage.',
        priceLabel,
        benefits: [
          'Unlimited songs and setlists',
          'SVG Performance Mode',
          '5 & 6-string support',
          'PDF export for offline gigs',
          'Unlimited community saves',
        ],
        ctaLabel: isPro ? 'Open Account' : `Go Pro - ${priceLabel}/month`,
        onCta: () => navigation.navigate(isPro ? 'Account' : 'Upgrade'),
        note: isPro
          ? 'Your plan is active.'
          : 'No Internet at GIG - export your tabs to your device. Pro also unlocks 5 & 6-string charts.',
      }}
    />
  );
}
