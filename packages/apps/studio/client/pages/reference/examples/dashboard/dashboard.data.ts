/** Mock data for the Dashboard example. Nothing here reaches a server. */

export type DashboardRange = '3m' | '6m' | '12m';

export const DASHBOARD_RANGES: readonly DashboardRange[] = ['3m', '6m', '12m'];

export const RANGE_MONTHS: Record<DashboardRange, number> = {
  '3m': 3,
  '6m': 6,
  '12m': 12,
};

/** One row per calendar month; `month` is the first day of that month. */
export interface MonthlyMetric {
  readonly month: string;
  readonly revenue: number;
  readonly target: number;
  readonly orders: number;
  readonly newCustomers: number;
  readonly returningCustomers: number;
  readonly visitors: number;
}

/**
 * Twenty-four months so every range has a preceding period of the same
 * length to compare against.
 */
export const MONTHLY_METRICS: readonly MonthlyMetric[] = [
  {
    month: '2024-10-01',
    revenue: 41200,
    target: 42000,
    orders: 318,
    newCustomers: 96,
    returningCustomers: 222,
    visitors: 18400,
  },
  {
    month: '2024-11-01',
    revenue: 48900,
    target: 45000,
    orders: 371,
    newCustomers: 128,
    returningCustomers: 243,
    visitors: 21900,
  },
  {
    month: '2024-12-01',
    revenue: 56300,
    target: 52000,
    orders: 412,
    newCustomers: 141,
    returningCustomers: 271,
    visitors: 24800,
  },
  {
    month: '2025-01-01',
    revenue: 39800,
    target: 44000,
    orders: 296,
    newCustomers: 84,
    returningCustomers: 212,
    visitors: 17600,
  },
  {
    month: '2025-02-01',
    revenue: 42600,
    target: 44000,
    orders: 322,
    newCustomers: 97,
    returningCustomers: 225,
    visitors: 18900,
  },
  {
    month: '2025-03-01',
    revenue: 47100,
    target: 46000,
    orders: 355,
    newCustomers: 109,
    returningCustomers: 246,
    visitors: 20700,
  },
  {
    month: '2025-04-01',
    revenue: 45400,
    target: 47000,
    orders: 340,
    newCustomers: 102,
    returningCustomers: 238,
    visitors: 19800,
  },
  {
    month: '2025-05-01',
    revenue: 51200,
    target: 48000,
    orders: 384,
    newCustomers: 121,
    returningCustomers: 263,
    visitors: 22300,
  },
  {
    month: '2025-06-01',
    revenue: 53800,
    target: 50000,
    orders: 401,
    newCustomers: 126,
    returningCustomers: 275,
    visitors: 23100,
  },
  {
    month: '2025-07-01',
    revenue: 49600,
    target: 50000,
    orders: 366,
    newCustomers: 108,
    returningCustomers: 258,
    visitors: 21400,
  },
  {
    month: '2025-08-01',
    revenue: 52900,
    target: 51000,
    orders: 392,
    newCustomers: 119,
    returningCustomers: 273,
    visitors: 22800,
  },
  {
    month: '2025-09-01',
    revenue: 58400,
    target: 53000,
    orders: 431,
    newCustomers: 137,
    returningCustomers: 294,
    visitors: 25200,
  },
  {
    month: '2025-10-01',
    revenue: 61700,
    target: 56000,
    orders: 452,
    newCustomers: 146,
    returningCustomers: 306,
    visitors: 26500,
  },
  {
    month: '2025-11-01',
    revenue: 68200,
    target: 60000,
    orders: 497,
    newCustomers: 168,
    returningCustomers: 329,
    visitors: 29100,
  },
  {
    month: '2025-12-01',
    revenue: 74900,
    target: 66000,
    orders: 541,
    newCustomers: 182,
    returningCustomers: 359,
    visitors: 31800,
  },
  {
    month: '2026-01-01',
    revenue: 55100,
    target: 58000,
    orders: 402,
    newCustomers: 117,
    returningCustomers: 285,
    visitors: 23600,
  },
  {
    month: '2026-02-01',
    revenue: 58700,
    target: 59000,
    orders: 428,
    newCustomers: 129,
    returningCustomers: 299,
    visitors: 24900,
  },
  {
    month: '2026-03-01',
    revenue: 64300,
    target: 61000,
    orders: 466,
    newCustomers: 143,
    returningCustomers: 323,
    visitors: 27200,
  },
  {
    month: '2026-04-01',
    revenue: 62800,
    target: 62000,
    orders: 455,
    newCustomers: 136,
    returningCustomers: 319,
    visitors: 26700,
  },
  {
    month: '2026-05-01',
    revenue: 69400,
    target: 64000,
    orders: 498,
    newCustomers: 155,
    returningCustomers: 343,
    visitors: 29300,
  },
  {
    month: '2026-06-01',
    revenue: 72600,
    target: 66000,
    orders: 519,
    newCustomers: 161,
    returningCustomers: 358,
    visitors: 30400,
  },
  {
    month: '2026-07-01',
    revenue: 67900,
    target: 67000,
    orders: 487,
    newCustomers: 148,
    returningCustomers: 339,
    visitors: 28600,
  },
  {
    month: '2026-08-01',
    revenue: 73500,
    target: 69000,
    orders: 526,
    newCustomers: 163,
    returningCustomers: 363,
    visitors: 30900,
  },
  {
    month: '2026-09-01',
    revenue: 79800,
    target: 72000,
    orders: 571,
    newCustomers: 181,
    returningCustomers: 390,
    visitors: 33200,
  },
];

