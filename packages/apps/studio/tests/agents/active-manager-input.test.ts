// @vitest-environment node
import { appendFile } from 'node:fs/promises';
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
  await h.close();
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

describe('manager active dispatch', () => {
  it.each(['claude', 'codex'] as const)(
    'appends a new %s dispatch root and records one system reply without waking agents',
    async (tool) => {
      const { issue, dispatch, original, payload, worker } = await setup(tool);
      const client = await h.database.connection().client<Knex>();
      const queries: string[] = [];
      const listener = (q: { sql: string }) => queries.push(q.sql);
      client.on('query', listener);
      const followup = await dispatch();
      client.off('query', listener);
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
      const response = await h.runner(RUNNER_ROUTES.lease, payload.run.id, {});
      expect(response.status).toBe(200);
      expect(response.body.inputs.map((i: { id: string }) => i.id)).toContain(
        added.id,
      );
      if (process.env.PM385_SQL_REPORT)
        await appendFile(
          process.env.PM385_SQL_REPORT,
          JSON.stringify({
            dialect: h.database.connection().dialect,
            name: 'studio-' + tool,
            statements: queries.length,
            reads: queries.filter((q) => /^\s*select/i.test(q)).length,
            writes: queries.filter((q) => /^\s*(insert|update|delete)/i.test(q))
              .length,
            sql: queries,
          }) + '\n',
        );
    },
  );
});
