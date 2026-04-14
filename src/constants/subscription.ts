export const PRO_MONTHLY_PLAN_CODE = 'PRO_MONTHLY';

export const DEFAULT_SUBSCRIPTION_CAPABILITIES = {
  maxSongs: 20,
  maxSetlists: 1,
  maxCommunitySongs: 5,
  maxCommunitySaves: null,
  maxStringCount: 4,
  svgEnabled: false,
  maxAiGenerations: 15,
  maxDailyAiGenerations: 3,
} as const;

export const DEFAULT_SUBSCRIPTION_CAPABILITY_DEFAULTS = {
  free: DEFAULT_SUBSCRIPTION_CAPABILITIES,
  pro: {
    ...DEFAULT_SUBSCRIPTION_CAPABILITIES,
    maxSongs: null,
    maxSetlists: null,
    maxStringCount: null,
    maxAiGenerations: null,
    maxDailyAiGenerations: 20,
  },
} as const;

export const DEFAULT_SUBSCRIPTION_PRICING = {
  plans: [
    {
      plan: PRO_MONTHLY_PLAN_CODE,
      label: 'BassTab Pro',
      interval: 'MONTHLY',
      prices: [
        { currency: 'GBP', unitAmountMinor: 499 },
        { currency: 'USD', unitAmountMinor: 499 },
        { currency: 'EUR', unitAmountMinor: 499 },
      ],
    },
  ],
} as const;
