// @vitest-environment node
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { lastSummary } from '../../../../plugins/app-plugin-agents/server/core/runs/run.store.js';
import { commentDelta } from '../../server/agents/comment-delta.js';
import { initialDirOf } from '../../server/projects-init/store.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { transactionRead as studioRead } from '../../server/transaction-read.js';
import { transactionRead as projectsRead } from '../../../../plugins/app-plugin-projects/server/kernel/transaction-read.js';
import { transactionRead as agentsRead } from '../../../../plugins/app-plugin-agents/server/core/transaction-read.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  h.roles.set('alice', 'admin');
});
afterEach(() => h.close());

it.each([studioRead, projectsRead, agentsRead])(
  'isolates parameters and transactions, including rollback retries',
  async (memoize) => {
    const read = memoize<number>();
    const loader = vi.fn(async () => loader.mock.calls.length);
    const root = h.database.connection();
    expect(await read(root, 'a', loader)).toBe(1);
    expect(await read(root, 'a', loader)).toBe(2);
    await root.transaction(async (conn) => {
      const [first, duplicate] = await Promise.all([
        read(conn, 'a', loader),
        read(conn, 'a', loader),
      ]);
      expect(first).toBe(duplicate);
      expect(await read(conn, 'b', loader)).not.toBe(first);
    });
    await expect(
      root.transaction(async (conn) => {
        expect(await read(conn, 'a', loader)).toBe(5);
        throw new Error('retry');
      }),
    ).rejects.toThrow('retry');
    await root.transaction(async (conn) => {
      expect(await read(conn, 'a', loader)).toBe(6);
    });
  },
);

it.each([
  [false, false],
  [true, false],
  [true, true],
])(
  'builds claim materials once inside the transaction (manager=%s, multiple models=%s)',
  async (manager, multipleModels) => {
    const agentId = await h.createAgent({
      name: 'Coder',
      ...(multipleModels
        ? {
            modelEntries: [
              { tool: 'claude', model: 'first' },
              { tool: 'claude', model: 'second' },
            ],
          }
        : {}),
    });
    // Register the runner before measuring the claim.
    await h.claimOne();
    const project = await h.projects.projects.create(h.viewer('alice'), {
      name: 'Web',
    });
    await h.projects.projects.addResource(h.viewer('alice'), project.id, {
      type: 'gitRepo',
      url: 'https://example.com/acme/web.git',
      defaultRef: 'main',
    });
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Claim materials',
      projectId: project.id,
      statusKey: 'in_progress',
      executor: manager ? { type: 'agent', id: PROJECT_MANAGER_ID } : null,
    });
    if (!manager)
      await h.projects.comments.create(h.viewer('alice'), issue.id, {
        content: `[@Coder](mention://agent/${agentId}) implement it`,
      });
    const client = await h.database.connection().client<any>();
    const queries: { sql: string; __knexTxId?: string }[] = [];
    const record = (query: { sql: string; __knexTxId?: string }) =>
      queries.push(query);
    client.on('query', record);
    let payload;
    try {
      payload = await h.claimOne();
    } finally {
      client.off('query', record);
    }
    expect(payload.run).toBeDefined();
    const builds = queries.filter((q) =>
      q.sql.includes('__repository_parent_labels'),
    );
    const claimTransaction = queries.find((q) =>
      /^update .*\bag_runs\b.*\bstatus\b/u.test(q.sql.replace(/["`[\]]/gu, '')),
    )?.__knexTxId;
    expect(claimTransaction).toBeDefined();
    expect(
      builds.filter((q) => q.__knexTxId === claimTransaction),
    ).toHaveLength(1);
    expect(
      builds.filter((q) => q.__knexTxId !== claimTransaction).length,
    ).toBeGreaterThanOrEqual(1);
    // Cost classification excludes PostgreSQL catalogs; the assertions above run on every dialect.
    if (h.database.connection().dialect === 'postgres') {
      console.log(
        JSON.stringify({
          manager,
          multipleModels,
          total: queries.length,
          business: queries.filter(
            (q) =>
              /^(select|insert|update|delete)/iu.test(q.sql) &&
              !/pg_catalog|information_schema|__nocobase/u.test(q.sql),
          ).length,
          writes: queries.filter((q) => /^(insert|update|delete)/iu.test(q.sql))
            .length,
          transactions: queries.filter((q) => q.sql === 'BEGIN;').length,
          explicitLocks: queries.filter((q) => /for update/iu.test(q.sql))
            .length,
          claimBusiness: queries.filter(
            (q) =>
              q.__knexTxId === claimTransaction &&
              /^(select|insert|update|delete)/iu.test(q.sql) &&
              !/pg_catalog|information_schema|__nocobase/u.test(q.sql),
          ).length,
          contextBuilds: builds.length,
          claimContextBuilds: builds.filter(
            (q) => q.__knexTxId === claimTransaction,
          ).length,
        }),
      );
    }
    expect(
      (
        await h.runner(RUNNER_ROUTES.start, payload.run.id, {
          workDir: '/tmp/w',
          adapter: { kind: 'claude' },
          acceptsInput: true,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
          summary: 'First claim done.',
          sessionId: 'materials-session',
          handledInputIds: payload.inputs.map(
            (input: { id: string }) => input.id,
          ),
        })
      ).status,
    ).toBe(200);
    await h.database
      .connection()
      .query.updateTable('pmIssues')
      .set({ title: 'Fresh claim materials' })
      .where('id', '=', issue.id)
      .execute();
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: manager
        ? 'Please continue.'
        : `[@Next](mention://agent/${agentId}) continue`,
    });
    const next = await h.claimOne();
    expect(next.run.id).not.toBe(payload.run.id);
    expect(JSON.stringify(next.prompt)).toContain('Fresh claim materials');
  },
);

