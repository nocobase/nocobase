/** Mock data for the Customers example. Nothing here reaches a server. */

export type CustomerTier = 'enterprise' | 'business' | 'starter';

export type CustomerStatus = 'active' | 'inactive' | 'pending';

export type CustomerActivityKind =
  'order' | 'email' | 'call' | 'meeting' | 'note';

export interface CustomerActivity {
  readonly id: string;
  readonly kind: CustomerActivityKind;
  readonly summary: string;
  readonly at: string;
}

export interface CustomerNote {
  readonly id: string;
  readonly author: string;
  readonly body: string;
  readonly at: string;
}

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly email: string;
  readonly phone: string;
  readonly company: string;
  readonly title: string;
  readonly tier: CustomerTier;
  readonly status: CustomerStatus;
  readonly lifetimeValue: number;
  readonly orders: number;
  readonly tags: readonly string[];
  readonly city: string;
  readonly country: string;
  readonly since: string;
  readonly lastActiveAt: string;
  readonly activity: readonly CustomerActivity[];
  readonly notes: readonly CustomerNote[];
}

export const CUSTOMER_TIERS: readonly CustomerTier[] = [
  'enterprise',
  'business',
  'starter',
];

export const CUSTOMER_STATUSES: readonly CustomerStatus[] = [
  'active',
  'inactive',
  'pending',
];

export function customerInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Case-insensitive match on name, company, email and tags. */
export function matchesQuery(customer: Customer, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return [customer.name, customer.company, customer.email, ...customer.tags]
    .join(' ')
    .toLocaleLowerCase()
    .includes(needle);
}

interface CustomerSeed {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly company: string;
  readonly title: string;
  readonly tier: CustomerTier;
  readonly status: CustomerStatus;
  readonly lifetimeValue: number;
  readonly orders: number;
  readonly tags: readonly string[];
  readonly city: string;
  readonly country: string;
  readonly since: string;
  readonly lastActiveAt: string;
  readonly activity: readonly CustomerActivity[];
  readonly notes: readonly CustomerNote[];
}

function customer(seed: CustomerSeed): Customer {
  return { ...seed, initials: customerInitials(seed.name) };
}

