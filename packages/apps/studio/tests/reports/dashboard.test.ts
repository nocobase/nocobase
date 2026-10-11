// @vitest-environment node
/**
 * The dashboard's figures and exceptions over the joined agents and projects plugins and Studio's pull requests: delivery
 * (throughput, cycle time, the agents' share, cost per issue), the agents' performance (success, rework, runs per issue,
 * human intervention, queue wait), by project, and what needs attention, over what the person may see.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type { ReportRun } from '@nocobase/app-plugin-agents/shared/reports';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createPermissionSource } from '../../server/agents/commands/permissions.js';
import {
  ensureRepo,
  insertLink,
  PULL_REQUESTS,
} from '../../server/git/store.js';
import {
  failedRecently,
  interventions,
  median,
  periodFigures,
} from '../../server/reports/dashboard.js';
import {
  createStudioReports,
  type StudioReports,
} from '../../server/reports/service.js';
import {
  createBridgeHarness,
  permissionsOf,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

const DAY = 24 * 3600 * 1000;

let h: BridgeHarness;
let reports: StudioReports;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
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

const ALL = { userId: 'alice', allRuns: true } as const;
const conn = () => h.database.connection();

/** Two issues an agent completed with a priced run each, and one still in progress in another project. */
async function seed() {
  const alice = h.viewer('alice');
  const alpha = await h.projects.projects.create(alice, { name: 'Alpha' });
  const beta = await h.projects.projects.create(alice, {
    name: 'Beta',
    visibility: 'members',
  });
  const coder = await h.createAgent({ name: 'Coder' });
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
  const issues = [];
  const runs: string[] = [];
  for (const [projectId, end] of [
    [alpha.id, 'done'],
    [alpha.id, 'done'],
    [beta.id, 'in_progress'],
  ] as const) {
    const issue = await h.projects.issues.create(alice, {
      title: `Work ${issues.length + 1}`,
      projectId,
    });
    const current = await h.projects.issueQueries.detail(alice, issue.id);
    await h.projects.issues.update(alice, issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: coder },
    });
    const payload = await h.claimOne();
    runs.push(payload.run.id);
    await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/w',
      adapter: { kind: 'claude' },
      acceptsInput: false,
    });
    await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
      summary: 'Done.',
      handledInputIds: payload.inputs.map((input: { id: string }) => input.id),
      usage: [
        {
          tool: 'claude',
          model: 'claude-sonnet-4-5',
          inputTokens: 1_000_000,
          outputTokens: 2000,
        },
      ],
    });
    const fresh = await h.projects.issueQueries.detail(alice, issue.id);
    for (const status of end === 'done' ? ['in_progress', 'done'] : [end]) {
      const latest = await h.projects.issueQueries.detail(alice, issue.id);
      if (latest.statusKey === status) continue;
      await h.projects.issues.update(alice, issue.id, {
        revision: latest.revision,
        statusKey: status,
      });
    }
    issues.push(fresh);
  }
  return { alpha, beta, coder, issues, runs };
}

/** Dates every status change of an issue at the times given, oldest first; the rest keep theirs. */
async function backdate(issueId: string, times: readonly Date[]) {
  const rows = await conn()
    .repository<{ id: string }>('pmActivities')
    .findMany({
      filter: { issueId, action: 'status_changed' },
      sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
    });
  for (const [index, row] of rows.entries())
    if (times[index])
      await conn()
        .repository('pmActivities')
        .updateMany({
          filter: { id: row.id },
          values: { createdAt: times[index] },
        });
}