export type SalesChannel = 'web' | 'store' | 'phone' | 'partner';

export interface ChannelSales {
  readonly channel: SalesChannel;
  readonly amount: number;
  readonly orders: number;
}

export const CHANNEL_SALES: readonly ChannelSales[] = [
  { channel: 'web', amount: 312400, orders: 2314 },
  { channel: 'store', amount: 148900, orders: 1027 },
  { channel: 'partner', amount: 96200, orders: 388 },
  { channel: 'phone', amount: 41300, orders: 296 },
];

export type DeviceKind = 'desktop' | 'mobile' | 'tablet';

export interface DeviceShare {
  readonly device: DeviceKind;
  readonly sessions: number;
}

export const DEVICE_SHARE: readonly DeviceShare[] = [
  { device: 'desktop', sessions: 18420 },
  { device: 'mobile', sessions: 12160 },
  { device: 'tablet', sessions: 2620 },
];

export type RecentOrderStatus =
  'pending' | 'processing' | 'shipped' | 'completed' | 'refunded';

export interface RecentOrder {
  readonly id: string;
  readonly number: string;
  readonly customer: string;
  readonly initials: string;
  readonly status: RecentOrderStatus;
  readonly total: number;
  readonly placedAt: string;
}

export const RECENT_ORDERS: readonly RecentOrder[] = [
  {
    id: 'ord_1014',
    number: 'SO-2026-1014',
    customer: 'Mia Johansson',
    initials: 'MJ',
    status: 'completed',
    total: 617,
    placedAt: '2026-09-20T10:05:00Z',
  },
  {
    id: 'ord_1013',
    number: 'SO-2026-1013',
    customer: 'Lucas Müller',
    initials: 'LM',
    status: 'pending',
    total: 468,
    placedAt: '2026-09-18T17:20:00Z',
  },
  {
    id: 'ord_1012',
    number: 'SO-2026-1012',
    customer: 'Isabella Silva',
    initials: 'IS',
    status: 'shipped',
    total: 567,
    placedAt: '2026-09-16T08:38:00Z',
  },
  {
    id: 'ord_1011',
    number: 'SO-2026-1011',
    customer: 'Daniel Kim',
    initials: 'DK',
    status: 'completed',
    total: 1245,
    placedAt: '2026-09-15T15:45:00Z',
  },
  {
    id: 'ord_1010',
    number: 'SO-2026-1010',
    customer: 'Chloé Martin',
    initials: 'CM',
    status: 'processing',
    total: 276,
    placedAt: '2026-09-13T12:10:00Z',
  },
  {
    id: 'ord_1007',
    number: 'SO-2026-1007',
    customer: 'Yuki Tanaka',
    initials: 'YT',
    status: 'refunded',
    total: 429,
    placedAt: '2026-09-10T07:15:00Z',
  },
];

