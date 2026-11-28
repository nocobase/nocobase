import { createRealtimeService } from '@nocobase/realtime/server';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { ServiceContainer } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { agentsToken } from '../server/tokens.js';
import { AgentsProvider } from '../server/providers/agents.js';
import type { Knex } from 'knex';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHarness, type Harness } from './harness.js';
import { runsRepo } from '../server/core/runs/run.store.js';
import { usageReadLimits } from '../server/core/reports/report.service.js';
import {
  runVisibility,
  subjectVisibleForRun,
  mayAccessRun,
} from '../server/core/runs/access.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});
it('hides an unreadable subject from every run endpoint, list, options, reports and realtime policy', async () => {
  h = await createHarness();
  const sample = h.services.subjects.get('sample')!;
  const hook = vi.fn(
    async () =>
      (eb: import('@nocobase/db').ExpressionBuilder, column: string) =>
        eb(column, 'is', null),
  );
  h.services.subjects.register({
    ...sample,
    kind: 'hidden',
    visibleSubjects: hook,
  });
  const agentId = await h.createAgent();
  const id = await h.enqueue(agentId, 'secret', { actorUserId: 'bob' });
  await h.database
    .connection()
    .query.updateTable('agRuns')
    .set({ subjectKind: 'hidden' })
    .where('id', '=', id)
    .execute();
  await h.database
    .connection()
    .repository('agRunUsage')
    .createOne({
      values: {
        id: 'hidden-usage',
        runId: id,
        tool: 'claude',
        modelService: null,
        model: 'test',
        inputTokens: 7,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
        createdAt: h.clock.now().toISOString(),
      },
    });
  const caller = {
    user: 'reader',
    can: ['agents.agents/read', 'agents.agents/manage'],
  };
  for (const [method, suffix] of [
    ['GET', ''],
    ['GET', '/brief'],
    ['GET', '/events'],
    ['POST', '/cancel'],
    ['POST', '/retry'],
  ] as const) {
    expect(
      (await h.request(method, `/agents/runs/${id}${suffix}`)).status,
    ).toBe(401);
    expect(
      (await h.request(method, `/agents/runs/${id}${suffix}`, caller)).status,
    ).toBe(404);
  }
  expect(
    (
      await h.request(
        'GET',
        '/agents/runs?subjectKind=hidden&subjectId=secret',
        caller,
      )
    ).body.data,
  ).toEqual([]);
  expect(
    (
      await h.request(
        'GET',
        '/agents/runAgents?subjectKind=hidden&subjectId=secret',
        caller,
      )
    ).body.data,
  ).toEqual([]);
  expect(
    (await h.services.reporting.usage({ userId: 'reader', allRuns: true }, {}))
      .totals.runs,
  ).toBe(0);
  expect(
    await h.services.reporting.runRecords(
      { userId: 'reader', allRuns: true },
      { groupId: null },
    ),
  ).toEqual([]);
  expect(
    (await h.services.reporting.usage({ userId: 'bob', allRuns: false }, {}))
      .totals.inputTokens,
  ).toBe(7);
  const run = await h.services.runs.get(id);
  const realtime = (userId: string) =>
    mayAccessRun(
      run,
      userId,
      false,
      async () => true,
      () =>
        subjectVisibleForRun(
          h.database.connection(),
          h.services.subjects,
          run,
          userId,
        ),
    );
  expect(await realtime('reader')).toBe(false);
  expect(await realtime('bob')).toBe(true);
  expect(
    (await h.request('GET', `/agents/runs/${id}`, { user: 'bob' })).status,
  ).toBe(200);
});
it('filters before pagination and prepares each subject policy once per page', async () => {
  h = await createHarness();
  const sample = h.services.subjects.get('sample')!;
  const hook = vi.fn(
    async () =>
      (eb: import('@nocobase/db').ExpressionBuilder, column: string) =>
        eb(column, '=', 'visible'),
  );
  h.services.subjects.register({
    ...sample,
    kind: 'filtered',
    visibleSubjects: hook,
  });
  const agentId = await h.createAgent();
  const visible: string[] = [];
  for (let i = 0; i < 7; i++) {
    const id = await h.enqueue(agentId, String(i), { actorUserId: 'bob' });
    await h.database
      .connection()
      .query.updateTable('agRuns')
      .set({ subjectKind: 'filtered', subjectId: i % 2 ? 'hidden' : 'visible' })
      .where('id', '=', id)
      .execute();
    if (i % 2 === 0) visible.push(id);
  }
  const seen: string[] = [];
  let token: string | undefined;
  do {
    hook.mockClear();
    const page = await h.request(
      'GET',
      '/agents/runs?pageSize=2' + (token ? `&pageToken=${token}` : ''),
      { user: 'reader', can: ['agents.agents/read'] },
    );
    expect(page.status).toBe(200);
    expect(page.body.data).toHaveLength(2);
    expect(hook).toHaveBeenCalledTimes(1);
    seen.push(...page.body.data.map((run: { id: string }) => run.id));
    token = page.body.meta.nextPageToken;
  } while (token);
  expect(seen).toEqual(visible.reverse());
  // A full visibility result emits no subject subquery.
  h.services.subjects.register({
    ...sample,
    kind: 'unrestricted',
    visibleSubjects: async () => null,
  });
  const predicate = await runVisibility(
    h.database.connection(),
    h.services.subjects,
    'reader',
    true,
  );
  expect(predicate).toBeTypeOf('function');
});

