import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { BassTabApi, createBassTabApiFromEnv } from '../../api';
import {
  SubscriptionCapabilityDefaultsDto,
  SubscriptionCommunityUsageDto,
  SubscriptionCancelResponseDto,
  SubscriptionPricingDto,
  SubscriptionSnapshotDto,
  SubscriptionUpgradeRequestDto,
  SubscriptionUpgradeResponseDto,
} from '../../api/contracts';
import {
  BillingCurrency,
  SubscriptionCapabilityDefaults,
  SubscriptionCommunityUsage,
  SubscriptionPricing,
  SubscriptionSnapshot,
} from './subscriptionTypes';
import {
  DEFAULT_SUBSCRIPTION_CAPABILITIES,
  DEFAULT_SUBSCRIPTION_CAPABILITY_DEFAULTS,
  DEFAULT_SUBSCRIPTION_PRICING,
  PRO_MONTHLY_PLAN_CODE,
} from '../../constants/subscription';
import { beLog } from '../../utils/logging';

const storageKeys = {
  tier: 'basstab:subscription-tier',
};

const defaultFreeSnapshot: SubscriptionSnapshot = {
  tier: 'FREE',
  status: 'free',
  planCode: null,
  currency: 'GBP',
  unitAmountMinor: 499,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  trialEnd: null,
  cancelAtPeriodEnd: false,
  capabilities: { ...DEFAULT_SUBSCRIPTION_CAPABILITIES },
  communitySongsSaved: 0,
  communitySongsRemaining: DEFAULT_SUBSCRIPTION_CAPABILITIES.maxCommunitySaves ?? 0,
  communitySongsSavedTotal: 0,
};

const defaultPricing: SubscriptionPricing = {
  plans: DEFAULT_SUBSCRIPTION_PRICING.plans.map((plan) => ({
    ...plan,
    prices: plan.prices.map((price) => ({ ...price })),
  })),
};

const mapSnapshot = (snapshot: SubscriptionSnapshotDto): SubscriptionSnapshot => ({
  tier: snapshot.plan === 'pro' || snapshot.tier === 'PRO' ? 'PRO' : 'FREE',
  status: snapshot.status,
  communitySongsSaved: snapshot.communitySongsSaved,
  communitySongsRemaining: snapshot.communitySongsRemaining,
  communitySongsSavedTotal: snapshot.communitySongsSavedTotal,
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
    maxAiGenerations: snapshot.capabilities.maxAiGenerations ?? null,
    maxDailyAiGenerations: snapshot.capabilities.maxDailyAiGenerations ?? null,
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
  free: { ...DEFAULT_SUBSCRIPTION_CAPABILITY_DEFAULTS.free },
  pro: { ...DEFAULT_SUBSCRIPTION_CAPABILITY_DEFAULTS.pro },
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
    maxAiGenerations: defaults.free.maxAiGenerations ?? null,
    maxDailyAiGenerations: defaults.free.maxDailyAiGenerations ?? null,
  },
  pro: {
    maxSongs: defaults.pro.maxSongs,
    maxSetlists: defaults.pro.maxSetlists,
    maxCommunitySongs: defaults.pro.maxCommunitySongs,
    maxCommunitySaves: defaults.pro.maxCommunitySaves,
    maxStringCount: defaults.pro.maxStringCount,
    svgEnabled: defaults.pro.svgEnabled,
    maxAiGenerations: defaults.pro.maxAiGenerations ?? null,
    maxDailyAiGenerations: defaults.pro.maxDailyAiGenerations ?? null,
  },
});

const mapCommunityUsage = (usage: SubscriptionCommunityUsageDto): SubscriptionCommunityUsage => ({
  maxCommunitySaves: usage.maxCommunitySaves,
  communitySongsSaved: usage.communitySongsSaved,
  communitySongsRemaining: usage.communitySongsRemaining,
  communitySongsSavedTotal: usage.communitySongsSavedTotal,
});

export interface SubscriptionService {
  loadSnapshot: () => Promise<SubscriptionSnapshot>;
  loadCommunityUsage: () => Promise<SubscriptionCommunityUsage>;
  loadPricing: () => Promise<SubscriptionPricing>;
  loadCapabilityDefaults: () => Promise<SubscriptionCapabilityDefaults>;
  upgradeToPro: (currency?: BillingCurrency) => Promise<SubscriptionUpgradeResponseDto>;
  cancelSubscription: () => Promise<SubscriptionCancelResponseDto>;
  loadBillingPortalUrl: () => Promise<string>;
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
        beLog.warn('Subscription tier cleanup failed', error);
      }

      return defaultFreeSnapshot;
    }

    try {
      await AsyncStorage.removeItem(storageKeys.tier);
    } catch (error) {
      beLog.warn('Subscription tier cleanup failed', error);
    }

    return mapSnapshot(await this.api.getSubscription());
  }

  async loadCommunityUsage(): Promise<SubscriptionCommunityUsage> {
    if (!this.api) {
      return {
        maxCommunitySaves: DEFAULT_SUBSCRIPTION_CAPABILITIES.maxCommunitySaves ?? 0,
        communitySongsSaved: 0,
        communitySongsRemaining: DEFAULT_SUBSCRIPTION_CAPABILITIES.maxCommunitySaves ?? 0,
        communitySongsSavedTotal: 0,
      };
    }

    return mapCommunityUsage(await this.api.getSubscriptionCommunityUsage());
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
      planCode: PRO_MONTHLY_PLAN_CODE,
      currency,
      successUrl: this.buildUrl('subscription/success'),
      cancelUrl: this.buildUrl('subscription/cancel'),
    };

    beLog.info('[SubscriptionService] upgradeToPro payload', payload);

    return this.api.upgrade(payload);
  }

  async cancelSubscription(): Promise<SubscriptionCancelResponseDto> {
    if (!this.api) {
      throw new Error('Subscription cancellation requires backend API configuration.');
    }

    return this.api.cancelSubscription();
  }

  async loadBillingPortalUrl(): Promise<string> {
    if (!this.api) {
      throw new Error('Billing portal requires backend API configuration.');
    }

    const { url } = await this.api.getBillingPortalUrl();
    return url;
  }
}

export const subscriptionService: SubscriptionService = new HybridSubscriptionService();