describe('dashboard figures', () => {
  it('measures delivery and the agents over the period, against the one before, by day and by project', async () => {
    const { alpha, beta, coder, issues, runs } = await seed();
    const now = Date.now();
    // Work 1 started three days ago and was completed a day ago; Work 2 was then reopened.
    await backdate(issues[0].id, [
      new Date(now - 3 * DAY),
      new Date(now - DAY),
    ]);
    const second = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issues[1].id,
    );
    await h.projects.issues.update(h.viewer('alice'), issues[1].id, {
      revision: second.revision,
      statusKey: 'todo',
    });
    // Work 3's agent asks its owner while its run works.
    await conn()
      .repository('pmActivities')
      .createOne({
        values: {
          id: 'act-ask',
          issueId: issues[2].id,
          actorType: 'agent',
          actorId: coder,
          action: 'status_changed',
          details: {
            from: 'in_progress',
            to: 'blocked',
            trace: { runId: runs[2] },
          },
          createdAt: new Date(),
        },
      });

    const report = await reports.dashboard(ALL, 7);
    expect(report).toMatchObject({
      days: 7,
      subjects: true,
      currency: 'USD',
      current: {
        completed: 2,
        agentShare: 1,
        costPerIssue: { USD: 4.545 },
        successRate: 1,
        // Work 2 was reopened after done: one of the two agent issues completed.
        reworkRate: 0.5,
        interventionRate: 1 / 3,
      },
      previous: {
        completed: 0,
        cycleTimeP50Ms: null,
        agentShare: null,
        costPerIssue: null,
        runs: 0,
        successRate: null,
        reworkRate: null,
        runsPerIssue: null,
        interventionRate: null,
        queueWaitP50Ms: null,
      },
    });
    // The runs on the two completed issues, per issue.
    const onDone = await h.agents.reporting.runRecords(ALL, {
      subjects: { kind: 'issue', ids: [issues[0].id, issues[1].id] },
      groupId: null,
    });
    expect(onDone.length).toBeGreaterThanOrEqual(2);
    expect(report.current.runsPerIssue).toBe(onDone.length / 2);
    expect(report.current.runs).toBeGreaterThanOrEqual(3);
    expect(report.current.queueWaitP50Ms).toBeGreaterThanOrEqual(0);
    // Work 2 went to done within a moment of being started; Work 1 took two days: the median is the shorter.
    expect(report.current.cycleTimeP50Ms).toBeLessThan(DAY);

    expect(report.daily).toHaveLength(7);
    const yesterday = new Date(now - DAY).toISOString().slice(0, 10);
    expect(report.daily.find((day) => day.day === yesterday)).toMatchObject({
      completed: 1,
      completedByAgents: 1,
      cycleTimeP50Ms: 2 * DAY,
    });
    // Over 7 days each sparkline point is a day.
    expect(report.buckets).toHaveLength(7);
    expect(report.buckets.at(-1)).toMatchObject({
      from: report.to,
      to: report.to,
      completed: 1,
      agentShare: 1,
      costPerIssue: 9.09,
    });
    const month = await reports.dashboard(ALL, 30);
    expect(month.buckets).toHaveLength(10);
    expect(month.buckets[0]).toMatchObject({ from: month.from });
    expect(month.buckets.at(-1)).toMatchObject({ to: month.to, completed: 2 });
    expect(report.daily.at(-1)).toMatchObject({
      day: report.to,
      completed: 1,
      cost: 9.09,
      runsCompleted: 3,
      runsFailed: 0,
    });

    expect(report.projects).toEqual([
      {
        id: alpha.id,
        name: 'Alpha',
        total: 2,
        done: 1,
        completed: 2,
        cycleTimeP50Ms: expect.any(Number),
        blocked: 0,
      },
      {
        id: beta.id,
        name: 'Beta',
        total: 1,
        done: 0,
        completed: 0,
        cycleTimeP50Ms: null,
        blocked: 0,
      },
    ]);

    // Bob may not see Beta nor every run: neither its project nor its run counts.
    const bobs = await reports.dashboard({ userId: 'bob', allRuns: false }, 30);
    expect(bobs.projects.map((project) => project.name)).toEqual(['Alpha']);
    expect(bobs.current).toMatchObject({ runs: 0, costPerIssue: null });
  });

  it('works the figures out of one period as defined', () => {
    const issue = (id: string, byAgent: boolean, cycle: number | null) => ({
      id,
      projectId: 'p',
      byAgent,
      executorId: byAgent ? 'a' : null,
      doneAt: new Date(10 * DAY).toISOString(),
      startedAt:
        cycle === null ? null : new Date(10 * DAY - cycle).toISOString(),
    });
    const run = (id: string, status: string, subjectId = 'i1'): ReportRun => ({
      id,
      agentId: 'a',
      subjectKind: 'issue',
      subjectId,
      status,
      failureReason: status === 'failed' ? 'agent_error' : null,
      retryOfRunId: null,
      createdAt: new Date(DAY).toISOString(),
      dispatchedAt: new Date(DAY + 1000).toISOString(),
      startedAt: new Date(DAY + 2000).toISOString(),
      finishedAt: new Date(DAY + 60_000).toISOString(),
    });
    const figures = periodFigures(
      {
        completed: [
          issue('i1', true, DAY),
          issue('i2', true, 3 * DAY),
          issue('i3', false, null),
          issue('i4', false, 2 * DAY),
        ],
        returned: [
          {
            id: 'i1',
            projectId: 'p',
            byAgent: true,
            at: '',
            from: 'in_review',
            to: 'in_progress',
          },
          {
            id: 'i1',
            projectId: 'p',
            byAgent: true,
            at: '',
            from: 'in_review',
            to: 'in_progress',
          },
          {
            id: 'i4',
            projectId: 'p',
            byAgent: false,
            at: '',
            from: 'done',
            to: 'todo',
          },
        ],
        agentBlocks: [
          {
            issueId: 'i2',
            agentId: 'a',
            runId: null,
            at: new Date(DAY + 30_000).toISOString(),
          },
        ],
      },
      {
        runs: 5,
        completedRuns: 3,
        failedRuns: 1,
        claimLatencyP50Ms: 1000,
        estimatedCost: { USD: 10 },
      },
      [
        run('r1', 'completed'),
        run('r2', 'completed', 'i2'),
        run('r3', 'failed'),
        run('r4', 'completed'),
        run('r5', 'running'),
      ],
      6,
    );
    expect(figures).toEqual({
      completed: 4,
      // Nearest rank over 1, 2 and 3 days.
      cycleTimeP50Ms: 2 * DAY,
      agentShare: 0.5,
      costPerIssue: { USD: 2.5 },
      runs: 5,
      successRate: 0.75,
      // i1 was sent back twice: one issue of the two the agents completed.
      reworkRate: 0.5,
      runsPerIssue: 3,
      // r2 worked when its agent blocked i2; r5 has not ended.
      interventionRate: 0.25,
      queueWaitP50Ms: 1000,
    });
    expect(median([])).toBeNull();
    expect(
      interventions(
        [run('r9', 'completed')],
        [{ issueId: 'i1', agentId: 'a', runId: 'r9', at: '' }],
      ),
    ).toEqual(new Set(['r9']));
  });
});

