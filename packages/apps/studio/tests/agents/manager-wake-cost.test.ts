// @vitest-environment node
// db-test-portability: dialect-specific — SQL cost instrumentation classifies dialect metadata statements without issuing catalog queries.
import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseConnection } from '@nocobase/db';
import type { Knex } from 'knex';
import { expect, it, vi } from 'vitest';
import { createBridgeHarness } from './bridge-harness.js';
import { connectedRepo } from '../git/helpers.js';
import { sweepManagerIdle } from '../../server/agents/manager/idle.js';
import { createAgentWork } from '../../server/agents/work.js';
import { createGitFlow } from '../../server/git/flow.js';
import { findPullRequest } from '../../server/git/store.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';

const measurement = new AsyncLocalStorage<symbol>();

/** Count this action's async query chain, never bindings or preceding post-commit callbacks. Exclude schema introspection from business reads. */
async function measure(
  conn: DatabaseConnection,
  action: () => Promise<unknown>,
) {
  const client = await conn.client<Knex>();
  const statements: string[] = [];
  const scope = Symbol('SQL measurement');
  const listener = ({ sql }: { sql: string }) => {
    if (measurement.getStore() === scope) statements.push(sql);
  };
  client.on('query', listener);
  try {
    await measurement.run(scope, action);
  } finally {
    client.removeListener('query', listener);
  }
  const updates = statements.filter((s) => /^update\b/iu.test(s));
  return {
    selects: statements.filter((s) => /^select\b/iu.test(s)).length,
    businessSelects: statements.filter(
      (s) =>
        /^select\b/iu.test(s) &&
        !/sqlite_master|sqlite_schema|pragma_|information_schema|__nocobase_collection_metadata/iu.test(
          s,
        ),
    ).length,
    updates: updates.length,
    writes: statements.filter((s) =>
      /^(?:update|insert|delete|replace)\b/iu.test(s),
    ).length,
    signalWrites: updates.filter((s) => /["`]?signals["`]?\s*=/iu.test(s))
      .length,
    locks: statements.filter(
      (s) =>
        /for update/iu.test(s) ||
        /^update\b.*\bset\s+["`]?id["`]?\s*=/iu.test(s),
    ).length,
    begins: statements.filter((s) => /^begin\b/iu.test(s)).length,
    commits: statements.filter((s) => /^commit\b/iu.test(s)).length,
  };
}
const readOnly = { updates: 0, writes: 0, locks: 0, begins: 0, commits: 0 };

it('keeps idle noncandidates read-only while updating epochs and delivering real candidates', async () => {
  const h = await createBridgeHarness();
  try {
    await h.addUser('alice');
    await h.createAgent();
    const viewer = h.viewer('alice');
    const issue = await h.projects.issues.create(viewer, {
      title: 'Idle cost',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      start: false,
    });
    const conn = h.database.connection();
    const work = createAgentWork({
      agents: h.agents,
      projects: () => h.projects,
    });
    const sweep = (now = new Date()) =>
      sweepManagerIdle(h.agents, h.projects, work, 15, now);
    const noWait = await measure(conn, () => sweep());
    await h.projects.comments.create(
      { ...viewer, actor: { type: 'agent', id: PROJECT_MANAGER_ID } },
      issue.id,
      { content: 'Next: Waiting for worker run to end' },
    );
    const noEvidence = await measure(conn, () => sweep());
    const repo = await connectedRepo(h, 'acme/cost');
    h.github.addPull('acme/cost', {
      number: 77,
      head: { ref: 'feature', sha: 'head' },
    });
    h.github.setCheck('acme/cost', 'head', {
      name: 'test',
      status: 'completed',
      conclusion: 'success',
    });
    await h.git.link(viewer, issue.id, 'https://github.com/acme/cost/pull/77', {
      type: 'user',
      id: 'alice',
    });
    await h.git.pollRepo(repo);
    const active = await measure(conn, () => sweep());
    await conn.repository('agRuns').updateMany({
      filter: { subjectId: issue.id },
      values: { status: 'completed' },
    });
    await h.projects.comments.create(
      { ...viewer, actor: { type: 'agent', id: PROJECT_MANAGER_ID } },
      issue.id,
      { content: 'Next: Waiting for CI checks' },
    );
    const now = new Date();
    const initialize = await measure(conn, () => sweep(now));
    const notDue = await measure(conn, () => sweep(now));
    const deliver = await measure(conn, () =>
      sweep(new Date(now.getTime() + 16 * 60_000)),
    );
    await conn.repository('agRuns').updateMany({
      filter: { subjectId: issue.id },
      values: { status: 'completed' },
    });
    const woken = await measure(conn, () =>
      sweep(new Date(now.getTime() + 60 * 60_000)),
    );
    process.stdout.write(
      `PM313 idle costs: ${JSON.stringify({ noWait, noEvidence, active, initialize, notDue, deliver, woken })}\n`,
    );
    expect(noWait).toMatchObject(readOnly);
    expect(noEvidence).toMatchObject(readOnly);
    expect(active).toMatchObject(readOnly);
    expect(notDue).toMatchObject(readOnly);
    expect(woken).toMatchObject(readOnly);
    expect(initialize.begins).toBeGreaterThan(0);
    expect(deliver.locks).toBeGreaterThan(0);
    const inputs = await conn
      .repository<{ payload: { trigger?: string } }>('agRunInputs')
      .findMany({});
    expect(
      inputs.filter((i) => i.payload.trigger === 'managerIdle'),
    ).toHaveLength(1);
  } finally {
    await h.close();
  }
}, 120_000);

it('keeps settled retries read-only and retries an unavailable manager exactly once after recovery', async () => {
  const h = await createBridgeHarness();
  try {
    await h.addUser('alice');
    await h.createAgent();
    const viewer = h.viewer('alice');
    const issue = await h.projects.issues.create(viewer, {
      title: 'CI cost',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      start: false,
    });
    const conn = h.database.connection();
    const repo = await connectedRepo(h, 'acme/cost');
    h.github.addPull('acme/cost', {
      number: 77,
      head: { ref: 'feature', sha: 'head' },
    });
    h.github.setCheck('acme/cost', 'head', {
      name: 'test',
      status: 'completed',
      conclusion: 'success',
    });
    await conn.repository('agAgents').updateMany({
      filter: { id: PROJECT_MANAGER_ID },
      values: { status: 'disabled' },
    });
    await h.git.link(viewer, issue.id, 'https://github.com/acme/cost/pull/77', {
      type: 'user',
      id: 'alice',
    });
    await h.git.pollRepo(repo);
    const flow = createGitFlow({
      projects: () => h.projects,
      agents: () => h.agents,
      inbox: () => undefined,
      onError: (message, error) => {
        throw new Error(message, { cause: error });
      },
    });
    const pr = (await findPullRequest(conn, repo.id, 77))!;
    const unavailable = await measure(conn, () => flow.retrySignals(repo, pr));
    await conn.repository('agAgents').updateMany({
      filter: { id: PROJECT_MANAGER_ID },
      values: { status: 'enabled' },
    });
    const recover = await measure(conn, () => flow.retrySignals(repo, pr));
    const stable = await measure(conn, () => flow.retrySignals(repo, pr));
    const poll = await measure(conn, () => h.git.pollRepo(repo));
    process.stdout.write(
      `PM313 signal costs: ${JSON.stringify({ unavailable, recover, stable, poll })}\n`,
    );
    expect(unavailable).toMatchObject(readOnly);
    expect(stable).toMatchObject(readOnly);
    expect(recover.locks).toBeGreaterThan(0);
    const current = (await findPullRequest(conn, repo.id, 77))!;
    const reorder = (value: unknown): unknown =>
      value && typeof value === 'object' && !Array.isArray(value)
        ? Object.fromEntries(
            Object.entries(value)
              .reverse()
              .map(([key, entry]) => [key, reorder(entry)]),
          )
        : value;
    await conn.repository('studioPullRequests').updateMany({
      filter: { id: current.id },
      values: { signals: reorder(current.signals) },
    });
    const unchanged = await measure(conn, () =>
      flow.storeChecks(repo, current, current.headSha!, {
        ciState: current.ciState,
        checks: current.checks,
        statusEtag: current.statusEtag,
        runsEtag: current.runsEtag,
      }),
    );
    expect(unchanged.signalWrites).toBe(0);
    expect(unchanged.locks).toBe(1);

    const inputs = await conn
      .repository<{ payload: { trigger?: string } }>('agRunInputs')
      .findMany({});
    expect(
      inputs.filter((i) => i.payload.trigger === 'prChecksPassed'),
    ).toHaveLength(1);
    // Whole polling retains its preexisting repository/preview transaction, but adds no signal retry transaction.
    expect(poll.signalWrites).toBe(0);
    expect(poll.updates).toBeLessThan(6);
    expect(poll.begins).toBeLessThan(2);
  } finally {
    await h.close();
  }
}, 120_000);

it('rechecks active work after idle preselection before writing an epoch or input', async () => {
  const h = await createBridgeHarness();
  try {
    await h.addUser('alice');
    await h.createAgent();
    const viewer = h.viewer('alice');
    const issue = await h.projects.issues.create(viewer, {
      title: 'Idle barrier',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      start: false,
    });
    const worker = await h.createAgent({ name: 'Worker' });
    await h.projects.comments.create(
      { ...viewer, actor: { type: 'agent', id: PROJECT_MANAGER_ID } },
      issue.id,
      {
        content: `Next: Waiting for worker run to end\n\n[@Worker](mention://agent/${worker}) Investigate.`,
      },
    );
    const conn = h.database.connection();
    await conn.repository('agRuns').updateMany({
      filter: { subjectId: issue.id },
      values: { status: 'completed' },
    });
    const run = h.projects.tx.run.bind(h.projects.tx);
    const barrier = vi
      .spyOn(h.projects.tx, 'run')
      .mockImplementationOnce(async (action, ...args) => {
        // A normal owner comment queues the manager after the optimistic read, before its transaction starts.
        await h.projects.comments.create(viewer, issue.id, {
          content: 'Please check this new information.',
        });
        return run(action, ...args);
      });
    try {
      await sweepManagerIdle(
        h.agents,
        h.projects,
        createAgentWork({ agents: h.agents, projects: () => h.projects }),
        15,
        new Date(Date.now() + 60 * 60_000),
      );
    } finally {
      barrier.mockRestore();
    }
    expect(
      await conn
        .repository('studioManagerIdle')
        .findOne({ filter: { id: issue.id } }),
    ).toBeUndefined();
    const inputs = await conn
      .repository<{ payload: { trigger?: string } }>('agRunInputs')
      .findMany({});
    expect(
      inputs.filter((i) => i.payload.trigger === 'managerIdle'),
    ).toHaveLength(0);
  } finally {
    await h.close();
  }
}, 120_000);

it.each(['moved', 'closed', 'round', 'delivered'] as const)(
  'revalidates a signal retry after preselection: %s',
  async (change) => {
    const h = await createBridgeHarness();
    try {
      await h.addUser('alice');
      await h.createAgent();
      const viewer = h.viewer('alice');
      const issue = await h.projects.issues.create(viewer, {
        title: 'Retry barrier',
        statusKey: 'in_progress',
        executor: { type: 'agent', id: PROJECT_MANAGER_ID },
        start: false,
      });
      const conn = h.database.connection();
      const repo = await connectedRepo(h, 'acme/retry');
      h.github.addPull('acme/retry', {
        number: 77,
        head: { ref: 'feature', sha: 'old' },
      });
      h.github.setCheck('acme/retry', 'old', {
        name: 'test',
        status: 'completed',
        conclusion: 'success',
      });
      await conn.repository('agAgents').updateMany({
        filter: { id: PROJECT_MANAGER_ID },
        values: { status: 'disabled' },
      });
      const { pullRequest } = await h.git.link(
        viewer,
        issue.id,
        'https://github.com/acme/retry/pull/77',
        { type: 'user', id: 'alice' },
      );
      await h.git.pollRepo(repo);
      const pr = (await findPullRequest(conn, repo.id, 77))!;
      await conn.repository('agAgents').updateMany({
        filter: { id: PROJECT_MANAGER_ID },
        values: { status: 'enabled' },
      });
      const flow = createGitFlow({
        projects: () => h.projects,
        agents: () => h.agents,
        inbox: () => undefined,
        onError: (message, error) => {
          throw new Error(message, { cause: error });
        },
      });
      const run = h.projects.tx.run.bind(h.projects.tx);
      const barrier = vi
        .spyOn(h.projects.tx, 'run')
        .mockImplementationOnce(async (action, ...args) => {
          if (change === 'moved')
            h.github.pull('acme/retry', 77).head.sha = 'new';
          if (change === 'closed')
            h.github.pull('acme/retry', 77).state = 'closed';
          if (change === 'moved' || change === 'round')
            h.github.setCheck(
              'acme/retry',
              change === 'moved' ? 'new' : 'old',
              { name: 'test', status: 'in_progress', conclusion: null },
            );
          // A normal refresh commits before the selected retry acquires its PR lock.
          await h.git.refresh(viewer, issue.id, pullRequest.id);
          return run(action, ...args);
        });
      try {
        await flow.retrySignals(repo, pr);
      } finally {
        barrier.mockRestore();
      }
      const inputs = await conn
        .repository<{ payload: { trigger?: string } }>('agRunInputs')
        .findMany({});
      expect(
        inputs.filter((i) => i.payload.trigger === 'prChecksPassed'),
      ).toHaveLength(change === 'delivered' ? 1 : 0);
      const current = (await findPullRequest(conn, repo.id, 77))!;
      expect(current.headSha).toBe(change === 'moved' ? 'new' : 'old');
      expect(current.state).toBe(change === 'closed' ? 'closed' : 'open');
    } finally {
      await h.close();
    }
  },
  120_000,
);