it('denies real subscriptions and revokes delivery after subject visibility changes', async () => {
  h = await createHarness();
  let allowed = true;
  const sample = h.services.subjects.get('sample')!;
  // Rebind the sample subject so the actual Provider uses the production hook.
  h.services.subjects.register({
    ...sample,
    kind: 'secured',
    visibleSubjects: async () =>
      allowed ? null : (eb, column) => eb(column, 'is', null),
  });
  const id = await h.enqueue(await h.createAgent(), 'secret', {
    actorUserId: 'bob',
  });
  await h.database
    .connection()
    .query.updateTable('agRuns')
    .set({ subjectKind: 'secured' })
    .where('id', '=', id)
    .execute();
  const realtime = createRealtimeService();
  const container = new ServiceContainer();
  container.instance(agentsToken, h.services);
  container.instance(realtimeServiceToken, realtime);
  container.instance(authorizationToken, {
    subjects: { resolveFor: async () => [] },
    for: () => ({ can: async () => true }),
  } as never);
  const provider = new AgentsProvider({
    container,
    consoleLogStream: 'stderr',
  } as unknown as AppPluginApplication);
  await realtime.setup();
  try {
    await provider.boot();
    const send = vi.fn();
    const reader = realtime.connect(
      { readyState: 1, send, close: () => {} },
      { principal: { userId: 'reader' } },
    );
    const topic = `agents:runs:${id}`;
    await realtime.subscribe(reader, topic);
    send.mockClear();
    allowed = false;
    await realtime.publish(topic, { kind: 'agents.run.changed', runId: id });
    await realtime.flush();
    expect(
      send.mock.calls.some(
        ([value]) => JSON.parse(String(value)).type === 'event',
      ),
    ).toBe(false);
    const stranger = realtime.connect(
      { readyState: 1, send: () => {}, close: () => {} },
      { principal: { userId: 'stranger' } },
    );
    await expect(realtime.subscribe(stranger, topic)).rejects.toThrow();
    const owner = realtime.connect(
      { readyState: 1, send: () => {}, close: () => {} },
      { principal: { userId: 'bob' } },
    );
    await expect(realtime.subscribe(owner, topic)).resolves.toBeDefined();
  } finally {
    await provider.shutdown();
    await realtime.close();
  }
});
it('keeps list and statistics visibility reads constant as the dataset grows', async () => {
  h = await createHarness();
  const sample = h.services.subjects.get('sample')!;
  const hook = vi.fn(
    async () =>
      (eb: import('@nocobase/db').ExpressionBuilder, column: string) =>
        eb(column, 'is not', null),
  );
  h.services.subjects.register({
    ...sample,
    kind: 'measured',
    visibleSubjects: hook,
  });
  const conn = h.database.connection();
  const client = await conn.client<Knex>();
  const agentId = await h.createAgent();
  const add = async (i: number) => {
    const id = await h.enqueue(agentId, String(i), { actorUserId: 'bob' });
    await conn.query
      .updateTable('agRuns')
      .set({ subjectKind: 'measured' })
      .where('id', '=', id)
      .execute();
    await conn.repository('agRunUsage').createOne({
      values: {
        id: `usage-${i}`,
        runId: id,
        tool: 'claude',
        modelService: null,
        model: 'test',
        inputTokens: 1,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
        createdAt: h.clock.now().toISOString(),
      },
    });
  };
  const measure = async (read: () => Promise<unknown>) => {
    await read();
    hook.mockClear();
    const sql: string[] = [];
    const listener = (query: { sql: string }) => sql.push(query.sql);
    client.on('query', listener);
    try {
      await read();
      expect(hook).toHaveBeenCalledTimes(1);
      return sql.filter((text) => /^select/iu.test(text));
    } finally {
      client.removeListener('query', listener);
    }
  };
  await add(0);
  const list = () =>
    h.request('GET', '/agents/runs?pageSize=20', {
      user: 'reader',
      can: ['agents.agents/read'],
    });
  const usage = () =>
    h.services.reporting.usage({ userId: 'reader', allRuns: true }, {});
  const before = [await measure(list), await measure(usage)];
  for (let i = 1; i < 20; i++) await add(i);
  const after = [await measure(list), await measure(usage)];
  expect(after.map((sql) => sql.length)).toEqual(
    before.map((sql) => sql.length),
  );
  expect(before[0]!.length).toBeLessThanOrEqual(5);
  // Usage reads its records, then their runs with whether each run's subject is inside its kind's bound now (so
  // subjects the reader may no longer see go unnamed), then run facts, prices, subscriptions and agent names: seven
  // fixed reads.
  expect(before[1]).toHaveLength(7);
  const usageReads = after[1]!.filter((sql) => /ag_run_usage/iu.test(sql));
  expect(usageReads).toHaveLength(1);
  expect(runReads(after[1]!)).toHaveLength(1);
  // The runs come by the ids the usage named, never from a scan of every usage record in the range.
  expect(after[1]!.join('\n')).not.toMatch(/\(\s*select[^)]*ag_run_usage/iu);
});

