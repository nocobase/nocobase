/** Mock data for the Team settings example. Nothing here reaches a server. */

export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type MemberStatus = 'active' | 'invited' | 'suspended';

export type InvoiceStatus = 'paid' | 'pending' | 'failed';

export type PlanId = 'starter' | 'team' | 'business';

export type NotificationGroup = 'activity' | 'security' | 'billing';

export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly role: MemberRole;
  readonly status: MemberStatus;
  /** ISO date the member accepted their invitation. */
  readonly joinedAt: string;
  readonly lastActiveAt: string;
}

export interface Invoice {
  readonly id: string;
  readonly number: string;
  readonly issuedAt: string;
  /** Amount in USD. */
  readonly amount: number;
  readonly status: InvoiceStatus;
  /** Billing period, written the way the invoice prints it. */
  readonly period: string;
}

export interface NotificationRow {
  readonly id: string;
  readonly group: NotificationGroup;
  readonly enabled: boolean;
}

export interface AdvancedNotificationRow {
  readonly id: string;
  readonly enabled: boolean;
}

export interface Plan {
  readonly id: PlanId;
  /** Price per seat per month, in USD. */
  readonly pricePerSeat: number;
  readonly includedSeats: number;
  /** Included storage in gigabytes. */
  readonly includedStorage: number;
}

export interface Timezone {
  readonly value: string;
  readonly label: string;
}

export const MEMBER_ROLES: readonly MemberRole[] = [
  'owner',
  'admin',
  'editor',
  'viewer',
];

export const NOTIFICATION_GROUPS: readonly NotificationGroup[] = [
  'activity',
  'security',
  'billing',
];

export const WORKSPACE_NAME = 'Northwind Studio';

export const WORKSPACE_SLUG = 'northwind-studio';

export const WORKSPACE_DESCRIPTION =
  'Product, design and support for the Northwind storefront. Invoices go to the finance mailbox in Rotterdam.';

