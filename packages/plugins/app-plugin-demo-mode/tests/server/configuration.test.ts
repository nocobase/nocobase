import { demoConfigurationRuntimeToken } from '../../server/configuration/runtime-token.js';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterEach, expect, it, vi } from 'vitest';
import { demoDataToken } from '../../server/tokens.js';
import { DefaultDemoConfigurationService } from '../../server/configuration/service.js';
import { demoWriteGuardToken } from '../../server/guard.js';
import { databaseManagerToken } from '@nocobase/db';
import { resolveDemoModeSettings } from '../../server/config.js';
import { createDemoClock } from '../../server/data/clock.js';
import { nextDailyRun } from '../../shared/schedule.js';
import * as scheduleHelpers from '../../shared/schedule.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';
let app: TestApp;
afterEach(async () => app?.close());
async function setup() {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  const container = app.application.container;
  const config = container.resolve(demoConfigurationRuntimeToken);
  container.resolve(demoDataToken).register({
    id: 'test',
    languages: ['en-US'],
    accounts: () => [],
    steps: () => [],
    clear: async () => {},
  });
  return { config, guard: container.resolve(demoWriteGuardToken), container };
}
it('configures exception collections without application registration and revokes them across instances', async () => {
  const { config, container, guard } = await setup();
  const other = new DefaultDemoConfigurationService(
    container.resolve(databaseManagerToken),
    resolveDemoModeSettings(app.application.config),
    guard,
    async () => ({ importing: null, languages: ['en-US'] }),
  );
  expect((await config.read()).collections).toEqual([]);
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(400);
  await other.save('collections', 0, ['demonotes']);
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(200);
  expect((await app.request('/items', { method: 'POST' })).status).toBe(400);
  await guard.run(
    {
      method: 'POST',
      path: '/notes',
      blocked: [],
      allowed: await config.wholeCollectionRules(),
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
    config.save('collections', 1, ['demonotes', 'demonotes']),
  ).rejects.toMatchObject({ reason: 'DEMO_CONFIGURATION_INVALID' });
  for (const table of [
    'user',
    'ag_agents',
    'demo_mode_configuration',
    'demonotes;drop',
  ]) {
    await expect(config.save('collections', 1, [table])).rejects.toMatchObject({
      reason: 'DEMO_CONFIGURATION_INVALID',
    });
  }
  await expect(config.save('collections', 0, [])).rejects.toMatchObject({
    reason: 'DEMO_CONFIGURATION_CONFLICT',
  });
  await other.save('collections', 1, []);
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(400);
  expect((await other.read()).collections).toEqual([]);
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
it('resets every night at 03:00 by default until an administrator saves a schedule', async () => {
  const { container, guard } = await setup();
  const config = new DefaultDemoConfigurationService(
    container.resolve(databaseManagerToken),
    resolveDemoModeSettings(app.application.config),
    guard,
    async () => ({
      importing: null,
      languages: ['zh-CN', 'en-US'],
      language: 'en-US',
      timeZone: 'Asia/Shanghai',
    }),
  );
  const schedule = {
    enabled: true,
    hour: 3,
    minute: 0,
    timezone: 'Asia/Shanghai',
    language: 'en-US',
  };
  expect((await config.read()).schedule).toEqual(schedule);
  expect((await config.read()).nextRun).not.toBeNull();
  expect(await config.claimDaily(new Date('2026-10-22T19:00:00Z'))).toEqual(
    schedule,
  );
  // A saved schedule replaces the default, including switching it off.
  await config.save('schedule', (await config.read()).revision, {
    ...schedule,
    enabled: false,
  });
  expect(await config.claimDaily(new Date('2026-10-23T19:00:00Z'))).toBeNull();
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
  const other = new DefaultDemoConfigurationService(
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
  const config = new DefaultDemoConfigurationService(
    container.resolve(databaseManagerToken),
    resolveDemoModeSettings({ get: () => ({ enabled: false }) } as never),
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

it('keeps simulated chat opt-in and rechecks admission and tool policies', async () => {
  const { config } = await setup();
  const simulated = { modelService: 'demo', model: 'demo-chat' };
  await expect(config.chatModel(simulated)).rejects.toMatchObject({
    reason: 'DEMO_CHAT_DISABLED',
  });
  await config.save('chat', 0, {
    enabled: true,
    tools: { query: 'read', send: 'mock', unsafe: 'read' },
  });
  const saved = await config.read();
  // Existing deployments may still have a model selection in their stored policy.
  await app.connection.query
    .updateTable('demoModeConfiguration')
    .set({
      value: JSON.stringify({
        ...saved,
        chat: {
          ...saved.chat,
          model: { modelService: 'existing-service', model: 'chat' },
        },
      }),
    })
    .where('id', '=', 'default')
    .execute();
  expect(await config.chatModel(simulated)).toEqual(simulated);
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
    await config.save('chat', 1, { enabled: false, tools: {} });
    await expect(config.chatModel(simulated)).rejects.toMatchObject({
      reason: 'DEMO_CHAT_DISABLED',
    });
    await expect(
      config.runChatTool('query', { readOnly: true, run }),
    ).rejects.toMatchObject({ reason: 'DEMO_CHAT_DISABLED' });
  });
  await expect(
    config.save('chat', 1, { enabled: true, tools: {} }),
  ).rejects.toMatchObject({ reason: 'DEMO_CONFIGURATION_CONFLICT' });
  await config.save('chat', 2, { enabled: true, tools: {} });
  expect(await config.chatModel(simulated)).toEqual(simulated);
});

it('limits online chat persistence to the callback and requires enabled chat', async () => {
  const { config, guard } = await setup();
  for (const name of ['agConversations', 'agConversationMessages']) {
    await app.connection.builder.createCollection(name, (collection) => {
      collection.string('id', { primaryKey: true });
    });
  }
  let inspect: (query: { sql: string }) => void = () => {};
  guard.attach(
    {
      client: {
        on(_event, listener) {
          inspect = listener;
        },
      },
    },
    app.connection.name,
  );
  const request = <T>(run: () => T) =>
    guard.run({ method: 'POST', path: '/chat', blocked: [] }, run);
  await expect(
    request(() => config.runOnlineConversation(async () => {})),
  ).rejects.toMatchObject({ reason: 'DEMO_CHAT_DISABLED' });
  await config.save('chat', 0, { enabled: true, tools: {} });
  await request(() =>
    config.runOnlineConversation(async () => {
      expect(() =>
        inspect({ sql: 'insert into ag_conversations (id) values (1)' }),
      ).not.toThrow();
      expect(() =>
        inspect({ sql: 'update ag_conversation_messages set content = 1' }),
      ).not.toThrow();
      expect(() =>
        inspect({ sql: 'update ag_agents set last_claim_at = 1' }),
      ).toThrow();
      expect(() =>
        inspect({ sql: 'insert into ag_runs (id) values (1)' }),
      ).toThrow();
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

it('lists physical table choices without protected or deployment-managed collections', async () => {
  const { config, container, guard } = await setup();
  expect(await config.availableCollections()).toEqual(
    expect.arrayContaining([{ name: 'demoitems' }, { name: 'demonotes' }]),
  );
  expect(await config.availableCollections()).not.toContainEqual(
    expect.objectContaining({ name: 'demoModeConfiguration' }),
  );
  const settings = resolveDemoModeSettings({
    get: () => ({
      enabled: true,
      allowCollections: [' demonotes', 'demonotes '],
    }),
  } as never);
  const deployed = new DefaultDemoConfigurationService(
    container.resolve(databaseManagerToken),
    settings,
    guard,
    async () => ({ importing: null, languages: ['en-US'] }),
  );
  expect((await deployed.read()).fixedCollections).toEqual([
    'session',
    'verification',
    'demonotes',
  ]);
  expect(await deployed.availableCollections()).not.toContainEqual({
    name: 'demonotes',
  });
});

it('keeps schedule previews out of request and chat policy checks while observing policy changes', async () => {
  const { config } = await setup();
  await config.save('schedule', 0, {
    enabled: true,
    hour: 12,
    minute: 0,
    timezone: 'UTC',
    language: 'en-US',
  });
  await config.save('chat', 1, {
    enabled: true,
    tools: { lookup: 'read' },
  });
  await config.save('collections', 2, ['demoitems']);
  const preview = vi.spyOn(scheduleHelpers, 'nextDailyRun');
  try {
    expect((await app.request('/items', { method: 'POST' })).status).toBe(200);
    await config.runWithPolicy(async () => {
      await config.requireMock('dataset.model');
      expect(
        await config.chatModel({ modelService: 'demo', model: 'demo-chat' }),
      ).toEqual({ modelService: 'demo', model: 'demo-chat' });
      expect(
        await config.runChatTool('lookup', {
          readOnly: true,
          run: async () => 'result',
        }),
      ).toBe('result');
    });
    expect(preview).not.toHaveBeenCalled();
    expect((await config.read()).nextRun).not.toBeNull();
    expect(preview).toHaveBeenCalledTimes(1);
    await config.save('collections', 3, []);
    await config.save('chat', 4, { enabled: false, tools: {} });
    preview.mockClear();
    expect((await app.request('/items', { method: 'POST' })).status).toBe(400);
    await expect(
      config.chatModel({ modelService: 'demo', model: 'demo-chat' }),
    ).rejects.toMatchObject({ reason: 'DEMO_CHAT_DISABLED' });
    await expect(
      config.runChatTool('lookup', {
        readOnly: true,
        run: async () => 'result',
      }),
    ).rejects.toMatchObject({ reason: 'DEMO_CHAT_DISABLED' });
    expect(preview).not.toHaveBeenCalled();
  } finally {
    preview.mockRestore();
  }
});

it('resolves migration collection names with prefixes and isolates same-name tables on other connections', async () => {
  app = await createTestApp({
    createServer: createStandaloneServer,
    connections: ['main', 'secondary'],
    config: {
      demoMode: { enabled: true },
      database: {
        connections: {
          main: { naming: { underscored: true, tablePrefix: 'demo_' } },
          secondary: { naming: { underscored: true, tablePrefix: 'demo_' } },
        },
      },
    },
  });
  const container = app.application.container;
  const database = container.resolve(databaseManagerToken);
  const config = container.resolve(demoConfigurationRuntimeToken);
  const guard = container.resolve(demoWriteGuardToken);
  for (const name of ['main', 'secondary']) {
    await database
      .connection(name)
      .builder.createCollection('orderItems', (collection) => {
        collection.string('id', { primaryKey: true });
        collection.title('Order items');
      });
  }
  expect(
    (await app.connection.collections.getPhysical('orderItems'))?.tableName,
  ).toBe('demo_order_items');
  expect(await config.availableCollections()).toContainEqual({
    name: 'orderItems',
    title: 'Order items',
  });
  await config.save('collections', 0, ['orderItems']);
  const allowed = await config.wholeCollectionRules();
  await guard.run(
    { method: 'POST', path: '/orders', blocked: [], allowed },
    async () => {
      await app.connection.query
        .insertInto('orderItems')
        .values({ id: 'main' })
        .execute();
      await expect(
        database
          .connection('secondary')
          .query.insertInto('orderItems')
          .values({ id: 'secondary' })
          .execute(),
      ).rejects.toThrow();
      // The built-in session exception follows the same naming strategy.
      await app.connection.query
        .insertInto('session')
        .values({ name: 'visitor' })
        .execute();
    },
  );
  expect(
    await database
      .connection('secondary')
      .query.selectFrom('orderItems')
      .selectAll()
      .execute(),
  ).toEqual([]);
  await expect(
    config.save('collections', 1, ['missingCollection']),
  ).rejects.toMatchObject({ reason: 'DEMO_CONFIGURATION_INVALID' });
  await config.save('collections', 1, []);
  await expect(
    guard.run(
      {
        method: 'POST',
        path: '/orders',
        blocked: [],
        allowed: await config.wholeCollectionRules(),
      },
      () =>
        app.connection.query
          .insertInto('orderItems')
          .values({ id: 'revoked' })
          .execute(),
    ),
  ).rejects.toThrow();
});

it('converts persisted preview table selections to logical collection names once', async () => {
  const { config } = await setup();
  await app.connection.builder.createCollection('orderItems', (collection) => {
    collection.string('id', { primaryKey: true });
  });
  await app.connection.query
    .updateTable('demoModeConfiguration')
    .set({
      revision: 4,
      value: JSON.stringify({
        tables: ['order_items'],
        mocks: {},
        schedule: null,
      }),
    })
    .where('id', '=', 'default')
    .execute();
  await config.initialize();
  expect(await config.read()).toMatchObject({
    revision: 5,
    collections: ['orderItems'],
  });
  await config.initialize();
  expect((await config.read()).revision).toBe(5);
});
