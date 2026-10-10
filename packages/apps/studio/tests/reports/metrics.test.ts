// @vitest-environment node
/**
 * Studio's reports over the joined agents and projects plugins: usage grouped with Studio's names (a project is a run's
 * group, an issue its subject) and the acceptance metrics assembled from the agents
 * plugin's run figures and the projects plugin's issue figures, over what the person may see.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createPermissionSource } from '../../server/agents/commands/permissions.js';
import {
  createStudioReports,
  isoWeek,
  metricStatus,
  percentile,
  type StudioReports,
} from '../../server/reports/service.js';
import {
  createBridgeHarness,
  permissionsOf,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let reports: StudioReports;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob', 'carol']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  const permissions = createPermissionSource(() => ({
    permissionsOfUser: (userId: string) =>
      Promise.resolve(permissionsOf(h.roles.get(userId) ?? 'member', userId)),
  }));
  reports = createStudioReports({
    agents: h.agents,
    projects: () => h.projects,
    viewerOf: (userId) =>
      permissions.viewerOf({ kind: 'user', userId, displayName: userId }),
    connection: () => h.database.connection(),
  });
});
afterEach(() => h.close());

/** Three issues worked by two agents, two of them done, with usage and a comment each. */
async function seed() {
  const alice = h.viewer('alice');
  const alpha = await h.projects.projects.create(alice, { name: 'Alpha' });
  const beta = await h.projects.projects.create(alice, { name: 'Beta' });
  const coder = await h.createAgent({ name: 'Coder' });
  const reviewer = await h.createAgent({ name: 'Reviewer' });
  await h.agents.prices.replace({
    subscriptions: [],
    prices: [
      {
        tool: 'claude',
        model: 'claude-sonnet-4*',
        inputPerM: 3,
        outputPerM: 15,
      },
    ],
  });
  const work: [string, string, string, string][] = [
    [alpha.id, coder, 'claude-sonnet-4-5', 'done'],
    [alpha.id, reviewer, 'claude-haiku-4-5', 'done'],
    [beta.id, coder, 'claude-sonnet-4-5', 'in_progress'],
  ];
  for (const [index, [projectId, agentId, model, end]] of work.entries()) {
    const issue = await h.projects.issues.create(alice, {
      title: `Work ${index + 1}`,
      projectId,
    });
    const current = await h.projects.issueQueries.detail(alice, issue.id);
    await h.projects.issues.update(alice, issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: agentId },
    });
    const payload = await h.claimOne();
    await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/w',
      adapter: { kind: 'claude' },
      acceptsInput: false,
    });
    const done = await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
      summary: 'Done.',
      handledInputIds: payload.inputs.map((input: { id: string }) => input.id),
      usage: [
        { tool: 'claude', model, inputTokens: 1_000_000, outputTokens: 2000 },
      ],
    });
    expect(done.status).toBe(200);
    await h.projects.comments.create(h.viewer('bob'), issue.id, {
      content: 'Looks good.',
    });
    const fresh = await h.projects.issueQueries.detail(alice, issue.id);
    await h.projects.issues.update(alice, issue.id, {
      revision: fresh.revision,
      statusKey: end,
    });
  }
  return { alpha, beta, coder, reviewer };
}

const ALL = { userId: 'alice', allRuns: true } as const;

describe('usage', () => {
  it('groups by project and issue, and filters by project', async () => {
    const { alpha } = await seed();
    const byProject = await reports.usage(ALL, { groupBy: 'project' });
    expect(byProject.groupBy).toBe('project');
    expect(byProject.rows.map((row) => [row.name, row.runs, row.cost])).toEqual(
      [
        ['Alpha', 2, { USD: 3.03 }],
        ['Beta', 1, { USD: 3.03 }],
      ],
    );
    const byIssue = await reports.usage(ALL, {
      groupBy: 'issue',
      projectId: alpha.id,
    });
    expect(byIssue.groupBy).toBe('issue');
    expect(byIssue.rows.map((row) => row.name).sort()).toEqual([
      'PM-1 Work 1',
      'PM-2 Work 2',
    ]);
    expect(byIssue.rows.every((row) => row.key.startsWith('issue:'))).toBe(
      true,
    );
  });
});

