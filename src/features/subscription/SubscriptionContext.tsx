import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../auth/state/useAuth';
import { subscriptionService } from './subscriptionService';
import {
  BillingCurrency,
  SubscriptionCapabilityDefaults,
  SubscriptionCapabilities,
  SubscriptionPricing,
  SubscriptionSnapshot,
  SubscriptionStatus,
  SubscriptionTier,
} from './subscriptionTypes';

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  capabilities: SubscriptionCapabilities;
  pricing: SubscriptionPricing;
  priceLabel: string;
  upgrade: () => Promise<void>;
  refresh: () => Promise<void>;
  communitySongsSaved: number;
  setCommunitySongsSaved: (value: number) => void;
  capabilityDefaults: SubscriptionCapabilityDefaults | null;
  capabilityDefaultsLoaded: boolean;
  isLoading: boolean;
}

const defaultCapabilities: SubscriptionCapabilities = {
  maxSongs: 10,
  maxSetlists: 1,
  maxCommunitySongs: 2,
  maxCommunitySaves: 2,
  svgEnabled: false,
};

const defaultCapabilityDefaults: SubscriptionCapabilityDefaults = {
  free: defaultCapabilities,
  pro: defaultCapabilities,
};

const defaultPricing: SubscriptionPricing = {
  plans: [
    {
      plan: 'PRO_MONTHLY',
      label: 'BassTab Pro',
      interval: 'MONTHLY',
      prices: [{ currency: 'GBP', unitAmountMinor: 499 }],
    },
  ],
};

const serializePricing = (pricing: SubscriptionPricing) =>
  pricing.plans
    .map(
      (plan) =>
        `${plan.plan}|${plan.label}|${plan.interval}|${plan.prices
          .map((price) => `${price.currency}${price.unitAmountMinor}`)
          .join(',')}`,
    )
    .join(';');

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

const formatMinorCurrency = (amountMinor: number, currency: BillingCurrency): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountMinor / 100);
  } catch (_error) {
    return `£${(amountMinor / 100).toFixed(2)}`;
  }
};

const pickDisplayedPrice = (
  snapshot: SubscriptionSnapshot | null,
  pricing: SubscriptionPricing,
): { currency: BillingCurrency; unitAmountMinor: number } => {
  const monthlyPlan = pricing.plans.find((plan) => plan.plan === 'PRO_MONTHLY') ?? pricing.plans[0];
  const preferredCurrency = snapshot?.currency ?? 'GBP';
  const preferredPrice = monthlyPlan?.prices.find((price) => price.currency === preferredCurrency);
  const fallbackPrice = monthlyPlan?.prices[0];

  if (preferredPrice) {
    return preferredPrice;
  }

  if (fallbackPrice) {
    return fallbackPrice;
  }

  return { currency: 'GBP', unitAmountMinor: 499 };
};

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const { authState } = useAuth();
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
  const [pricing, setPricing] = useState<SubscriptionPricing>(defaultPricing);
  const [capabilityDefaults, setCapabilityDefaults] = useState<SubscriptionCapabilityDefaults | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    const nextSnapshot = await subscriptionService.loadSnapshot();

    try {
      const nextPricing = await subscriptionService.loadPricing();
      setPricing((current) =>
        serializePricing(current) === serializePricing(nextPricing) ? current : nextPricing,
      );
    } catch (error) {
      console.warn('Subscription pricing refresh failed', error);
    }

    setSnapshot(nextSnapshot);
    console.info(
      'Subscription snapshot',
      nextSnapshot.communitySongsSaved,
      nextSnapshot.capabilities,
    );
  }, []);

  const setCommunitySongsSaved = useCallback((value: number) => {
    setSnapshot((current) => {
      if (!current) {
        return current;
      }

      console.info('Set communitySongsSaved', value);
      return { ...current, communitySongsSaved: value };
    });
  }, []);

  useEffect(() => {
    void refresh().catch((error) => {
      console.warn('Subscription hydrate failed', error);
    });
  }, [refresh]);

  useEffect(() => {
    if (authState.type === 'RESTORING_SESSION') {
      return;
    }

    void refresh().catch((error) => {
      console.warn('Subscription refresh failed after auth change', error);
    });
  }, [authState.type, refresh]);

  useEffect(() => {
    void subscriptionService
      .loadCapabilityDefaults()
      .then(setCapabilityDefaults)
      .catch((error) => {
        console.warn('Subscription capability defaults refresh failed', error);
      });
  }, []);

  const upgrade = useCallback(async () => {
    setIsLoading(true);

    try {
      const displayedPrice = pickDisplayedPrice(snapshot, pricing);
      const nextSnapshot = await subscriptionService.upgradeToPro(displayedPrice.currency);
      setSnapshot(nextSnapshot);
      await refresh();
    } finally {
      setIsLoading(false);
    }
  }, [pricing, refresh, snapshot]);

  const displayedPrice = pickDisplayedPrice(snapshot, pricing);
  const priceLabel = formatMinorCurrency(displayedPrice.unitAmountMinor, displayedPrice.currency);

  const value = useMemo(
    () => ({
      tier: snapshot?.tier ?? 'FREE',
      status: snapshot?.status ?? 'FREE',
      capabilities: snapshot?.capabilities ?? defaultCapabilities,
      pricing,
      priceLabel,
      upgrade,
      refresh,
      communitySongsSaved: snapshot?.communitySongsSaved ?? 0,
      setCommunitySongsSaved,
      capabilityDefaults,
      capabilityDefaultsLoaded: capabilityDefaults !== null,
      isLoading,
    }),
    [isLoading, priceLabel, pricing, refresh, snapshot, upgrade, setCommunitySongsSaved, capabilityDefaults],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error('useSubscription must be used inside SubscriptionProvider.');
  }

  return context;
};