/** The reads of a usage report's runs by id. */
const runReads = (sql: readonly string[]) =>
  sql.filter((text) =>
    /from `?"?ag_runs`?"? as `?"?run`?"? where `?"?run`?"?\.`?"?id`?"? in/iu.test(
      text,
    ),
  );

describe('usage report reads under a parameter limit', () => {
  type Query = { sql: string; bindings: readonly unknown[] };
  /**
   * `total` runs bob woke on subjects 0, 1, …, two usage records each, of a kind whose bound binds `scope` ids of its
   * own and reads other tables through `exists`, as Studio's issues for a reader in that many projects; subject 3 is
   * outside it.
   */
  async function fixture(scope: number, total: number) {
    h = await createHarness();
    const sample = h.services.subjects.get('sample')!;
    const projects = [
      '3',
      ...Array.from({ length: scope - 1 }, (_, i) => `project-${i}`),
    ];
    h.services.subjects.register({
      ...sample,
      kind: 'measured',
      visibleSubjects: async () => (eb, column) =>
        eb.and([
          eb(column, 'not in', projects),
          eb.exists(
            eb
              .selectFrom('agAgents as agent')
              .select('agent.id')
              .where('agent.id', 'is not', null),
          ),
        ]),
    });
    const conn = h.database.connection();
    const client = await conn.client<Knex>();
    const agentId = await h.createAgent();
    const seedId = await h.enqueue(agentId, 'seed', { actorUserId: 'bob' });
    const { revision: _revision, ...seed } = (await runsRepo(conn).findOne({
      filter: { id: seedId },
    }))!;
    await runsRepo(conn).deleteMany({ filter: { id: seedId } });
    const ids = Array.from(
      { length: total },
      (_, i) => `run-${String(i).padStart(4, '0')}`,
    );
    for (let at = 0; at < total; at += 20) {
      const chunk = ids.slice(at, at + 20);
      await runsRepo(conn).createMany({
        values: chunk.map((id) => ({
          ...seed,
          id,
          subjectKind: 'measured',
          subjectId: String(Number(id.slice(4))),
        })),
      });
      await conn.repository('agRunUsage').createMany({
        values: chunk.flatMap((runId) =>
          [0, 1].map((part) => ({
            id: `usage-${runId}-${part}`,
            runId,
            tool: 'claude',
            modelService: null,
            model: `m${part}`,
            inputTokens: 1,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
            reasoningTokens: 0,
            createdAt: h.clock.now().toISOString(),
          })),
        ),
      });
    }
    // Bob woke every run, so he counts the one outside the bound too, unnamed.
    const read = async (parameters: number | null) => {
      const queries: Query[] = [];
      const listener = (query: {
        sql: string;
        bindings?: readonly unknown[];
      }) => queries.push({ sql: query.sql, bindings: query.bindings ?? [] });
      const limit = usageReadLimits.parameters;
      usageReadLimits.parameters = parameters;
      client.on('query', listener);
      try {
        const report = await h.services.reporting.usage(
          { userId: 'bob', allRuns: true },
          { groupBy: 'subject' },
        );
        return {
          report,
          usage: queries.filter((query) => /ag_run_usage/iu.test(query.sql)),
          runs: queries.filter((query) => runReads([query.sql]).length),
        };
      } finally {
        client.removeListener('query', listener);
        usageReadLimits.parameters = limit;
      }
    };
    return { read };
  }
  const expectReport = (
    report: Awaited<ReturnType<typeof h.services.reporting.usage>>,
    total: number,
  ) => {
    // Bob sees every subject but 3 by name; subject 3 is one unnamed row.
    expect(report.rows).toHaveLength(total);
    expect(report.rows.find((row) => row.key === '')).toMatchObject({
      name: null,
      runs: 1,
      inputTokens: 2,
    });
    expect(report.rows.find((row) => row.key === 'measured:3')).toBeUndefined();
    expect(report.totals).toMatchObject({
      runs: total,
      inputTokens: total * 2,
    });
  };

  it('reads the runs once each, in batches the statement’s parameters leave room for', async () => {
    const { read } = await fixture(500, 700);
    // SQLite's oldest limit: 700 ids beside some 500 parameters of the bound take two reads, each within 999.
    const batched = await read(999);
    expect(batched.usage).toHaveLength(1);
    expect(batched.runs).toHaveLength(2);
    for (const query of batched.runs)
      expect(query.bindings.length).toBeLessThanOrEqual(999);
    // The same report as when every id fits in one read, the dialect's own limit.
    const whole = await read(null);
    expect(whole.runs).toHaveLength(1);
    expect(whole.report).toEqual(batched.report);
    expectReport(batched.report, 700);
  });

  it('binds none of the bound’s ids in the usage read, however many the reader sees', async () => {
    const { read } = await fixture(2_000, 30);
    const { report, usage, runs } = await read(null);
    expect(usage).toHaveLength(1);
    expect(usage[0]!.bindings.length).toBeLessThan(10);
    expect(usage[0]!.sql).not.toMatch(/not in/iu);
    expect(runs).toHaveLength(1);
    expectReport(report, 30);
    // Up to a bound that leaves room for one id in 999 parameters, one id a read.
    const { read: tight } = await fixture(987, 5);
    const close = await tight(999);
    expect(close.usage[0]!.bindings.length).toBeLessThan(10);
    expect(close.runs).toHaveLength(5);
    for (const query of close.runs) {
      expect(query.bindings.length).toBeLessThanOrEqual(999);
      expect(
        query.bindings.filter((value) => /^run-/u.test(String(value))),
      ).toHaveLength(1);
    }
    expectReport(close.report, 5);
    // A bound of more than that fails plainly before any read binds past the limit.
    const { read: over } = await fixture(988, 3);
    await expect(over(999)).rejects.toThrow(/leaving none for the runs/u);
  });
});

