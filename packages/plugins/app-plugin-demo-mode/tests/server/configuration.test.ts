import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterEach, expect, it } from 'vitest';
import { demoConfigurationToken, demoDataToken } from '../../server/tokens.js';
import { DemoConfigurationService } from '../../server/configuration/service.js';
import { demoWriteGuardToken } from '../../server/guard.js';
import { databaseManagerToken } from '@nocobase/db';
import { resolveDemoModeSettings } from '../../server/config.js';
import { createDemoClock } from '../../server/data/clock.js';
import { nextDailyRun } from '../../server/configuration/schedule.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';
let app: TestApp;
afterEach(async () => app?.close());
async function setup() {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { mode: 'read-only', data: { models: false } } },
  });
  const container = app.application.container;
  const config = container.resolve(demoConfigurationToken);
  config.registerWrite({
    id: 'items',
    table: 'demoitems',
    title: 'Items',
    operations: ['insert'],
    scopes: [
      { id: 'all', title: 'All' },
      { id: 'own', title: 'Own' },
    ],
    checkScope: async (_scope, input) => input === 'owned',
  });
  container.resolve(demoDataToken).register({
    id: 'test',
    languages: ['en-US'],
    accounts: () => [],
    steps: () => [],
    clear: async () => {},
  });
  return { config, guard: container.resolve(demoWriteGuardToken), container };
}
it('persists explicit rules, rejects stale updates and protected/unknown capabilities', async () => {
  const { config, container, guard } = await setup();
  expect((await app.request('/items', { method: 'POST' })).status).toBe(400);
  await expect(
    config.save('rules', 0, [
      { capability: 'unknown', operation: 'insert', scope: 'all' },
    ]),
  ).rejects.toMatchObject({ reason: 'DEMO_CONFIGURATION_INVALID' });
  expect(() =>
    config.registerWrite({
      id: 'bad',
      table: 'user',
      title: 'bad',
      operations: ['update'],
      scopes: [{ id: 'all', title: 'All' }],
    }),
  ).toThrow();
  await config.save('rules', 0, [
    { capability: 'items', operation: 'insert', scope: 'all' },
  ]);
  expect((await app.request('/items', { method: 'POST' })).status).toBe(200);
  await expect(config.save('mocks', 0, {})).rejects.toMatchObject({
    reason: 'DEMO_CONFIGURATION_CONFLICT',
  });
  const other = new DemoConfigurationService(
    container.resolve(databaseManagerToken),
    resolveDemoModeSettings(app.application.config),
    guard,
    async () => ({ importing: null, languages: ['en-US'] }),
  );
  expect((await other.read()).revision).toBe(1);
  await other.save('rules', 1, []);
  expect((await app.request('/items', { method: 'POST' })).status).toBe(400);
});
it('configures exception tables without application registration and revokes them across instances', async () => {
  const { config, container, guard } = await setup();
  const other = new DemoConfigurationService(
    container.resolve(databaseManagerToken),
    resolveDemoModeSettings(app.application.config),
    guard,
    async () => ({ importing: null, languages: ['en-US'] }),
  );
  expect((await config.read()).tables).toEqual([]);
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(400);
  await other.save('tables', 0, ['demonotes']);
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(200);
  expect((await app.request('/items', { method: 'POST' })).status).toBe(400);
  await guard.run(
    {
      method: 'POST',
      path: '/notes',
      blocked: [],
      allowed: await config.wholeTableRules(),
    },
    async () => {
      await app.connection.query
        .updateTable('demonotes')
        .set({ name: 'updated' })
        .where('name', '=', 'note')
        .execute();
      await app.connection.query
        .deleteFrom('demonotes')
        .where('name', '=', 'updated')
        .execute();
    },
  );
  await expect(
    config.save('tables', 1, ['demonotes', 'demonotes']),
  ).rejects.toMatchObject({ reason: 'DEMO_CONFIGURATION_INVALID' });
  for (const table of [
    'user',
    'ag_agents',
    'demo_mode_configuration',
    'demonotes;drop',
  ]) {
    await expect(config.save('tables', 1, [table])).rejects.toMatchObject({
      reason: 'DEMO_CONFIGURATION_INVALID',
    });
  }
  await expect(config.save('tables', 0, [])).rejects.toMatchObject({
    reason: 'DEMO_CONFIGURATION_CONFLICT',
  });
  await other.save('tables', 1, []);
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(400);
  expect((await other.read()).tables).toEqual([]);
});
it('allows only the registered scoped operation and isolates parallel requests', async () => {
  const { config, guard } = await setup();
  await config.save('rules', 0, [
    { capability: 'items', operation: 'insert', scope: 'own' },
  ]);
  const insert = () =>
    app.connection.query
      .insertInto('demoitems')
      .values({ name: 'owned' })
      .execute();
  await guard.run({ method: 'POST', path: '', blocked: [] }, () =>
    config.runWrite('items', 'insert', 'owned', insert),
  );
  await expect(
    guard.run({ method: 'POST', path: '', blocked: [] }, () =>
      config.runWrite('items', 'insert', 'other', insert),
    ),
  ).rejects.toMatchObject({ reason: 'DEMO_SCOPE_DENIED' });
  expect((await app.request('/items', { method: 'POST' })).status).toBe(400);
});
it('combines several capabilities in one operation and refuses it when one is out of scope', async () => {
  const { config, guard } = await setup();
  config.registerWrite({
    id: 'notes',
    table: 'demonotes',
    title: 'Notes',
    operations: ['insert'],
    scopes: [{ id: 'own', title: 'Own' }],
    checkScope: async (_scope, input) => input === 'owned',
  });
  await config.save('rules', 0, [
    { capability: 'items', operation: 'insert', scope: 'own' },
    { capability: 'notes', operation: 'insert', scope: 'own' },
  ]);
  const both = (name: string) => async () => {
    await app.connection.query
      .insertInto('demoitems')
      .values({ name })
      .execute();
    await app.connection.query
      .insertInto('demonotes')
      .values({ name })
      .execute();
  };
  const request = { method: 'POST', path: '', blocked: [] };
  await guard.run(request, () =>
    config.runWrites(
      [
        ['items', 'insert'],
        ['notes', 'insert'],
      ],
      'owned',
      both('pair'),
    ),
  );
  await expect(
    guard.run(request, () =>
      config.runWrites(
        [
          ['items', 'insert'],
          ['notes', 'insert'],
        ],
        'other',
        both('refused'),
      ),
    ),
  ).rejects.toMatchObject({ reason: 'DEMO_SCOPE_DENIED' });
  // An entry without a configured rule allows nothing, so its write is still refused.
  await expect(
    guard.run(request, () =>
      config.runWrites(
        [['notes', 'delete' as 'insert']],
        'owned',
        both('none'),
      ),
    ),
  ).rejects.toMatchObject({ reason: 'DEMO_READ_ONLY' });
});
it('never falls through disabled or missing mock adapters', async () => {
  const { config } = await setup();
  config.registerMock({
    id: 'tool',
    title: 'Tool',
    kind: 'tool',
    scope: 'demo',
    invoke: async () => 'fake',
  });
  await expect(config.invokeMock('tool', {})).rejects.toMatchObject({
    reason: 'DEMO_MOCK_UNAVAILABLE',
  });
  await config.save('mocks', 0, { tool: true });
  expect(await config.invokeMock('tool', {})).toBe('fake');
  await config.save('mocks', 1, { tool: false });
  await expect(config.invokeMock('tool', {})).rejects.toMatchObject({
    reason: 'DEMO_MOCK_UNAVAILABLE',
  });
  await expect(config.invokeMock('unknown', {})).rejects.toMatchObject({
    reason: 'DEMO_MOCK_UNAVAILABLE',
  });
});
it('claims one daily reset, skips DST gaps and does not repeat a folded minute', async () => {
  const { config } = await setup();
  const schedule = {
    enabled: true,
    hour: 1,
    minute: 30,
    timezone: 'America/New_York',
    language: 'en-US',
  };
  await config.save('schedule', 0, schedule);
  expect(await config.claimDaily(new Date('2026-11-01T05:30:00Z'))).toEqual(
    schedule,
  );
  expect(await config.claimDaily(new Date('2026-11-01T06:30:00Z'))).toBeNull();
  expect(
    nextDailyRun({ ...schedule, hour: 2 }, new Date('2026-03-08T05:00:00Z')),
  ).toBe('2026-03-09T06:30:00.000Z');
  expect(
    nextDailyRun(schedule, new Date('2026-11-01T05:31:00Z'), '2026-11-01'),
  ).toBe('2026-11-02T06:30:00.000Z');
});
it('shares durable daily claims across service instances and honors disabling', async () => {
  const { config, container, guard } = await setup();
  const schedule = {
    enabled: true,
    hour: 4,
    minute: 0,
    timezone: 'Asia/Shanghai',
    language: 'en-US',
  };
  const other = new DemoConfigurationService(
    container.resolve(databaseManagerToken),
    resolveDemoModeSettings(app.application.config),
    guard,
    async () => ({ importing: null, languages: ['en-US'] }),
  );
  const due = new Date('2026-10-21T20:00:00Z');
  expect(await config.claimDaily(due)).toBeNull();
  await config.save('schedule', 0, schedule);
  expect(await other.claimDaily(new Date('2026-10-21T19:59:00Z'))).toBeNull();
  expect(await config.claimDaily(due)).toEqual(schedule);
  expect(await other.claimDaily(due)).toBeNull();
  await other.save('schedule', 1, { ...schedule, enabled: false });
  expect(await config.claimDaily(new Date('2026-10-22T20:00:00Z'))).toBeNull();
  expect((await config.read()).nextRun).toBeNull();
  await config.save('schedule', 2, schedule);
  expect(await other.claimDaily(due)).toBeNull();
  expect(await other.claimDaily(new Date('2026-10-22T20:00:00Z'))).toEqual(
    schedule,
  );
});
it('provides deterministic daily samples independent of record iteration order', () => {
  const a = createDemoClock(
    new Date('2026-10-21T01:00:00Z'),
    'Asia/Shanghai',
    'dataset:en-US',
  );
  const b = createDemoClock(
    new Date('2026-10-21T15:00:00Z'),
    'Asia/Shanghai',
    'dataset:en-US',
  );
  const c = createDemoClock(
    new Date('2026-10-22T01:00:00Z'),
    'Asia/Shanghai',
    'dataset:en-US',
  );
  expect(a.sample('task')).toBe(b.sample('task'));
  expect(a.sample('task')).not.toBe(c.sample('task'));
  expect(a.sample('task')).toBeGreaterThanOrEqual(0);
  expect(a.sample('task')).toBeLessThan(1);
});