export type ActivityKind =
  'order' | 'shipment' | 'customer' | 'refund' | 'note' | 'target';

export interface TeamActivity {
  readonly id: string;
  readonly actor: string;
  readonly initials: string;
  readonly kind: ActivityKind;
  /** What the action concerned: an order number, a customer, a document. */
  readonly subject: string;
  /** Offset from "now", so the feed reads as live whenever the page opens. */
  readonly minutesAgo: number;
}

export const TEAM_ACTIVITY: readonly TeamActivity[] = [
  {
    id: 'act_01',
    actor: 'Priya Raman',
    initials: 'PR',
    kind: 'order',
    subject: 'SO-2026-1014 · Mia Johansson',
    minutesAgo: 6,
  },
  {
    id: 'act_02',
    actor: 'Tom Becker',
    initials: 'TB',
    kind: 'shipment',
    subject: 'SO-2026-1012 · DHL Express',
    minutesAgo: 42,
  },
  {
    id: 'act_03',
    actor: 'Grace Osei',
    initials: 'GO',
    kind: 'customer',
    subject: 'Northwind Traders',
    minutesAgo: 95,
  },
  {
    id: 'act_04',
    actor: 'Priya Raman',
    initials: 'PR',
    kind: 'refund',
    subject: 'SO-2026-1007 · $429.00',
    minutesAgo: 180,
  },
  {
    id: 'act_05',
    actor: 'Hugo Lind',
    initials: 'HL',
    kind: 'note',
    subject: 'Q4 pricing review',
    minutesAgo: 420,
  },
  {
    id: 'act_06',
    actor: 'Grace Osei',
    initials: 'GO',
    kind: 'target',
    subject: 'September revenue',
    minutesAgo: 1440,
  },
];

export type TargetKey = 'revenue' | 'orders' | 'customers' | 'satisfaction';

export interface QuarterTarget {
  readonly key: TargetKey;
  readonly current: number;
  readonly target: number;
  /** How `current` and `target` are rendered next to the bar. */
  readonly unit: 'currency' | 'count' | 'percent';
}

export const QUARTER_TARGETS: readonly QuarterTarget[] = [
  { key: 'revenue', current: 221200, target: 240000, unit: 'currency' },
  { key: 'orders', current: 1584, target: 1650, unit: 'count' },
  { key: 'customers', current: 492, target: 600, unit: 'count' },
  { key: 'satisfaction', current: 91, target: 95, unit: 'percent' },
];

/** The last `count` months, in chronological order. */
export function lastMonths(
  metrics: readonly MonthlyMetric[],
  count: number,
): readonly MonthlyMetric[] {
  return metrics.slice(Math.max(metrics.length - count, 0));
}

/** The `count` months immediately before the last `count` months. */
export function previousMonths(
  metrics: readonly MonthlyMetric[],
  count: number,
): readonly MonthlyMetric[] {
  const end = Math.max(metrics.length - count, 0);
  return metrics.slice(Math.max(end - count, 0), end);
}

export function sumBy(
  rows: readonly MonthlyMetric[],
  key: Exclude<keyof MonthlyMetric, 'month'>,
): number {
  return rows.reduce((sum, row) => sum + row[key], 0);
}

/** Whole-percent change from `previous` to `current`; 0 when there is no baseline. */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}