describe('what needs attention', () => {
  it('lists blocked and overdue issues, pull requests waiting for review and runs that just failed', async () => {
    const { beta, issues, runs } = await seed();
    const alice = h.viewer('alice');
    const now = Date.now();
    // Work 3 (Beta) is blocked; Work 1 was due a week ago, which no longer matters once done; a new issue is overdue.
    const third = await h.projects.issueQueries.detail(alice, issues[2].id);
    await h.projects.issues.update(alice, issues[2].id, {
      revision: third.revision,
      statusKey: 'blocked',
    });
    const late = await h.projects.issues.create(alice, {
      title: 'Late',
      projectId: beta.id,
    });
    for (const id of [issues[0].id, late.id])
      await conn()
        .repository('pmIssues')
        .updateMany({
          filter: { id },
          values: {
            dueDate: new Date(now - 7 * DAY).toISOString().slice(0, 10),
          },
        });
    // Pull requests: one open three days, a draft, one open a day, one merged.
    const repo = await ensureRepo(
      conn(),
      'https://api.github.com',
      'acme/shop',
    );
    const pr = async (
      number: number,
      openedDaysAgo: number,
      extra: Record<string, unknown> = {},
    ) => {
      const id = `pr-${number}`;
      const at = new Date(now - openedDaysAgo * DAY);
      await conn()
        .query.insertInto(PULL_REQUESTS)
        .values({
          id,
          repoId: repo.id,
          number,
          url: `https://github.com/acme/shop/pull/${number}`,
          title: `Change ${number}`,
          state: 'open',
          draft: false,
          headRef: `agent/${number}`,
          baseRef: 'main',
          headSha: 'abc',
          authorLogin: 'coder',
          mergedManually: false,
          mergeCheckAttempts: 0,
          createdAt: at,
          updatedAt: at,
          ...extra,
        })
        .execute();
      await insertLink(conn(), {
        issueId: issues[2].id,
        pullRequestId: id,
        linkedByType: 'system',
        linkedById: null,
      });
    };
    await pr(1, 3);
    await pr(2, 3, { draft: true });
    await pr(3, 1);
    await pr(4, 5, { state: 'merged' });
    // Runs: Work 3's failed an hour ago, Work 1's two days ago, Work 2's an hour ago but was retried.
    const fail = (runId: string, ago: number) =>
      conn()
        .repository('agRuns')
        .updateMany({
          filter: { id: runId },
          values: {
            status: 'failed',
            failureReason: 'agent_error',
            finishedAt: new Date(now - ago),
          },
        });
    await fail(runs[2], 3600_000);
    await fail(runs[0], 2 * DAY);
    await fail(runs[1], 3600_000);
    await conn()
      .repository('agRuns')
      .updateMany({
        filter: { id: runs[0] },
        values: { createdAt: new Date(now - 2 * DAY - 1000) },
      });
    // Work 1's run stands in for the retry of Work 2's.
    await conn()
      .repository('agRuns')
      .updateMany({
        filter: { id: runs[0] },
        values: { retryOfRunId: runs[1] },
      });

    const attention = await reports.attention(ALL);
    expect(attention).toMatchObject({
      subjects: true,
      blocked: {
        total: 1,
        items: [{ id: issues[2].id, identifier: issues[2].identifier }],
      },
      overdue: { total: 1, items: [{ id: late.id, title: 'Late' }] },
      reviewWaits: {
        total: 1,
        items: [
          {
            id: 'pr-1',
            repo: 'acme/shop',
            number: 1,
            issue: { id: issues[2].id, identifier: issues[2].identifier },
          },
        ],
      },
      failedRuns: {
        total: 1,
        items: [
          {
            id: runs[2],
            agentName: 'Coder',
            failureReason: 'agent_error',
            issue: { id: issues[2].id, title: 'Work 3' },
          },
        ],
      },
    });

    // Bob does not see Beta: nothing of it reaches him.
    expect(
      await reports.attention({ userId: 'bob', allRuns: true }),
    ).toMatchObject({
      blocked: { total: 0 },
      overdue: { total: 0 },
      reviewWaits: { total: 0 },
      failedRuns: { total: 0 },
    });
  });

  it('keeps only failures of the last 24 hours that were not retried', () => {
    const now = new Date(10 * DAY);
    const run = (
      id: string,
      finishedAgo: number,
      extra: Partial<ReportRun> = {},
    ): ReportRun => ({
      id,
      agentId: 'a',
      subjectKind: 'issue',
      subjectId: 'i',
      status: 'failed',
      failureReason: null,
      retryOfRunId: null,
      createdAt: new Date(0).toISOString(),
      dispatchedAt: null,
      startedAt: null,
      finishedAt: new Date(now.getTime() - finishedAgo).toISOString(),
      ...extra,
    });
    expect(
      failedRecently(
        [
          run('old', 2 * DAY),
          run('recent', 3600_000),
          run('newer', 60_000),
          run('retried', 60_000),
          run('retry', 1000, { status: 'queued', retryOfRunId: 'retried' }),
          run('chat', 60_000, { subjectKind: 'conversation' }),
        ],
        now,
      ).map((item) => item.id),
    ).toEqual(['newer', 'recent']);
  });
});