it('proxies every Agent call in the demo environment and rechecks disabled proxies', async () => {
  const { config } = await setup();
  let liveCalls = 0;
  const proxy = config.registerAgent({
    id: 'test.agent',
    title: 'Demo Agent',
    defaultEnabled: true,
    execute: async () => 'simulated',
  });
  const real = async () => {
    liveCalls++;
    return 'live';
  };
  expect(await proxy.run({ projectId: 'unmarked' }, real)).toBe('simulated');
  expect(await proxy.run({ projectId: 'demo' }, real)).toBe('simulated');
  await config.runWithPolicy(async () => {
    expect(await proxy.prepare()).toBe(true);
    await config.save('mocks', 0, { 'test.agent': false });
    await expect(
      config.withFreshPolicy(() => proxy.execute({ projectId: 'demo' })),
    ).rejects.toMatchObject({ reason: 'DEMO_MOCK_UNAVAILABLE' });
  });
  await expect(proxy.run({ projectId: 'demo' }, real)).rejects.toMatchObject({
    reason: 'DEMO_MOCK_UNAVAILABLE',
  });
  expect(liveCalls).toBe(0);
});

it('uses the real Agent only in an off deployment and refuses direct queued demo execution there', async () => {
  const { container, guard } = await setup();
  const config = new DemoConfigurationService(
    container.resolve(databaseManagerToken),
    resolveDemoModeSettings({ get: () => ({ mode: 'off' }) } as never, {}),
    guard,
    async () => ({ importing: null, languages: ['en-US'] }),
  );
  const proxy = config.registerAgent({
    id: 'off.agent',
    title: 'Demo',
    execute: async () => 'simulated',
  });
  expect(await proxy.prepare()).toBe(false);
  expect(await proxy.run({}, async () => 'live')).toBe('live');
  await expect(proxy.execute({})).rejects.toMatchObject({
    reason: 'DEMO_MODE_REQUIRED',
  });
});