it('memoizes empty auxiliary reads and isolates agents, runs, chains, delivered comments and projects', async () => {
  const root = h.database.connection();
  const client = await root.client<any>();
  let queries = 0;
  const record = () => {
    queries += 1;
  };
  client.on('query', record);
  const summary = {
    agentId: 'coder',
    subjectKind: 'issue',
    subjectId: 'missing',
  };
  const delta = {
    agentId: 'coder',
    issueId: 'missing',
    runId: 'current',
    inputs: [],
  };
  try {
    await root.transaction(async (conn) => {
      await lastSummary(conn, summary, 'current');
      let before = queries;
      await lastSummary(conn, { ...summary }, 'current');
      expect(queries).toBe(before);
      await lastSummary(conn, { ...summary, agentId: 'reviewer' }, 'current');
      expect(queries).toBeGreaterThan(before);
      before = queries;
      await lastSummary(conn, summary, 'another');
      expect(queries).toBeGreaterThan(before);
      const first = await commentDelta(conn, h.projects, delta);
      before = queries;
      expect(await commentDelta(conn, h.projects, { ...delta })).toBe(first);
      expect(queries).toBe(before);
      for (const change of [
        { agentId: 'reviewer' },
        { runId: 'another' },
        { commentRootRunId: 'chain' },
        { inputs: [{ payload: { commentId: 'delivered' } } as never] },
      ]) {
        expect(
          await commentDelta(conn, h.projects, { ...delta, ...change }),
        ).not.toBe(first);
      }
      await initialDirOf(conn, 'missing', null);
      before = queries;
      await initialDirOf(conn, 'missing', null);
      expect(queries).toBe(before);
      await initialDirOf(conn, 'missing', 'another-project');
      expect(queries).toBeGreaterThan(before);
    });
    await root.transaction(async (conn) => {
      const before = queries;
      await lastSummary(conn, summary, 'current');
      await commentDelta(conn, h.projects, delta);
      await initialDirOf(conn, 'missing', null);
      expect(queries - before).toBeGreaterThanOrEqual(3);
    });
  } finally {
    client.off('query', record);
  }
});