export const CUSTOMERS: readonly Customer[] = [
  customer({
    id: 'cus_001',
    name: 'Ava Thompson',
    email: 'ava.thompson@northwind.io',
    phone: '+1 415 555 0132',
    company: 'Northwind Traders',
    title: 'Head of Operations',
    tier: 'enterprise',
    status: 'active',
    lifetimeValue: 48200,
    orders: 37,
    tags: ['VIP', 'Renewal Q4'],
    city: 'San Francisco',
    country: 'United States',
    since: '2023-02-14T00:00:00Z',
    lastActiveAt: '2026-09-19T14:20:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1001 · $1,038',
        at: '2026-09-02T09:14:00Z',
      },
      {
        id: 'a2',
        kind: 'meeting',
        summary: 'Quarterly review with account team',
        at: '2026-08-21T15:00:00Z',
      },
      {
        id: 'a3',
        kind: 'email',
        summary: 'Sent renewal proposal for 2027',
        at: '2026-08-12T10:32:00Z',
      },
    ],
    notes: [
      {
        id: 'n1',
        author: 'Grace Osei',
        body: 'Prefers invoices consolidated monthly. Decision maker for the EU rollout.',
        at: '2026-08-12T11:05:00Z',
      },
    ],
  }),
  customer({
    id: 'cus_002',
    name: 'Liam Chen',
    email: 'liam.chen@fabrikam.com',
    phone: '+1 206 555 0177',
    company: 'Fabrikam Inc.',
    title: 'Procurement Manager',
    tier: 'business',
    status: 'active',
    lifetimeValue: 21750,
    orders: 19,
    tags: ['Net 30'],
    city: 'Seattle',
    country: 'United States',
    since: '2024-05-03T00:00:00Z',
    lastActiveAt: '2026-09-17T09:02:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1002 · $858',
        at: '2026-09-04T13:40:00Z',
      },
      {
        id: 'a2',
        kind: 'call',
        summary: 'Asked about bulk monitor pricing',
        at: '2026-08-28T16:10:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_003',
    name: 'Sofia Rossi',
    email: 'sofia.rossi@contoso.com',
    phone: '+39 02 5550 1421',
    company: 'Contoso Ltd.',
    title: 'Office Manager',
    tier: 'starter',
    status: 'pending',
    lifetimeValue: 3690,
    orders: 4,
    tags: ['Onboarding'],
    city: 'Milan',
    country: 'Italy',
    since: '2026-07-22T00:00:00Z',
    lastActiveAt: '2026-09-06T08:05:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1003 · $564',
        at: '2026-09-06T08:05:00Z',
      },
      {
        id: 'a2',
        kind: 'email',
        summary: 'Welcome sequence completed',
        at: '2026-07-29T08:00:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_004',
    name: 'Noah Patel',
    email: 'noah.patel@tailspin.co',
    phone: '+44 20 7946 0958',
    company: 'Tailspin Toys',
    title: 'Founder',
    tier: 'business',
    status: 'active',
    lifetimeValue: 15420,
    orders: 12,
    tags: ['Referral'],
    city: 'London',
    country: 'United Kingdom',
    since: '2024-11-18T00:00:00Z',
    lastActiveAt: '2026-09-07T16:22:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1004 · $316',
        at: '2026-09-07T16:22:00Z',
      },
    ],
    notes: [
      {
        id: 'n1',
        author: 'Tom Becker',
        body: 'Referred by Ava Thompson. Interested in the lighting range for a new studio.',
        at: '2026-09-08T09:40:00Z',
      },
    ],
  }),
  customer({
    id: 'cus_005',
    name: 'Emma Fischer',
    email: 'emma.fischer@adatum.de',
    phone: '+49 30 5550 8821',
    company: 'Adatum GmbH',
    title: 'Facilities Lead',
    tier: 'enterprise',
    status: 'inactive',
    lifetimeValue: 62900,
    orders: 44,
    tags: ['Churn risk', 'EU'],
    city: 'Berlin',
    country: 'Germany',
    since: '2022-09-01T00:00:00Z',
    lastActiveAt: '2026-06-30T11:48:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'email',
        summary: 'Cancelled SO-2026-1005 — budget freeze',
        at: '2026-09-08T11:48:00Z',
      },
      {
        id: 'a2',
        kind: 'call',
        summary: 'Check-in call, no answer',
        at: '2026-08-15T14:00:00Z',
      },
    ],
    notes: [
      {
        id: 'n1',
        author: 'Grace Osei',
        body: 'Contract ends in December. Schedule an executive call before November.',
        at: '2026-09-09T08:15:00Z',
      },
    ],
  }),
  customer({
    id: 'cus_006',
    name: 'Mateo García',
    email: 'mateo.garcia@alpineski.es',
    phone: '+34 91 555 0246',
    company: 'Alpine Ski House',
    title: 'Store Director',
    tier: 'business',
    status: 'active',
    lifetimeValue: 18300,
    orders: 15,
    tags: ['Seasonal'],
    city: 'Madrid',
    country: 'Spain',
    since: '2024-01-09T00:00:00Z',
    lastActiveAt: '2026-09-09T10:30:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1006 · $438',
        at: '2026-09-09T10:30:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_007',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@woodgrove.jp',
    phone: '+81 3 5550 7712',
    company: 'Woodgrove Bank',
    title: 'IT Coordinator',
    tier: 'enterprise',
    status: 'active',
    lifetimeValue: 39750,
    orders: 28,
    tags: ['APAC'],
    city: 'Tokyo',
    country: 'Japan',
    since: '2023-06-27T00:00:00Z',
    lastActiveAt: '2026-09-10T07:15:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Refund issued for SO-2026-1007 · $429',
        at: '2026-09-11T09:00:00Z',
      },
      {
        id: 'a2',
        kind: 'email',
        summary: 'Reported a dead pixel on a 27" monitor',
        at: '2026-09-10T12:20:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_008',
    name: 'Olivia Brown',
    email: 'olivia.brown@litware.com',
    phone: '+1 312 555 0193',
    company: 'Litware Inc.',
    title: 'Workplace Experience Manager',
    tier: 'business',
    status: 'active',
    lifetimeValue: 27480,
    orders: 21,
    tags: ['Net 30', 'Expansion'],
    city: 'Chicago',
    country: 'United States',
    since: '2023-10-12T00:00:00Z',
    lastActiveAt: '2026-09-11T14:02:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1008 · $1,298',
        at: '2026-09-11T14:02:00Z',
      },
      {
        id: 'a2',
        kind: 'meeting',
        summary: 'Walkthrough of the new floor plan',
        at: '2026-09-03T17:00:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_009',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@proseware.com',
    phone: '+20 2 5550 3318',
    company: 'Proseware',
    title: 'Operations Analyst',
    tier: 'starter',
    status: 'active',
    lifetimeValue: 2140,
    orders: 3,
    tags: [],
    city: 'Cairo',
    country: 'Egypt',
    since: '2026-03-30T00:00:00Z',
    lastActiveAt: '2026-09-12T09:55:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1009 · $129',
        at: '2026-09-12T09:55:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_010',
    name: 'Chloé Martin',
    email: 'chloe.martin@margiestravel.fr',
    phone: '+33 1 5550 4470',
    company: "Margie's Travel",
    title: 'Agency Owner',
    tier: 'starter',
    status: 'active',
    lifetimeValue: 4860,
    orders: 6,
    tags: ['Newsletter'],
    city: 'Lyon',
    country: 'France',
    since: '2025-08-19T00:00:00Z',
    lastActiveAt: '2026-09-13T12:10:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1010 · $276',
        at: '2026-09-13T12:10:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_011',
    name: 'Daniel Kim',
    email: 'daniel.kim@wideworldimporters.kr',
    phone: '+82 2 5550 9931',
    company: 'Wide World Importers',
    title: 'Purchasing Director',
    tier: 'enterprise',
    status: 'active',
    lifetimeValue: 71300,
    orders: 52,
    tags: ['VIP', 'APAC', 'Net 60'],
    city: 'Seoul',
    country: 'South Korea',
    since: '2022-04-05T00:00:00Z',
    lastActiveAt: '2026-09-15T15:45:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1011 · $1,245',
        at: '2026-09-15T15:45:00Z',
      },
      {
        id: 'a2',
        kind: 'meeting',
        summary: 'Negotiated 2027 framework agreement',
        at: '2026-09-01T09:30:00Z',
      },
      {
        id: 'a3',
        kind: 'note',
        summary: 'Requested a dedicated support contact',
        at: '2026-08-20T11:00:00Z',
      },
    ],
    notes: [
      {
        id: 'n1',
        author: 'Hugo Lind',
        body: 'Largest account in APAC. Ships to three warehouses; always confirm the destination before dispatch.',
        at: '2026-08-20T11:10:00Z',
      },
    ],
  }),
  customer({
    id: 'cus_012',
    name: 'Isabella Silva',
    email: 'isabella.silva@bellowscollege.br',
    phone: '+55 11 5550 2205',
    company: 'Bellows College',
    title: 'Campus Services Coordinator',
    tier: 'business',
    status: 'active',
    lifetimeValue: 12980,
    orders: 9,
    tags: ['Education'],
    city: 'São Paulo',
    country: 'Brazil',
    since: '2025-02-11T00:00:00Z',
    lastActiveAt: '2026-09-16T08:38:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1012 · $567',
        at: '2026-09-16T08:38:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_013',
    name: 'Lucas Müller',
    email: 'lucas.mueller@relecloud.at',
    phone: '+43 1 5550 6684',
    company: 'Relecloud',
    title: 'Engineering Manager',
    tier: 'starter',
    status: 'pending',
    lifetimeValue: 468,
    orders: 1,
    tags: ['Trial'],
    city: 'Vienna',
    country: 'Austria',
    since: '2026-09-18T00:00:00Z',
    lastActiveAt: '2026-09-18T17:20:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1013 · $468',
        at: '2026-09-18T17:20:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_014',
    name: 'Mia Johansson',
    email: 'mia.johansson@lucernepublishing.se',
    phone: '+46 8 5550 1179',
    company: 'Lucerne Publishing',
    title: 'Editor in Chief',
    tier: 'business',
    status: 'active',
    lifetimeValue: 9840,
    orders: 8,
    tags: ['Newsletter'],
    city: 'Stockholm',
    country: 'Sweden',
    since: '2025-05-27T00:00:00Z',
    lastActiveAt: '2026-09-20T10:05:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'order',
        summary: 'Placed SO-2026-1014 · $617',
        at: '2026-09-20T10:05:00Z',
      },
      {
        id: 'a2',
        kind: 'email',
        summary: 'Asked for a quote on 12 standing desks',
        at: '2026-09-14T09:12:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_015',
    name: 'Ethan Walker',
    email: 'ethan.walker@coho.io',
    phone: '+1 646 555 0148',
    company: 'Coho Winery',
    title: 'General Manager',
    tier: 'starter',
    status: 'inactive',
    lifetimeValue: 1290,
    orders: 2,
    tags: ['Churn risk'],
    city: 'New York',
    country: 'United States',
    since: '2025-11-03T00:00:00Z',
    lastActiveAt: '2026-03-14T13:30:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'email',
        summary: 'Win-back offer sent, unopened',
        at: '2026-08-01T08:00:00Z',
      },
    ],
    notes: [],
  }),
  customer({
    id: 'cus_016',
    name: 'Amara Okafor',
    email: 'amara.okafor@graphicdesigninstitute.ng',
    phone: '+234 1 555 0301',
    company: 'Graphic Design Institute',
    title: 'Studio Director',
    tier: 'business',
    status: 'active',
    lifetimeValue: 16750,
    orders: 14,
    tags: ['Education', 'Expansion'],
    city: 'Lagos',
    country: 'Nigeria',
    since: '2024-08-22T00:00:00Z',
    lastActiveAt: '2026-09-19T11:45:00Z',
    activity: [
      {
        id: 'a1',
        kind: 'call',
        summary: 'Scoped a second studio fit-out',
        at: '2026-09-19T11:45:00Z',
      },
      {
        id: 'a2',
        kind: 'order',
        summary: 'Placed SO-2026-0987 · $2,140',
        at: '2026-08-27T10:00:00Z',
      },
    ],
    notes: [],
  }),
];