it('keeps online chat opt-in and rechecks models and tool policies without real fallbacks', async () => {
  const { config } = await setup();
  const simulated = { modelService: 'demo', model: 'demo-chat' };
  await expect(config.chatModel(simulated)).rejects.toMatchObject({
    reason: 'DEMO_CHAT_DISABLED',
  });
  const live = { modelService: 'existing-service', model: 'chat' };
  await config.save('chat', 0, {
    enabled: true,
    model: live,
    tools: { query: 'read', send: 'mock', unsafe: 'read' },
  });
  expect(await config.chatModel(simulated)).toEqual(live);
  let writes = 0;
  const run = async () => ++writes;
  expect(
    await config.runChatTool('query', {
      readOnly: true,
      run: async () => 'records',
    }),
  ).toBe('records');
  expect(await config.runChatTool('send', { run, mock: async () => 42 })).toBe(
    42,
  );
  for (const id of ['send', 'unsafe', 'unknown'])
    await expect(config.runChatTool(id, { run })).rejects.toMatchObject({
      reason: 'DEMO_TOOL_UNAVAILABLE',
    });
  expect(writes).toBe(0);
  await config.runWithPolicy(async () => {
    await config.save('chat', 1, { enabled: false, model: null, tools: {} });
    await expect(config.chatModel(simulated)).rejects.toMatchObject({
      reason: 'DEMO_CHAT_DISABLED',
    });
    await expect(
      config.runChatTool('query', { readOnly: true, run }),
    ).rejects.toMatchObject({ reason: 'DEMO_CHAT_DISABLED' });
  });
  await expect(
    config.save('chat', 1, { enabled: true, model: null, tools: {} }),
  ).rejects.toMatchObject({ reason: 'DEMO_CONFIGURATION_CONFLICT' });
  await config.save('chat', 2, { enabled: true, model: null, tools: {} });
  expect(await config.chatModel(simulated)).toEqual(simulated);
});

