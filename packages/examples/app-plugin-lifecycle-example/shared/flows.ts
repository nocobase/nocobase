/**
 * What the durable flows' pages and routes agree on: the lifecycles, the
 * catalogue the forms offer, and the webhook events the sandbox can send.
 */

/** The five lifecycles that wait for the outside, each behind a page of its own. */
export const DURABLE_FLOWS = [
  'orders',
  'exports',
  'purchases',
  'fulfilments',
  'subscriptions',
] as const;

export type DurableFlow = (typeof DURABLE_FLOWS)[number];

/** The customer a new record is for unless the form says otherwise. */
export const DEFAULT_CUSTOMER: string = 'customer-li';

/** What a flash sale sells, and how many the sandbox warehouse starts with. */
export interface SaleItem {
  readonly sku: string;
  readonly priceCents: number;
  readonly initialStock: number;
}

export const SALE_ITEMS: readonly SaleItem[] = [
  { sku: 'headphones', priceCents: 39_900, initialStock: 5 },
  { sku: 'keyboard', priceCents: 59_900, initialStock: 3 },
  { sku: 'lamp', priceCents: 12_900, initialStock: 10 },
];

export function saleItem(sku: unknown): SaleItem | undefined {
  return SALE_ITEMS.find((item) => item.sku === sku);
}

export interface Plan {
  readonly plan: string;
  readonly priceCents: number;
}

export const PLANS: readonly Plan[] = [
  { plan: 'basic', priceCents: 1_900 },
  { plan: 'pro', priceCents: 9_900 },
];

export function planOf(name: unknown): Plan | undefined {
  return PLANS.find((plan) => plan.plan === name);
}

/** How the sandbox vendor's export job ends. */
export const VENDOR_OUTCOMES = ['success', 'failure', 'stuck'] as const;
export type VendorOutcome = (typeof VENDOR_OUTCOMES)[number];

/** What a carrier reports about a parcel. `delivered` ends the shipment, `exception` holds it. */
export const CARRIER_STATUSES = [
  'pickedUp',
  'inTransit',
  'outForDelivery',
  'delivered',
  'exception',
] as const;
export type CarrierStatus = (typeof CARRIER_STATUSES)[number];

/** Who sends webhooks, and which events each one sends. */
export const WEBHOOK_SOURCES = ['payments', 'warehouse', 'carrier'] as const;
export type WebhookSource = (typeof WEBHOOK_SOURCES)[number];

/**
 * Every event the sandbox can send, by `source:type`, with the lifecycle
 * whose record it is about. The receiver maps each one to the transitions it
 * may fire.
 */
export type WebhookEventKey =
  | 'payments:checkout.paid'
  | 'payments:checkout.declined'
  | 'payments:payment.captured'
  | 'warehouse:pick.completed'
  | 'carrier:tracking.updated';

export const WEBHOOK_EVENTS: Readonly<Record<WebhookEventKey, DurableFlow>> = {
  'payments:checkout.paid': 'orders',
  'payments:checkout.declined': 'orders',
  'payments:payment.captured': 'fulfilments',
  'warehouse:pick.completed': 'fulfilments',
  'carrier:tracking.updated': 'fulfilments',
};

export function webhookEventKey(
  source: string,
  type: string,
): WebhookEventKey | undefined {
  const key = `${source}:${type}`;
  return key in WEBHOOK_EVENTS ? (key as WebhookEventKey) : undefined;
}

/** How a delivery was answered: what the receiver tells the sender. */
export type DeliveryOutcome = 'applied' | 'replayed' | 'ignored' | 'retry';