describe('metrics', () => {
  it('adds the issue figures to the run figures', async () => {
    const { coder, reviewer } = await seed();
    const report = await reports.metrics(ALL, {});
    expect(report).toMatchObject({
      projectId: null,
      subjects: true,
      adoption: {
        activeWeeks: 1,
        activeDays: 1,
        issuesCreated: 3,
        commentsCreated: 3,
        activeMembers: 2,
      },
      aiShare: { share: 1, deliveredByAgent: 2, deliveredTotal: 2 },
      // Bob's comments on Alice's issues wait for her to confirm them (run requests): only the work given runs.
      reliability: { runs: 3, completedRuns: 3, failedRuns: 0, lostRuns: 0 },
      cost: {
        inputTokens: 3_000_000,
        outputTokens: 6000,
        estimatedCost: { USD: 6.06 },
        costPerDeliveredIssue: { USD: 3.03 },
        byAgent: [
          { agentId: coder, name: 'Coder', cost: { USD: 6.06 } },
          { agentId: reviewer, name: 'Reviewer', cost: null },
        ],
      },
      statuses: { aiShare: 'ok', reviewPassRate: 'n/a', lostRuns: 'ok' },
    });
    expect(report.aiShare.byAgent.map((item) => item.name).sort()).toEqual([
      'Coder',
      'Reviewer',
    ]);
  });

  it('keeps to a project, and to the runs of someone who may not see them all', async () => {
    const { alpha } = await seed();
    expect(await reports.metrics(ALL, { projectId: alpha.id })).toMatchObject({
      projectId: alpha.id,
      adoption: { issuesCreated: 2, commentsCreated: 2 },
      reliability: { runs: 2 },
      cost: {
        estimatedCost: { USD: 3.03 },
        costPerDeliveredIssue: { USD: 1.515 },
      },
    });
    // Bob's comments only asked Alice; he runs one of them as himself, the one run that is his.
    const [asked] = await h.agents.runs.requests.list({
      userId: 'bob',
      role: 'requester',
      status: 'pending',
    });
    await h.agents.runs.requests.runAsRequester(asked!.id, 'bob');
    expect(
      await reports.metrics({ userId: 'bob', allRuns: false }, {}),
    ).toMatchObject({
      reliability: { runs: 1 },
      cost: { estimatedCost: null, costPerDeliveredIssue: null },
    });
  });

  it('counts every decision people take, not only approval requests', async () => {
    const { alpha } = await seed();
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Decide on it',
      projectId: alpha.id,
    });
    // A plan about an issue of Alpha, waiting for Alice.
    await h.projects.plans.propose({
      title: 'Raise it',
      description: 'Raise the priority.',
      source: { kind: 'test', key: 'test:1', issueId: issue.id, data: {} },
      deciderUserId: 'alice',
      rows: [
        {
          op: 'issue.update',
          params: { issue: issue.id, set: { priority: 'high' } },
        },
      ],
    });
    // A deployment request sent to two approvers and approved an hour later: one decision about no issue.
    const now = Date.now();
    for (const [index, userId] of ['alice', 'bob'].entries())
      await h.database
        .connection()
        .query.insertInto('studioInboxNotices')
        .values({
          id: `n-${index}`,
          notificationId: `notification-${index}`,
          userId,
          source: 'releases',
          kind: 'decision',
          type: 'deployment_requested',
          subjectType: 'app',
          subjectId: 'shop',
          decisionKey: 'request-1',
          resolvedAt: new Date(now - 1000),
          outcome: 'approved',
          count: 1,
          createdAt: new Date(now - 3600_000 - 1000),
        })
        .execute();
    const report = await reports.metrics(ALL, {});
    expect(report.humanLoad).toMatchObject({
      decisionsCreated: 2,
      decisionsResolved: 1,
      openDecisions: 1,
      byKind: { approvals: 0, plans: 1, deployRequests: 1 },
      byOutcome: { approved: 1 },
    });
    expect(report.humanLoad.decisionResolveP50Ms).toBe(3600_000);
    // In a project's report a decision about no issue does not count.
    expect(
      (await reports.metrics(ALL, { projectId: alpha.id })).humanLoad.byKind,
    ).toEqual({ approvals: 0, plans: 1 });
  });

  it('reads percentiles, weeks and targets', () => {
    expect(percentile([5, 1, 3, 2, 4], 0.5)).toBe(3);
    expect(percentile([], 0.5)).toBeNull();
    expect(isoWeek('2025-12-29')).toBe('2026-W01');
    expect(isoWeek('2026-10-01')).toBe('2026-W40');
    expect(metricStatus('aiShare', 0.5)).toBe('ok');
    expect(metricStatus('aiShare', 0.4)).toBe('warn');
    expect(metricStatus('lostRuns', 1)).toBe('warn');
    expect(metricStatus('claimLatencyP50Ms', null)).toBe('n/a');
  });
});