it('limits legacy chat persistence to the callback and requires enabled chat', async () => {
  const { config, guard } = await setup();
  let inspect: (query: { sql: string }) => void = () => {};
  guard.attach({
    client: {
      on(_event, listener) {
        inspect = listener;
      },
    },
  });
  const request = <T>(run: () => T) =>
    guard.run({ method: 'POST', path: '/chat', blocked: [] }, run);
  await expect(
    request(() => config.runLegacyOnlineConversation(async () => {})),
  ).rejects.toMatchObject({ reason: 'DEMO_CHAT_DISABLED' });
  await config.save('chat', 0, { enabled: true, model: null, tools: {} });
  await request(() =>
    config.runLegacyOnlineConversation(async () => {
      expect(() =>
        inspect({ sql: 'insert into ag_conversations (id) values (1)' }),
      ).not.toThrow();
      expect(() =>
        inspect({ sql: 'update ag_agents set last_claim_at = 1' }),
      ).not.toThrow();
      expect(() => inspect({ sql: 'delete from ag_conversations' })).toThrow();
      expect(() =>
        inspect({ sql: 'insert into ag_run_tokens (id) values (1)' }),
      ).toThrow();
      expect(() =>
        inspect({ sql: 'update ag_model_services set name = 1' }),
      ).toThrow();
      expect(() =>
        inspect({ sql: 'insert into crm_leads (id) values (1)' }),
      ).toThrow();
      await new Promise<void>((resolve) => {
        // A distinct request must not inherit this operation's exemption.
        request(() => {
          expect(() =>
            inspect({ sql: 'insert into ag_conversations (id) values (1)' }),
          ).toThrow();
          resolve();
        });
      });
    }),
  );
  request(() =>
    expect(() =>
      inspect({ sql: 'insert into ag_runs (id) values (1)' }),
    ).toThrow(),
  );
});

it('lists physical table choices without protected or deployment-managed tables', async () => {
  const { config, container, guard } = await setup();
  expect(await config.availableTables()).toEqual(
    expect.arrayContaining(['demoitems', 'demonotes']),
  );
  expect(await config.availableTables()).not.toContain(
    'demo_mode_configuration',
  );
  const settings = resolveDemoModeSettings(app.application.config, {
    NOCOBASE_DEMO_ALLOW_TABLES: ' demonotes, DEMONOTES ',
  });
  const deployed = new DemoConfigurationService(
    container.resolve(databaseManagerToken),
    settings,
    guard,
    async () => ({ importing: null, languages: ['en-US'] }),
  );
  expect((await deployed.read()).fixedTables).toEqual([
    'session',
    'verification',
    'demonotes',
  ]);
  expect(await deployed.availableTables()).not.toContain('demonotes');
});
