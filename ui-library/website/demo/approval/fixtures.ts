import type {
  ApprovalBranch,
  ApprovalCopy,
  ApprovalReceipt,
  ApprovalRoute,
  ApprovalStep,
  ApprovalTimelineLine,
} from '#extensions/nocobase-approval-ui/index';

/**
 * One expense claim, already mapped for display: the manager approved it,
 * finance is deciding — one of two has answered — and the CFO is still
 * ahead. An application builds these from its own approval data; the
 * preview and the tests use them as they are.
 */

export const PEOPLE: Readonly<Record<string, string>> = {
  ming: 'Ming Chen',
  li: 'Li Na',
  wang: 'Wang Wei',
  zhao: 'Zhao Lei',
  chen: 'Chen Jie',
  zhou: 'Zhou Xin',
};

export const STEPS: readonly ApprovalStep[] = [
  {
    key: 'manager',
    title: 'Manager review',
    state: 'done',
    at: '2026-10-06T10:20:00.000Z',
    tasks: [
      {
        key: 't1',
        personId: 'li',
        badges: [{ label: 'Approved', variant: 'secondary' }],
        comment: 'Receipts look fine.',
      },
    ],
  },
  {
    key: 'finance',
    title: 'Finance review',
    state: 'current',
    policy: 'everyone approves',
    at: '2026-10-06T10:20:00.000Z',
    tally: {
      total: 2,
      counts: [
        { key: 'approve', label: 'Approve', count: 1, tone: 'positive' },
        { key: 'reject', label: 'Reject', count: 0, tone: 'negative' },
      ],
    },
    tasks: [
      {
        key: 't2',
        personId: 'wang',
        badges: [{ label: 'Approved', variant: 'secondary' }],
      },
      {
        key: 't3',
        personId: 'zhao',
        badges: [{ label: 'Waiting', variant: 'outline' }],
        notes: ['handed over'],
        due: { label: 'overdue by 2 hours', overdue: true },
      },
    ],
  },
  { key: 'cfo', title: 'CFO sign-off', state: 'upcoming', tasks: [] },
];

export const COPIES: readonly ApprovalCopy[] = [
  { key: 't4', personId: 'chen', read: false },
];

export const LINES: readonly ApprovalTimelineLine[] = [
  {
    key: 'created',
    at: '2026-10-06T08:55:00.000Z',
    actorId: 'ming',
    kind: 'event',
    title: 'created the claim',
  },
  {
    key: 'started',
    at: '2026-10-06T09:00:00.000Z',
    actorId: 'ming',
    kind: 'event',
    title: 'started the approval',
    emphasis: 'muted',
  },
  {
    key: 'assigned',
    at: '2026-10-06T09:00:00.000Z',
    actorId: 'ming',
    kind: 'event',
    title: 'assigned a task · Li Na',
    emphasis: 'muted',
  },
  {
    key: 'a1',
    at: '2026-10-06T10:20:00.000Z',
    actorId: 'li',
    kind: 'action',
    title: 'Li Na approved',
    comment: 'Receipts look fine.',
    children: [
      { key: 'e2', label: 'answered' },
      { key: 'e3', label: 'concluded a stage' },
    ],
  },
  {
    key: 'a2',
    at: '2026-10-06T14:05:00.000Z',
    actorId: 'wang',
    kind: 'action',
    title: 'Wang Wei approved',
    children: [{ key: 'e5', label: 'answered' }],
  },
  {
    key: 'a3',
    at: '2026-10-06T14:30:00.000Z',
    actorId: 'ming',
    kind: 'action',
    title: 'Ming Chen sent a copy to Chen Jie',
    children: [{ key: 'e6', label: 'assigned a task · Chen Jie' }],
  },
];

export const ROUTE: ApprovalRoute = {
  mode: 'stages',
  stops: [
    {
      key: 'manager',
      title: 'Manager review',
      people: ['li'],
      included: true,
    },
    {
      key: 'finance',
      title: 'Finance review',
      people: ['wang', 'zhao'],
      policy: 'everyone approves',
      included: true,
      because: 'Over 1,000',
    },
    {
      key: 'cfo',
      title: 'CFO sign-off',
      people: [],
      included: false,
      because: 'Under 5,000',
    },
  ],
  problems: [],
  notes: ['Li Na manages Ming Chen.'],
};

/** A purchase split across departments: two finished, IT still deciding, security holding it up. */
export const BRANCHES: readonly ApprovalBranch[] = [
  {
    key: 'it',
    title: 'IT',
    state: 'current',
    badge: { label: 'Awaiting review' },
    ownerIds: ['wang'],
    step: 'Review',
  },
  {
    key: 'security',
    title: 'Information security',
    state: 'rejected',
    badge: { label: 'Rejected', variant: 'destructive' },
    ownerIds: [],
    blocked: true,
  },
  {
    key: 'legal',
    title: 'Legal',
    state: 'done',
    badge: { label: 'Approved', variant: 'secondary' },
    ownerIds: [],
  },
  {
    key: 'facilities',
    title: 'Facilities',
    state: 'done',
    badge: { label: 'Approved', variant: 'secondary' },
    ownerIds: [],
    required: false,
  },
];

/** A notice everyone has to confirm: one confirmed, one read, one not yet. */
export const RECEIPTS: readonly ApprovalReceipt[] = [
  {
    key: 'r1',
    personId: 'li',
    state: 'confirmed',
    label: 'Confirmed',
    at: '2026-10-06T11:00:00.000Z',
    comments: [{ key: 'c1', text: 'Noted, thanks.' }],
  },
  { key: 'r2', personId: 'wang', state: 'read', label: 'Read' },
  { key: 'r3', personId: 'zhao', state: 'unread', label: 'Unread' },
];
