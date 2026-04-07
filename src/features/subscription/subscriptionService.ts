import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { BassTabApi, createBassTabApiFromEnv } from '../../api';
import {
  BillingPortalSessionDto,
  SubscriptionCapabilityDefaultsDto,
  SubscriptionDowngradeRequestDto,
  SubscriptionDowngradeResponseDto,
  SubscriptionPricingDto,
  SubscriptionSnapshotDto,
  SubscriptionUpgradeRequestDto,
  SubscriptionUpgradeResponseDto,
} from '../../api/contracts';
import {
  BillingCurrency,
  SubscriptionCapabilityDefaults,
  SubscriptionPricing,
  SubscriptionSnapshot,
} from './subscriptionTypes';

const storageKeys = {
  tier: 'basstab:subscription-tier',
};

const defaultFreeSnapshot: SubscriptionSnapshot = {
  tier: 'FREE',
  status: 'FREE',
  planCode: null,
  currency: 'GBP',
  unitAmountMinor: 499,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  trialEnd: null,
  cancelAtPeriodEnd: false,
  capabilities: {
    maxSongs: 10,
    maxSetlists: 1,
    maxCommunitySongs: 2,
    maxCommunitySaves: 2,
    maxStringCount: 4,
    svgEnabled: false,
  },
  communitySongsSaved: 0,
};

const defaultPricing: SubscriptionPricing = {
  plans: [
    {
      plan: 'PRO_MONTHLY',
      label: 'BassTab Pro',
      interval: 'MONTHLY',
      prices: [
        { currency: 'GBP', unitAmountMinor: 499 },
        { currency: 'USD', unitAmountMinor: 499 },
        { currency: 'EUR', unitAmountMinor: 499 },
      ],
    },
  ],
};

const mapSnapshot = (snapshot: SubscriptionSnapshotDto): SubscriptionSnapshot => ({
  tier: snapshot.tier,
  status: snapshot.status,
  communitySongsSaved: snapshot.communitySongsSaved,
  planCode: snapshot.planCode,
  currency: snapshot.currency,
  unitAmountMinor: snapshot.unitAmountMinor,
  currentPeriodStart: snapshot.currentPeriodStart,
  currentPeriodEnd: snapshot.currentPeriodEnd,
  trialEnd: snapshot.trialEnd,
  cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
  capabilities: {
    maxSongs: snapshot.capabilities.maxSongs,
    maxSetlists: snapshot.capabilities.maxSetlists,
    maxCommunitySongs: snapshot.capabilities.maxCommunitySongs,
    maxCommunitySaves: snapshot.capabilities.maxCommunitySaves,
    maxStringCount: snapshot.capabilities.maxStringCount,
    svgEnabled: snapshot.capabilities.svgEnabled,
  },
});

export const mapSnapshotDto = mapSnapshot;

const mapPricing = (pricing: SubscriptionPricingDto): SubscriptionPricing => ({
  plans: pricing.plans.map((plan) => ({
    plan: plan.code,
    label: plan.displayName,
    interval: plan.billingInterval,
    prices: plan.prices.map((price) => ({
      currency: price.currency,
      unitAmountMinor: price.unitAmountMinor,
    })),
  })),
});

const defaultCapabilityDefaults: SubscriptionCapabilityDefaults = {
  free: defaultFreeSnapshot.capabilities,
  pro: {
    ...defaultFreeSnapshot.capabilities,
    maxStringCount: null,
  },
};

const mapCapabilityDefaults = (
  defaults: SubscriptionCapabilityDefaultsDto,
): SubscriptionCapabilityDefaults => ({
  free: {
    maxSongs: defaults.free.maxSongs,
    maxSetlists: defaults.free.maxSetlists,
    maxCommunitySongs: defaults.free.maxCommunitySongs,
    maxCommunitySaves: defaults.free.maxCommunitySaves,
    maxStringCount: defaults.free.maxStringCount,
    svgEnabled: defaults.free.svgEnabled,
  },
  pro: {
    maxSongs: defaults.pro.maxSongs,
    maxSetlists: defaults.pro.maxSetlists,
    maxCommunitySongs: defaults.pro.maxCommunitySongs,
    maxCommunitySaves: defaults.pro.maxCommunitySaves,
    maxStringCount: defaults.pro.maxStringCount,
    svgEnabled: defaults.pro.svgEnabled,
  },
});

export interface SubscriptionService {
  loadSnapshot: () => Promise<SubscriptionSnapshot>;
  loadPricing: () => Promise<SubscriptionPricing>;
  loadCapabilityDefaults: () => Promise<SubscriptionCapabilityDefaults>;
  upgradeToPro: (currency?: BillingCurrency) => Promise<SubscriptionUpgradeResponseDto>;
  openBillingPortal: (returnUrl?: string) => Promise<SubscriptionDowngradeResponseDto>;
}

class HybridSubscriptionService implements SubscriptionService {
  private readonly api: BassTabApi | null = createBassTabApiFromEnv();

  private buildUrl(path: string) {
    return Linking.createURL(path);
  }

  async loadSnapshot(): Promise<SubscriptionSnapshot> {
    if (!this.api) {
      try {
        await AsyncStorage.removeItem(storageKeys.tier);
      } catch (error) {
        console.warn('Subscription tier cleanup failed', error);
      }

      return defaultFreeSnapshot;
    }

    try {
      await AsyncStorage.removeItem(storageKeys.tier);
    } catch (error) {
      console.warn('Subscription tier cleanup failed', error);
    }

    return mapSnapshot(await this.api.getSubscription());
  }

  async loadPricing(): Promise<SubscriptionPricing> {
    if (this.api) {
      return mapPricing(await this.api.getSubscriptionPricing());
    }

    return defaultPricing;
  }

  async loadCapabilityDefaults(): Promise<SubscriptionCapabilityDefaults> {
    if (this.api) {
      return mapCapabilityDefaults(await this.api.getSubscriptionCapabilityDefaults());
    }

    return defaultCapabilityDefaults;
  }

  async upgradeToPro(currency: BillingCurrency = 'GBP'): Promise<SubscriptionUpgradeResponseDto> {
    if (!this.api) {
      throw new Error('Subscription upgrade requires backend API configuration.');
    }

    const payload: SubscriptionUpgradeRequestDto = {
      planCode: 'PRO_MONTHLY',
      currency,
      successUrl: this.buildUrl('subscription/success'),
      cancelUrl: this.buildUrl('subscription/cancel'),
    };

    console.info('[SubscriptionService] upgradeToPro payload', payload);

    return this.api.upgrade(payload);
  }

  async openBillingPortal(returnUrl: string = 'subscription/portal'): Promise<SubscriptionDowngradeResponseDto> {
    if (!this.api) {
      throw new Error('Billing portal requires backend API configuration.');
    }

    const payload: SubscriptionDowngradeRequestDto = {
      returnUrl: this.buildUrl(returnUrl),
    };

    return this.api.downgrade(payload);
  }
}

export const subscriptionService: SubscriptionService = new HybridSubscriptionService();
