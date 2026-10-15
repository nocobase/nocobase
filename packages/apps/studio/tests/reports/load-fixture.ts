/**
 * A deterministic workload for the report routes: projects, issues with their status history and comments, agents'
 * runs with usage, model calls outside runs and open pull requests, written straight into the tables. `scale` sets the
 * issue count; runs, usage and the rest grow with it, so a test can compare a small workload with a larger one.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  ensureRepo,
  insertLink,
  PULL_REQUESTS,
} from '../../server/git/store.js';
import type { BridgeHarness } from '../agents/bridge-harness.js';

const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;

/** A small linear congruential generator, so every run of a test seeds the same rows. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

async function insert(
  conn: DatabaseConnection,
  table: string,
  rows: readonly Record<string, unknown>[],
): Promise<void> {
  for (let at = 0; at < rows.length; at += 500)
    await conn.query
      .insertInto(table)
      .values(rows.slice(at, at + 500) as never)
      .execute();
}

export interface LoadFixture {
  readonly projectIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly userIds: readonly string[];
}

export async function seedLoad(
  h: BridgeHarness,
  options: {
    readonly issues: number;
    /** Runs per issue. */
    readonly runsPerIssue?: number;
    /** Days back the work spreads over. */
    readonly days?: number;
    readonly now?: number;
  },
): Promise<LoadFixture> {
  const conn = h.database.connection();
  const rand = random(42);
  const pick = <T>(values: readonly T[]): T =>
    values[Math.floor(rand() * values.length)] as T;
  const now = options.now ?? Date.now();
  const days = options.days ?? 120;
  const runsPerIssue = options.runsPerIssue ?? 10;
  const ago = (ms: number) => new Date(now - ms);

  const userIds = ['alice'];
  for (let index = 1; index < 10; index += 1) {
    const id = `user${index}`;
    await h.addUser(id);
    userIds.push(id);
  }
  const alice = h.viewer('alice');
  const projectIds: string[] = [];
  for (let index = 0; index < 6; index += 1)
    projectIds.push(
      (
        await h.projects.projects.create(alice, {
          name: `Project ${index}`,
          ...(index % 3 === 2 ? { visibility: 'members' as const } : {}),
        })
      ).id,
    );
  const agentIds: string[] = [];
  for (let index = 0; index < 8; index += 1)
    agentIds.push(await h.createAgent({ name: `Agent ${index}` }));
  await h.agents.prices.replace({
    subscriptions: [],
    prices: [
      {
        tool: 'claude',
        model: 'claude-sonnet-4*',
        inputPerM: 3,
        outputPerM: 15,
      },
      { tool: 'codex', model: 'gpt-5*', inputPerM: 1.25, outputPerM: 10 },
    ],
  });

  const issues: Record<string, unknown>[] = [];
  const activities: Record<string, unknown>[] = [];
  const comments: Record<string, unknown>[] = [];
  const runs: Record<string, unknown>[] = [];
  const usage: Record<string, unknown>[] = [];
  const text = (length: number) => 'x'.repeat(length);
  const history = JSON.stringify(
    Array.from({ length: 20 }, (_, index) => ({
      at: new Date(now).toISOString(),
      event: `step-${index}`,
      detail: text(80),
    })),
  );
  let activity = 0;
  for (let index = 0; index < options.issues; index += 1) {
    const id = `ld-issue-${index}`;
    const createdAt = ago(rand() * days * DAY);
    const age = now - createdAt.getTime();
    const projectId = index % 10 === 9 ? null : pick(projectIds);
    const byAgent = rand() < 0.6;
    const agentId = pick(agentIds);
    const end = pick([
      'done',
      'done',
      'done',
      'in_progress',
      'in_review',
      'blocked',
      'backlog',
      'cancelled',
    ]);
    const path =
      end === 'backlog'
        ? []
        : end === 'in_progress'
          ? ['in_progress']
          : end === 'in_review'
            ? ['in_progress', 'in_review']
            : end === 'blocked'
              ? ['in_progress', 'blocked']
              : end === 'cancelled'
                ? ['cancelled']
                : rand() < 0.3
                  ? [
                      'in_progress',
                      'in_review',
                      'in_progress',
                      'in_review',
                      'done',
                    ]
                  : ['in_progress', 'in_review', 'done'];
    let from = 'backlog';
    path.forEach((to, step) => {
      const at = new Date(
        createdAt.getTime() + ((step + 1) * age) / (path.length + 2),
      );
      const agent = byAgent && rand() < 0.5;
      activities.push({
        id: `ld-act-${(activity += 1)}`,
        issueId: id,
        actorType: agent ? 'agent' : 'user',
        actorId: agent ? agentId : pick(userIds),
        action: 'status_changed',
        details: JSON.stringify({
          from,
          to,
          ...(agent ? { trace: { runId: `ld-run-${index}-0` } } : {}),
        }),
        createdAt: at,
      });
      from = to;
    });
    for (let other = 0; other < 6; other += 1)
      activities.push({
        id: `ld-act-${(activity += 1)}`,
        issueId: id,
        actorType: 'user',
        actorId: pick(userIds),
        action: pick(['commented', 'updated', 'assigned']),
        details: JSON.stringify({ note: text(40) }),
        createdAt: new Date(createdAt.getTime() + rand() * age),
      });
    for (let comment = 0; comment < 8; comment += 1) {
      const commentId = `ld-comment-${index}-${comment}`;
      const at = new Date(createdAt.getTime() + rand() * age);
      comments.push({
        id: commentId,
        issueId: id,
        authorType: rand() < 0.5 ? 'user' : 'agent',
        authorId: pick(userIds),
        content: text(300),
        rootId: commentId,
        createdAt: at,
        updatedAt: at,
      });
    }
    issues.push({
      id,
      number: index + 1,
      identifier: `LD-${index + 1}`,
      title: `Load issue ${index + 1}`,
      description: text(2000),
      statusKey: end,
      ownerUserId: pick(userIds),
      executorType: byAgent ? 'agent' : 'user',
      executorId: byAgent ? agentId : pick(userIds),
      projectId,
      dueDate:
        rand() < 0.2
          ? ago((rand() - 0.5) * 20 * DAY)
              .toISOString()
              .slice(0, 10)
          : null,
      lastActivityAt: ago(rand() * Math.min(age, 10 * DAY)),
      createdAt,
      updatedAt: createdAt,
    });
    for (let run = 0; run < runsPerIssue; run += 1) {
      const runId = `ld-run-${index}-${run}`;
      const queued = new Date(createdAt.getTime() + rand() * age);
      const status = pick([
        'completed',
        'completed',
        'completed',
        'completed',
        'failed',
        'cancelled',
        'running',
      ]);
      const online = rand() < 0.3;
      const dispatched = new Date(queued.getTime() + rand() * HOUR);
      const started = new Date(dispatched.getTime() + rand() * 60_000);
      const finished =
        status === 'running'
          ? null
          : new Date(started.getTime() + rand() * 3 * HOUR);
      runs.push({
        id: runId,
        agentId: pick(agentIds),
        agentType: online ? 'online' : 'runner',
        status,
        subjectKind: 'issue',
        subjectId: id,
        threadScope: '',
        actorUserId: pick(userIds),
        ownerUserId: pick(userIds),
        retryOfRunId:
          status !== 'failed' && run > 0 && rand() < 0.1
            ? `ld-run-${index}-${run - 1}`
            : null,
        createdAt: queued,
        updatedAt: finished ?? started,
        dispatchedAt: dispatched,
        startedAt: started,
        finishedAt: finished,
        lastActivityAt: finished ?? started,
        failureReason:
          status === 'failed'
            ? pick(['agent_error', 'timeout', 'runner_lost'])
            : null,
        failureDetail: status === 'failed' ? text(1000) : null,
        summary: text(800),
        executionHistory: history,
      });
      const calls = online ? 6 : 2;
      for (let call = 0; call < calls; call += 1)
        usage.push({
          id: `ld-usage-${index}-${run}-${call}`,
          runId,
          tool: online ? 'online' : pick(['claude', 'codex']),
          modelService: online ? 'main' : null,
          model: online
            ? 'gpt-5-mini'
            : pick(['claude-sonnet-4-5', 'gpt-5-codex', null]),
          inputTokens: Math.floor(rand() * 200_000),
          outputTokens: Math.floor(rand() * 20_000),
          cacheReadTokens: Math.floor(rand() * 100_000),
          cacheWriteTokens: Math.floor(rand() * 10_000),
          reasoningTokens: Math.floor(rand() * 5000),
          createdAt: finished ?? started,
        });
    }
  }
  await insert(conn, 'pmIssues', issues);
  await insert(conn, 'pmActivities', activities);
  await insert(conn, 'pmComments', comments);
  await insert(conn, 'agRuns', runs);
  await insert(conn, 'agRunUsage', usage);
  await insert(
    conn,
    'agModelUsage',
    Array.from({ length: options.issues * 20 }, (_, index) => ({
      id: `ld-model-${index}`,
      purpose: pick(['embedding', 'rerank', 'text']),
      source: pick(['knowledge', 'search', 'titles']),
      modelService: 'main',
      model: pick(['text-embedding-3-small', 'rerank-v3', 'gpt-5-mini']),
      inputTokens: Math.floor(rand() * 5000),
      outputTokens: Math.floor(rand() * 500),
      units: 1,
      createdAt: ago(rand() * days * DAY),
    })),
  );

  const repo = await ensureRepo(conn, 'https://api.github.com', 'acme/load');
  for (
    let index = 0;
    index < Math.max(4, Math.floor(options.issues / 10));
    index += 1
  ) {
    const id = `ld-pr-${index}`;
    const at = ago(rand() * 10 * DAY);
    await conn.query
      .insertInto(PULL_REQUESTS)
      .values({
        id,
        repoId: repo.id,
        number: index + 1,
        url: `https://github.com/acme/load/pull/${index + 1}`,
        title: `Change ${index + 1}`,
        state: index % 4 === 0 ? 'merged' : 'open',
        draft: index % 7 === 0,
        headRef: `agent/${index}`,
        baseRef: 'main',
        headSha: 'abc',
        authorLogin: 'coder',
        mergedManually: false,
        mergeCheckAttempts: 0,
        createdAt: at,
        updatedAt: at,
      })
      .execute();
    await insertLink(conn, {
      issueId: `ld-issue-${index % options.issues}`,
      pullRequestId: id,
      linkedByType: 'system',
      linkedById: null,
    });
  }
  return { projectIds, agentIds, userIds };
}
