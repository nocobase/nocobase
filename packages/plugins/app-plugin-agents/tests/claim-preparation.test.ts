import type { EventEmitter } from 'node:events';
import { afterEach, expect, it, vi } from 'vitest';
import { testDatabaseDialect } from '@nocobase/app-testing/server';
import { runsRepo, sessionsRepo } from '../server/core/runs/run.store.js';
import { createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => h?.close());

it.runIf(testDatabaseDialect() === 'postgres')(
  'reads claim collection definitions before locking the agent and stops before locking if aborted',
  async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const registration = await h.registerRunner({
      features: ['input', 'mounts'],
    });
    h.services.subjects.get('sample')!.context.claimCollections = () => [
      'agRunUsage',
    ];
    const preparedMount = {};
    const mountCollections = vi.fn(() => ['agRunUsage', 'agRunRepos']);
    h.services.mounts.register({
      name: 'example',
      prepare: async () => preparedMount,
      claimCollections: mountCollections,
      forRun: async () => null,
      bundle: async () => null,
    });
    const runId = await h.enqueue(agentId);
    const runner = await h.services.runners.authenticate(registration.key, {
      touch: false,
    });
    const conn = h.database.connection();
    type Query = {
      sql: string;
      bindings?: readonly unknown[];
      __knexTxId?: string;
    };
    type QueryEvents = EventEmitter<{
      query: [Query];
      'query-response': [unknown, Query];
    }>;
    const knex = await conn.client<QueryEvents>();
    const collected: Query[] = [];
    const record = (query: Query) => collected.push(query);
    const isAgentLock = ({ sql }: Query) =>
      /^update.*ag_agents.*last_claim_at/isu.test(sql);
    const isCatalog = ({ sql }: Query) =>
      /pg_catalog|information_schema|__nocobase_/u.test(sql);
    const isBriefDefinition = (query: Query) =>
      isCatalog(query) && query.bindings?.includes('ag_run_briefs');
    const controller = new AbortController();
    const abortDuringPreparation = (_response: unknown, query: Query) => {
      if (query.__knexTxId && isBriefDefinition(query)) controller.abort();
    };

    knex.on('query', record);
    knex.on('query-response', abortDuringPreparation);
    try {
      expect(
        await h.services.claims.claim(
          runner,
          1,
          undefined,
          undefined,
          controller.signal,
        ),
      ).toEqual([]);
      expect(controller.signal.aborted).toBe(true);
      expect(collected.some(isAgentLock)).toBe(false);
    } finally {
      knex.off('query-response', abortDuringPreparation);
      knex.off('query', record);
    }
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'queued',
      runnerId: null,
    });

    collected.length = 0;
    knex.on('query', record);
    try {
      expect((await h.services.claims.claim(runner, 1))[0]?.run.id).toBe(runId);
    } finally {
      knex.off('query', record);
    }
    const lock = collected.find(isAgentLock);
    expect(lock?.__knexTxId).toBeDefined();
    const queries = collected.filter(
      (query) => query.__knexTxId === lock!.__knexTxId,
    );
    const lockIndex = queries.indexOf(lock!);
    const beforeLock = queries.slice(0, lockIndex);
    expect(beforeLock.filter(isBriefDefinition)).toHaveLength(1);
    for (const table of ['ag_run_usage', 'ag_run_repos']) {
      expect(
        beforeLock.filter(
          (query) => isCatalog(query) && query.bindings?.includes(table),
        ),
      ).toHaveLength(1);
    }
    expect(mountCollections).toHaveBeenLastCalledWith(preparedMount);
    expect(
      beforeLock.every(
        (query) => /^begin\b/iu.test(query.sql) || isCatalog(query),
      ),
    ).toBe(true);
    expect(queries.slice(lockIndex + 1).filter(isCatalog)).toHaveLength(0);
  },
);

it.each([false, true])(
  'reuses diagnostic assembly across models (runner independent: %s)',
  async (runnerIndependent) => {
    h = await createHarness();
    const agentId = await h.createAgent({
      modelEntries: [
        { tool: 'claude', model: null },
        { tool: 'codex', model: null },
      ],
    });
    const tools = [
      { kind: 'claude', authenticated: true },
      { kind: 'codex', authenticated: true },
    ] as const;
    await h.registerRunner({ tools });
    await h.registerRunner({ tools });
    const conn = h.database.connection();
    const run = await h.services.runs.get(await h.enqueue(agentId));
    const agent = await h.services.agents.get(agentId);
    const provider = h.services.subjects.get('sample')!.context;
    Object.assign(provider, { runnerIndependent });
    const assemble = vi.spyOn(provider, 'assemble');
    const wait = await h.services.claims.diagnose(conn, run, agent);
    expect(wait?.entries.map((entry) => entry.compatibleCount)).toEqual([2, 2]);
    expect(assemble).toHaveBeenCalledTimes(runnerIndependent ? 1 : 2);
  },
);