export const TIMEZONES: readonly Timezone[] = [
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function member(
  id: string,
  name: string,
  email: string,
  role: MemberRole,
  status: MemberStatus,
  joinedAt: string,
  lastActiveAt: string,
): TeamMember {
  return {
    id,
    name,
    email,
    initials: initials(name),
    role,
    status,
    joinedAt,
    lastActiveAt,
  };
}

export const TEAM_MEMBERS: readonly TeamMember[] = [
  member(
    'usr_01',
    'Ava Thompson',
    'ava.thompson@northwind.io',
    'owner',
    'active',
    '2024-03-11',
    '2026-09-21',
  ),
  member(
    'usr_02',
    'Liam Chen',
    'liam.chen@northwind.io',
    'admin',
    'active',
    '2024-05-02',
    '2026-09-20',
  ),
  member(
    'usr_03',
    'Sofia Rossi',
    'sofia.rossi@northwind.io',
    'editor',
    'active',
    '2024-09-18',
    '2026-09-21',
  ),
  member(
    'usr_04',
    'Noah Patel',
    'noah.patel@northwind.io',
    'editor',
    'active',
    '2025-01-07',
    '2026-09-19',
  ),
  member(
    'usr_05',
    'Emma Fischer',
    'emma.fischer@northwind.io',
    'viewer',
    'active',
    '2025-02-24',
    '2026-09-12',
  ),
  member(
    'usr_06',
    'Mateo García',
    'mateo.garcia@northwind.io',
    'editor',
    'suspended',
    '2025-04-01',
    '2026-07-30',
  ),
  member(
    'usr_07',
    'Yuki Tanaka',
    'yuki.tanaka@northwind.io',
    'admin',
    'active',
    '2025-05-19',
    '2026-09-18',
  ),
  member(
    'usr_08',
    'Olivia Brown',
    'olivia.brown@northwind.io',
    'viewer',
    'invited',
    '2026-09-15',
    '2026-09-15',
  ),
  member(
    'usr_09',
    'Ahmed Hassan',
    'ahmed.hassan@northwind.io',
    'editor',
    'active',
    '2025-08-06',
    '2026-09-17',
  ),
  member(
    'usr_10',
    'Chloé Martin',
    'chloe.martin@northwind.io',
    'viewer',
    'active',
    '2025-11-12',
    '2026-09-16',
  ),
  member(
    'usr_11',
    'Daniel Kim',
    'daniel.kim@northwind.io',
    'editor',
    'invited',
    '2026-09-09',
    '2026-09-09',
  ),
  member(
    'usr_12',
    'Mia Johansson',
    'mia.johansson@northwind.io',
    'viewer',
    'active',
    '2026-02-03',
    '2026-09-14',
  ),
];

export const INVOICES: readonly Invoice[] = [
  {
    id: 'inv_2609',
    number: 'INV-2026-09',
    issuedAt: '2026-09-01',
    amount: 348,
    status: 'pending',
    period: 'Sep 2026',
  },
  {
    id: 'inv_2608',
    number: 'INV-2026-08',
    issuedAt: '2026-08-01',
    amount: 348,
    status: 'paid',
    period: 'Aug 2026',
  },
  {
    id: 'inv_2607',
    number: 'INV-2026-07',
    issuedAt: '2026-07-01',
    amount: 319,
    status: 'paid',
    period: 'Jul 2026',
  },
  {
    id: 'inv_2606',
    number: 'INV-2026-06',
    issuedAt: '2026-06-01',
    amount: 319,
    status: 'failed',
    period: 'Jun 2026',
  },
  {
    id: 'inv_2605',
    number: 'INV-2026-05',
    issuedAt: '2026-05-01',
    amount: 290,
    status: 'paid',
    period: 'May 2026',
  },
  {
    id: 'inv_2604',
    number: 'INV-2026-04',
    issuedAt: '2026-04-01',
    amount: 290,
    status: 'paid',
    period: 'Apr 2026',
  },
  {
    id: 'inv_2603',
    number: 'INV-2026-03',
    issuedAt: '2026-03-01',
    amount: 261,
    status: 'paid',
    period: 'Mar 2026',
  },
  {
    id: 'inv_2602',
    number: 'INV-2026-02',
    issuedAt: '2026-02-01',
    amount: 261,
    status: 'paid',
    period: 'Feb 2026',
  },
  {
    id: 'inv_2601',
    number: 'INV-2026-01',
    issuedAt: '2026-01-01',
    amount: 232,
    status: 'paid',
    period: 'Jan 2026',
  },
  {
    id: 'inv_2512',
    number: 'INV-2025-12',
    issuedAt: '2025-12-01',
    amount: 232,
    status: 'paid',
    period: 'Dec 2025',
  },
];

export const NOTIFICATION_ROWS: readonly NotificationRow[] = [
  { id: 'mentions', group: 'activity', enabled: true },
  { id: 'comments', group: 'activity', enabled: true },
  { id: 'assignments', group: 'activity', enabled: false },
  { id: 'weeklyDigest', group: 'activity', enabled: true },
  { id: 'newSignIn', group: 'security', enabled: true },
  { id: 'passwordChanged', group: 'security', enabled: true },
  { id: 'apiKeyCreated', group: 'security', enabled: false },
  { id: 'invoiceIssued', group: 'billing', enabled: true },
  { id: 'paymentFailed', group: 'billing', enabled: true },
  { id: 'usageLimit', group: 'billing', enabled: false },
];

export const ADVANCED_NOTIFICATIONS: readonly AdvancedNotificationRow[] = [
  { id: 'ownActivity', enabled: false },
  { id: 'resolvedThreads', enabled: false },
  { id: 'batchHourly', enabled: true },
  { id: 'quietHours', enabled: true },
];

export const PLANS: readonly Plan[] = [
  { id: 'starter', pricePerSeat: 12, includedSeats: 5, includedStorage: 20 },
  { id: 'team', pricePerSeat: 29, includedSeats: 20, includedStorage: 200 },
  {
    id: 'business',
    pricePerSeat: 49,
    includedSeats: 100,
    includedStorage: 1000,
  },
];

export const CURRENT_PLAN: PlanId = 'team';

/** Storage consumed, in gigabytes. */
export const STORAGE_USED = 148;

export const TRIAL_ENDS_AT = '2026-10-04';

export function activeMembers(
  members: readonly TeamMember[],
): readonly TeamMember[] {
  return members.filter((entry) => entry.status === 'active');
}

export function seatsInUse(members: readonly TeamMember[]): number {
  return members.filter((entry) => entry.status !== 'suspended').length;
}

export function planById(id: PlanId): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

/** `148` of `200` gigabytes → `74`. */
export function usagePercent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

export function outstandingTotal(invoices: readonly Invoice[]): number {
  return invoices
    .filter((invoice) => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
}
