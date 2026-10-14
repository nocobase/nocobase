// @vitest-environment node
import { appendFile } from 'node:fs/promises';
import { AsyncLocalStorage } from 'node:async_hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type { Knex } from 'knex';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { managerDelegation } from '../../server/agents/delegated-queue.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  h.roles.set('alice', 'admin');
});
afterEach(async () => {
  vi.restoreAllMocks();
  await h?.close();
});
const features = [
  'workspaceKey',
  'input',
  'steer',
  'checkout',
  'directories',
  'skills',
  'secrets',
];

async function setup(tool: 'claude' | 'codex') {
  await h.createAgent();
  const worker = await h.createAgent({ name: 'Worker', tool });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Follow up',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: PROJECT_MANAGER_ID },
  });
  const pm = await h.claimOne(features);
  await h.runner(RUNNER_ROUTES.start, pm.run.id, {
    workDir: '/work/pm',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  const manager = {
    ...h.viewer('alice'),
    actor: {
      type: 'agent',
      id: PROJECT_MANAGER_ID,
      trace: { runId: pm.run.id },
    },
  };
  const dispatch = () =>
    h.projects.comments.create(manager, issue.id, {
      content: `[@Worker](mention://agent/${worker}) continue the step`,
    });
  const original = await dispatch();
  const payload = await h.claimOne();
  expect(payload.run.id).not.toBe(pm.run.id);
  await h.runner(RUNNER_ROUTES.start, payload.run.id, {
    workDir: '/work/worker',
    adapter: { kind: tool },
    acceptsInput: true,
  });
  return { issue, worker, manager, dispatch, original, payload };
}

const measurementScope = new AsyncLocalStorage<symbol>();

async function measured<T>(name: string, action: () => Promise<T>): Promise<T> {
  const client = await h.database.connection().client<Knex>();
  const queries: string[] = [];
  const scope = Symbol(name);
  const listener = (q: { sql: string }) => {
    if (measurementScope.getStore() === scope) queries.push(q.sql);
  };
  client.on('query', listener);
  const waits: string[] = [];
  let sampling = h.database.connection().dialect === 'postgres';
  const schema = sampling
    ? String((await client.raw('select current_schema() as name')).rows[0].name)
    : null;
  // Diagnostics stay outside the request context and do not count as product SQL.
  const sampler = (async () => {
    while (sampling) {
      const result = await client.raw(
        "select query from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'",
      );
      for (const row of result.rows)
        if (String(row.query).includes(`"${schema}".`))
          waits.push(String(row.query));
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
  })();
  try {
    return await measurementScope.run(scope, action);
  } finally {
    sampling = false;
    await sampler;
    client.off('query', listener);
    if (process.env.PM385_SQL_REPORT)
      await appendFile(
        process.env.PM385_SQL_REPORT,
        JSON.stringify({
          dialect: h.database.connection().dialect,
          name,
          statements: queries.length,
          reads: queries.filter((q) => /^\s*select/i.test(q)).length,
          writes: queries.filter((q) => /^\s*(insert|update|delete)/i.test(q))
            .length,
          transactions: queries.filter((q) => /^begin/i.test(q)).length,
          lockWaitSamples: schema ? waits.length : null,
          agentLockWaitSamples: schema
            ? waits.filter((sql) => /ag_agents/.test(sql)).length
            : null,
          sql: queries,
        }) + '\n',
      );
  }
}

describe('manager active dispatch', () => {
  it.each(['claude', 'codex'] as const)(
    'appends a new %s dispatch root and records one system reply without waking agents',
    async (tool) => {
      const { issue, dispatch, original, payload, worker, manager } =
        await setup(tool);
      const followup = await measured('studio-' + tool, dispatch);
      const open = await h.agents.runs.openOn(
        h.database.connection(),
        { kind: 'issue', id: issue.id },
        worker,
      );
      expect(open.map((run) => run.id)).toEqual([payload.run.id]);
      const detail = await h.agents.runs.detail(payload.run.id);
      expect(detail.inputs).toHaveLength(2);
      const added = detail.inputs.find(
        (input) =>
          (input.payload as { commentId?: string }).commentId ===
          followup.comment.id,
      )!;
      expect(added).toBeDefined();
      expect(
        (added.payload as { managerDelegation?: unknown }).managerDelegation,
      ).toBeUndefined();
      expect(
        await managerDelegation(h.database.connection(), open[0]!),
      ).toEqual({ commentId: original.comment.id });
      const comments = await h.projects.commentQueries.list(
        h.database.connection(),
        issue.id,
      );
      const reply = comments.find(
        (comment) =>
          comment.parentId === followup.comment.id &&
          comment.authorType === 'system',
      );
      expect(reply?.content).toContain(
        `Appended to run ${payload.run.id} (input ${added.id})`,
      );
      // Replaying the same trusted source is idempotent, including its system announcement.
      const replay = () =>
        h.projects.tx.run((tx) =>
          h.projects.kinds.get('agent')!.work!.onCommentCreated!(tx, {
            issue,
            comment: followup.comment,
            parent: null,
            actor: manager.actor,
            userId: 'alice',
            mentions: [{ kind: 'agent', id: worker }],
          }),
        );
      await measured('studio-duplicate-' + tool, replay);
      const afterReplay = await h.projects.commentQueries.list(
        h.database.connection(),
        issue.id,
      );
      expect(
        afterReplay.filter(
          (comment) =>
            comment.parentId === followup.comment.id &&
            comment.authorType === 'system',
        ),
      ).toHaveLength(1);
      expect((await h.agents.runs.detail(payload.run.id)).inputs).toHaveLength(
        2,
      );
      const response = await h.runner(RUNNER_ROUTES.lease, payload.run.id, {});
      expect(response.status).toBe(200);
      expect(response.body.inputs.map((i: { id: string }) => i.id)).toContain(
        added.id,
      );
    },
  );
  it.each(['unsupported', 'ended'] as const)(
    'preserves %s fallback for a complete manager comment dispatch',
    async (reason) => {
      const { issue, dispatch, payload, worker, manager } =
        await setup('claude');
      if (reason === 'unsupported') {
        const conn = h.database.connection();
        const run = (await conn
          .repository('agRuns')
          .findOne({ filter: { id: payload.run.id } }))!;
        await conn.repository('agRunners').updateMany({
          filter: { id: run.runnerId },
          values: {
            features: features.filter((feature) => feature !== 'steer'),
          },
        });
      } else {
        expect(
          (
            await measured('studio-complete', () =>
              h.runner(RUNNER_ROUTES.complete, payload.run.id, {
                summary: 'done',
                handledInputIds: payload.inputs.map(
                  (input: { id: string }) => input.id,
                ),
              }),
            )
          ).status,
        ).toBe(200);
      }
      const added = await measured('studio-' + reason, dispatch);
      const open = await h.agents.runs.openOn(
        h.database.connection(),
        { kind: 'issue', id: issue.id },
        worker,
      );
      const next = open.find((run) => run.id !== payload.run.id)!;
      expect(next.status).toBe('queued');
      const detail = await h.agents.runs.detail(next.id);
      expect(detail.inputs).toHaveLength(1);
      expect(detail.inputs[0].payload).toMatchObject({
        commentId: added.comment.id,
      });
      const comments = await h.projects.commentQueries.list(
        h.database.connection(),
        issue.id,
      );
      expect(
        comments.filter(
          (comment) =>
            comment.parentId === added.comment.id &&
            comment.authorType === 'system',
        ),
      ).toHaveLength(0);
      if (reason === 'ended') {
        const resumed = await h.claimOne();
        expect(resumed.run.id).toBe(next.id);
        expect(
          (
            await h.runner(RUNNER_ROUTES.start, resumed.run.id, {
              workDir: '/work/next',
              acceptsInput: true,
            })
          ).status,
        ).toBe(200);
        const followup = await measured('studio-append-warm', dispatch);
        const replay = () =>
          h.projects.tx.run((tx) =>
            h.projects.kinds.get('agent')!.work!.onCommentCreated!(tx, {
              issue,
              comment: followup.comment,
              parent: null,
              actor: manager.actor,
              userId: 'alice',
              mentions: [{ kind: 'agent', id: worker }],
            }),
          );
        await measured('studio-duplicate-warm', replay);
        const active = await h.agents.runs.openOn(
          h.database.connection(),
          { kind: 'issue', id: issue.id },
          worker,
        );
        expect(active.map((run) => run.id)).toEqual([next.id]);
        const detail = await h.agents.runs.detail(next.id);
        expect(detail.inputs).toHaveLength(2);
        const records = await h.projects.commentQueries.list(
          h.database.connection(),
          issue.id,
        );
        expect(
          records.filter(
            (comment) =>
              comment.parentId === followup.comment.id &&
              comment.authorType === 'system',
          ),
        ).toHaveLength(1);
      }
    },
  );
});
