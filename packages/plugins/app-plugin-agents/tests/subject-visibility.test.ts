import { createRealtimeService } from '@nocobase/realtime/server';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { ServiceContainer } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { agentsToken } from '../server/tokens.js';
import { AgentsProvider } from '../server/providers/agents.js';
import type { Knex } from 'knex';
import { afterEach, expect, it, vi } from 'vitest';
import { createHarness, type Harness } from './harness.js';
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
      return sql.filter((text) => /^select/iu.test(text)).length;
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
  expect([await measure(list), await measure(usage)]).toEqual(before);
  expect(before[0]).toBeLessThanOrEqual(5);
  // Usage reads its records, run facts, prices, subscriptions and agent names in seven fixed reads.
  expect(before[1]).toBe(7);
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