it('keeps private sessions participant-only even for unrestricted readers and pages past them', async () => {
  h = await createHarness();
  const sample = h.services.subjects.get('sample')!;
  const hook = vi.fn(async () => null);
  h.services.subjects.register({
    ...sample,
    kind: 'private',
    private: true,
    visibleSubjects: hook,
  });
  const agent = await h.createAgent();
  const publicRun = await h.enqueue(agent, 'public', { actorUserId: 'bob' });
  let privateRun = '';
  for (let i = 0; i < 3; i++) {
    privateRun = await h.enqueue(agent, `private-${i}`, { actorUserId: 'bob' });
    await h.database
      .connection()
      .query.updateTable('agRuns')
      .set({ subjectKind: 'private' })
      .where('id', '=', privateRun)
      .execute();
  }
  const reader = {
    user: 'reader',
    can: ['agents.agents/read', 'agents.agents/manage'],
  };
  const page = await h.request('GET', '/agents/runs?pageSize=1', reader);
  expect(page.body.data.map((run: { id: string }) => run.id)).toEqual([
    publicRun,
  ]);
  expect(page.body.meta.nextPageToken).toBeUndefined();
  expect(
    (await h.request('GET', `/agents/runs/${privateRun}`, reader)).status,
  ).toBe(404);
  expect(
    (await h.request('GET', `/agents/runs/${privateRun}`, { user: 'bob' }))
      .status,
  ).toBe(200);
  expect(
    (
      await h.request(
        'GET',
        '/agents/runAgents?subjectKind=private&subjectId=private-2',
        reader,
      )
    ).body.data,
  ).toEqual([]);
  expect(hook).not.toHaveBeenCalled();
});
