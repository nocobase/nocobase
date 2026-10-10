import type { DurableFlow } from '../../shared/flows.js';

export type GuidePage = 'tickets' | 'expenses' | DurableFlow;

/** How many numbered steps each page's guide has in the locales. */
export const GUIDE_STEPS: Readonly<Record<GuidePage, number>> = {
  tickets: 4,
  expenses: 5,
  orders: 4,
  exports: 3,
  purchases: 3,
  fulfilments: 4,
  subscriptions: 3,
};
