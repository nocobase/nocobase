import type {
  Plan,
  PlanRow,
  PlanStatus,
} from '@nocobase/app-plugin-projects/shared/plans';

// Sample plans for the plan-card demo and its tests: one waiting for the viewer, one executed that can still be undone,
// and one whose execution failed.

const NOW = Date.now();
const at = (hours: number): string =>
  new Date(NOW + hours * 3_600_000).toISOString();

export const VIEWER_ID = 'u-ada';

const base = {
  voidReason: null,
  proposer: { agentId: 'coder' },
  proposerName: 'Coding agent',
  deciderUserId: VIEWER_ID,
  deciderName: 'Ada Lovelace',
  createdBy: { type: 'agent', id: 'coder' },
  revision: 1,
  failure: null,
  rehearsedAt: at(-1),
  executedAt: null,
  executedById: null,
  undoableUntil: null,
  skipped: [],
  createdAt: at(-1),
  updatedAt: at(-1),
} as const;

const check = (
  overrides: Partial<NonNullable<PlanRow['check']>> = {},
): NonNullable<PlanRow['check']> => ({
  ok: true,
  error: null,
  target: null,
  wakes: [],
  flags: [],
  baseline: null,
  ...overrides,
});

const pendingRows: readonly PlanRow[] = [
  {
    id: 'r1',
    position: 0,
    op: 'issue.create',
    ref: 'export',
    params: {
      title: 'Export issues as CSV',
      description: 'Every column the list shows, in its order.',
      projectId: 'p-acme',
      priority: 'high',
      labelIds: ['l-backend'],
      executor: { type: 'agent', id: 'coder' },
    },
    check: check({
      flags: ['agentExecutor', 'startsRun'],
      wakes: [
        {
          kind: 'agent',
          principalId: 'coder',
          name: 'Coding agent',
          subjectId: 'new',
          triggerType: 'assigned',
          started: true,
        },
      ],
    }),
    result: null,
  },
  {
    id: 'r2',
    position: 1,
    op: 'issue.create',
    ref: 'button',
    params: {
      title: 'Add the Export button to the toolbar',
      parentIssueId: { ref: 'export' },
      projectId: 'p-acme',
      priority: 'medium',
      labelIds: ['l-frontend'],
    },
    check: check(),
    result: null,
  },
  {
    id: 'r3',
    position: 2,
    op: 'issue.update',
    ref: null,
    params: {
      issue: 'i-34',
      set: { statusKey: 'in_review', ownerUserId: 'u-grace' },
    },
    check: check({
      target: {
        type: 'issue',
        id: 'i-34',
        identifier: 'PM-34',
        title: 'Mentions',
      },
      flags: ['ownerChange'],
      baseline: {
        target: {
          type: 'issue',
          id: 'i-34',
          identifier: 'PM-34',
          title: 'Mentions',
        },
        fields: { statusKey: 'in_progress', ownerUserId: VIEWER_ID },
      },
    }),
    result: null,
  },
  {
    id: 'r4',
    position: 3,
    op: 'comment.create',
    ref: null,
    params: {
      issue: 'i-34',
      content: 'Moved to review: the **mentions** work is done.',
    },
    check: check({
      target: {
        type: 'issue',
        id: 'i-34',
        identifier: 'PM-34',
        title: 'Mentions',
      },
    }),
    result: null,
  },
];

function plan(
  id: string,
  status: PlanStatus,
  overrides: Partial<Plan> = {},
): Plan {
  return {
    ...base,
    id,
    title: 'Plan the CSV export',
    description:
      'Two issues for the export, and the mentions work moved to review.',
    status,
    source: { kind: 'conversation', key: 'conversation:c1' },
    rows: pendingRows,
    expiresAt: at(20),
    ...overrides,
  };
}

/** A fresh copy of the sample plans, keyed by id. */
export function samplePlans(): Map<string, Plan> {
  return new Map(
    [
      plan('plan-pending', 'pending'),
      plan('plan-executed', 'executed', {
        title: 'Close the finished sign-in issues',
        description: '',
        source: { kind: 'statusRule', key: 'statusRule:i-12' },
        executedAt: at(-2),
        executedById: VIEWER_ID,
        undoableUntil: at(22),
        rows: [
          {
            id: 'e1',
            position: 0,
            op: 'issue.update',
            ref: null,
            params: { issue: 'i-12', set: { statusKey: 'done' } },
            check: check({ flags: ['finalStatus'] }),
            result: {
              target: {
                type: 'issue',
                id: 'i-12',
                identifier: 'PM-12',
                title: 'Sign-in form',
              },
              created: null,
              after: { statusKey: 'done' },
              revision: 4,
              wakes: [],
            },
          },
        ],
      }),
      plan('plan-failed', 'failed', {
        title: 'Hand the payments work to the agent',
        description: '',
        failure: {
          code: 'FORBIDDEN',
          message: 'You may not change this issue.',
          rowId: 'f1',
        },
        rows: [
          {
            id: 'f1',
            position: 0,
            op: 'issue.update',
            ref: null,
            params: {
              issue: 'i-40',
              set: { executor: { type: 'agent', id: 'coder' } },
            },
            check: check({
              ok: false,
              error: {
                code: 'FORBIDDEN',
                message: 'You may not change this issue.',
              },
              target: {
                type: 'issue',
                id: 'i-40',
                identifier: 'PM-40',
                title: 'Payments',
              },
              flags: ['agentExecutor'],
            }),
            result: null,
          },
        ],
      }),
    ].map((entry) => [entry.id, entry]),
  );
}