it('reuses opted-in sections when a prior session needs recovery', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const registration = await h.registerRunner();
  const runId = await h.enqueue(agentId, 'recovery');
  const queued = await h.services.runs.get(runId);
  const conn = h.database.connection();
  await sessionsRepo(conn).createOne({
    values: {
      id: 'prior',
      agentId,
      runnerId: registration.runnerId,
      subjectKind: 'sample',
      subjectId: 'recovery',
      threadScope: queued.threadScope,
      sessionId: 'prior',
      workDir: '/fixed',
      branch: null,
      fingerprint: null,
      poisoned: false,
      updatedAt: h.clock.now().toISOString(),
    },
  });
  const section = vi.fn(async () => 'Prepared context');
  const other = vi.fn(async () => 'Assembly-specific context');
  h.services.briefs.sections.register({
    key: 'prepared',
    section,
    reuseOnRecovery: true,
  });
  h.services.briefs.sections.register({ key: 'other', section: other });
  const response = await h.request('POST', '/agents/runners/claim', {
    runnerKey: registration.key,
    body: { free: 1 },
  });
  expect(response.body.data.runs[0]?.run.id).toBe(runId);
  expect(section).toHaveBeenCalledTimes(1);
  expect(other).toHaveBeenCalledTimes(2);
});

it('rolls back dispatch when the request ends after its final update', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const registration = await h.registerRunner();
  const runId = await h.enqueue(agentId);
  const conn = h.database.connection();
  await runsRepo(conn).updateMany({
    filter: { id: runId },
    values: { claimFailures: 1 },
  });
  const runner = await h.services.runners.authenticate(registration.key, {
    touch: false,
  });
  const controller = new AbortController();
  const changes: string[] = [];
  const stop = h.services.events.on('run.changed', (event) => {
    if (event.runId === runId) changes.push(event.status);
  });
  type OnResponse = (response: unknown, query: { sql: string }) => void;
  const knex = await conn.client<{
    on(event: 'query-response', callback: OnResponse): void;
    off(event: 'query-response', callback: OnResponse): void;
  }>();
  const afterUpdate: OnResponse = (_, { sql }) => {
    if (/^update.*ag_runs.*execution_history/is.test(sql)) controller.abort();
  };
  knex.on('query-response', afterUpdate);
  try {
    expect(
      await h.services.claims.claim(
        runner,
        1,
        undefined,
        undefined,
        controller.signal,
      ),
    ).toEqual([]);
    expect(controller.signal.aborted).toBe(true);
    expect(
      await runsRepo(conn).findOne({ filter: { id: runId } }),
    ).toMatchObject({
      status: 'queued',
      claimFailures: 1,
      runnerId: null,
    });
    expect(changes).toEqual([]);
  } finally {
    knex.off('query-response', afterUpdate);
    stop();
  }
  expect((await h.services.claims.claim(runner, 1))[0]?.run.id).toBe(runId);
});

it('keeps the second claim inside the same request budget after a late wakeup', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const registration = await h.registerRunner();
  const realClaim = h.services.claims.claim;
  const claim = vi.spyOn(h.services.claims, 'claim');
  const time = vi.spyOn(performance, 'now');
  try {
    time.mockReturnValue(0);
    claim.mockImplementationOnce(async () => {
      time.mockReturnValue(190);
      return [];
    });
    const waiting = vi
      .spyOn(h.services.signal, 'wait')
      .mockImplementation(async (ms) => {
        expect(ms).toBe(10);
        time.mockReturnValue(200);
        await h.enqueue(agentId);
        return 'notified';
      });
    claim.mockImplementationOnce(realClaim);
    const response = await h.request(
      'POST',
      '/agents/runners/claim?wait=true',
      {
        runnerKey: registration.key,
        body: { free: 1 },
      },
    );
    expect(response.body.data.runs).toHaveLength(1);
    expect(waiting).toHaveBeenCalledTimes(1);
    const signal = claim.mock.calls[0]?.[4];
    expect(signal).toBe(waiting.mock.calls[0]?.[1]);
    expect(signal).toBe(claim.mock.calls[1]?.[4]);
  } finally {
    time.mockRestore();
  }
});
