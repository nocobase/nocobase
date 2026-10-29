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
afterEach(async () => {
  vi.useRealTimers();
  await app?.close();
});
/** Moves the clock past the per-process policy cache, as a while passing after another instance's save does. */
function expirePolicyCache(): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + 6_000);
}
async function setup(env: Record<string, string> = {}) {
  app = await createTestApp({
    createServer: createStandaloneServer,
    server: { env },
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
  // This process still serves the policy it cached until it expires.
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(400);
  expirePolicyCache();
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
  for (const table of ['unknownnotes', 'demonotes;drop']) {
    await expect(config.save('collections', 1, [table])).rejects.toMatchObject({
      reason: 'DEMO_CONFIGURATION_INVALID',
    });
  }
  await expect(config.save('collections', 0, [])).rejects.toMatchObject({
    reason: 'DEMO_CONFIGURATION_CONFLICT',
  });
  await other.save('collections', 1, []);
  expirePolicyCache();
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(400);
  expect((await other.read()).collections).toEqual([]);
});
it('enables registered mocks by default without invoking them and honors explicit disabling', async () => {
  const { config } = await setup();
  const invoke = vi.fn(async () => 'fake');
  config.registerMock({
    id: 'tool',
    title: 'Tool',
    kind: 'tool',
    scope: 'demo',
    invoke,
  });
  config.registerMock({
    id: 'disabled',
    title: 'Disabled tool',
    kind: 'tool',
    scope: 'demo',
    defaultEnabled: false,
    invoke,
  });
  expect((await config.read()).mocks).toMatchObject({
    tool: true,
    disabled: false,
  });
  expect(invoke).not.toHaveBeenCalled();
  expect(await config.invokeMock('tool', {})).toBe('fake');
  await expect(config.invokeMock('disabled', {})).rejects.toMatchObject({
    reason: 'DEMO_MOCK_UNAVAILABLE',
  });
  await config.save('mocks', 0, { tool: false, disabled: true });
  expect(await config.invokeMock('disabled', {})).toBe('fake');
  await expect(config.invokeMock('tool', {})).rejects.toMatchObject({
    reason: 'DEMO_MOCK_UNAVAILABLE',
  });
  await expect(config.invokeMock('unknown', {})).rejects.toMatchObject({
    reason: 'DEMO_MOCK_UNAVAILABLE',
  });
});
it('claims one daily reset, skips DST gaps and does not repeat a folded minute', async () => {
  const { config } = await setup({
    NOCOBASE_DEMO_RESET_HOUR: '1',
    NOCOBASE_DEMO_RESET_MINUTE: '30',
    NOCOBASE_DEMO_RESET_TIMEZONE: 'America/New_York',
  });
  const schedule = {
    enabled: true,
    hour: 1,
    minute: 30,
    timezone: 'America/New_York',
    language: 'en-US',
  };
  expect(
    await config.claimDaily(new Date('2026-11-01T05:30:00Z')),
  ).toMatchObject(schedule);
  expect(await config.claimDaily(new Date('2026-11-01T06:30:00Z'))).toBeNull();
  expect(
    nextDailyRun({ ...schedule, hour: 2 }, new Date('2026-03-08T05:00:00Z')),
  ).toBe('2026-03-09T06:30:00.000Z');
  expect(
    nextDailyRun(schedule, new Date('2026-11-01T05:31:00Z'), '2026-11-01'),
  ).toBe('2026-11-02T06:30:00.000Z');
});
it('uses deployment defaults even when an old saved schedule disables resets', async () => {
  const { config } = await setup();
  await app.connection.query
    .updateTable('demoModeConfiguration')
    .set({
      value: JSON.stringify({
        collections: ['demonotes'],
        mocks: {},
        schedule: {
          enabled: false,
          hour: 12,
          minute: 15,
          timezone: 'Asia/Shanghai',
          language: 'zh-CN',
        },
      }),
    })
    .where('id', '=', 'default')
    .execute();
  const schedule = {
    enabled: true,
    hour: 3,
    minute: 0,
    timezone: 'UTC',
    language: 'en-US',
  };
  expect(await config.read()).toMatchObject({
    collections: ['demonotes'],
    schedule,
    nextRun: expect.any(String),
  });
  expect(
    await config.claimDaily(new Date('2026-10-23T03:00:00Z')),
  ).toMatchObject(schedule);
  // Saving another policy still leaves the schedule owned by the deployment.
  await config.save('collections', 0, []);
  expect((await config.read()).schedule).toEqual(schedule);
});
it('shares durable daily claims across service instances', async () => {
  const { config, container, guard } = await setup({
    NOCOBASE_DEMO_RESET_HOUR: '4',
    NOCOBASE_DEMO_RESET_TIMEZONE: 'Asia/Shanghai',
  });
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
    async () => ({ importing: null }),
  );
  const due = new Date('2026-10-21T20:00:00Z');
  expect(await other.claimDaily(new Date('2026-10-21T19:59:00Z'))).toBeNull();
  const claim = await config.claimDaily(due);
  expect(claim).toMatchObject(schedule);
  expect(await other.claimDaily(due)).toBeNull();
  await config.finishDaily(claim!);
  expect(
    await other.claimDaily(new Date('2026-10-22T20:00:00Z')),
  ).toMatchObject(schedule);
});
/** Moves the system clock, which claim acknowledgements and retry delays read, to the firing being simulated. */
function at(iso: string): Date {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(iso));
  return new Date(iso);
}
async function dailyRow(day: string) {
  return app.connection.query
    .selectFrom('demoModeDailyResets')
    .selectAll()
    .where('day', '=', day)
    .executeTakeFirst<{ state: string; attempt: number; failure: unknown }>();
}
it('admits only due minutes and stays idle after a successful day', async () => {
  const { config } = await setup();
  expect(await config.dailyDue(at('2026-10-21T02:59:00Z'))).toBe(false);
  expect(await config.dailyDue(at('2026-10-21T03:00:00Z'))).toBe(true);
  const claim = await config.claimDaily(new Date('2026-10-21T03:00:00Z'));
  expect(claim).toMatchObject({ day: '2026-10-21', attempt: 1 });
  // A live claim is neither due again nor claimed twice.
  expect(await config.dailyDue(at('2026-10-21T03:01:00Z'))).toBe(false);
  await config.finishDaily(claim!);
  expect(await config.dailyDue(at('2026-10-21T03:02:00Z'))).toBe(false);
  // Outside the admission window nothing new is created for the day.
  expect(await config.dailyDue(at('2026-10-22T03:20:00Z'))).toBe(false);
  expect(await config.dailyDue(at('2026-10-23T03:15:00Z'))).toBe(true);
});
it('retries settled failures after a delay, at most three attempts per day', async () => {
  const { config } = await setup();
  let claim = await config.claimDaily(at('2026-10-21T03:00:00Z'));
  await config.finishDaily(claim!, new Error('generation failed'), true);
  expect(await dailyRow('2026-10-21')).toMatchObject({ state: 'retry' });
  expect(await config.dailyDue(at('2026-10-21T03:04:00Z'))).toBe(false);
  expect(await config.claimDaily(new Date('2026-10-21T03:04:00Z'))).toBeNull();
  for (const [minute, attempt] of [
    ['05', 2],
    ['10', 3],
  ] as const) {
    const now = at(`2026-10-21T03:${minute}:00Z`);
    expect(await config.dailyDue(now)).toBe(true);
    claim = await config.claimDaily(now);
    expect(claim).toMatchObject({ attempt });
    await config.finishDaily(claim!, new Error('generation failed'), true);
  }
  expect(await dailyRow('2026-10-21')).toMatchObject({
    state: 'failed',
    attempt: 3,
  });
  expect(await config.dailyDue(at('2026-10-21T03:20:00Z'))).toBe(false);
  // A failure that is not retryable ends its day at once.
  claim = await config.claimDaily(at('2026-10-22T03:00:00Z'));
  await config.finishDaily(claim!, new Error('invalid policy'));
  expect(await dailyRow('2026-10-22')).toMatchObject({ state: 'failed' });
  expect(await config.dailyDue(at('2026-10-22T03:10:00Z'))).toBe(false);
});
it('closes an unacknowledged claim once its data settled, without repeating its day', async () => {
  const { config } = await setup();
  const lost = await config.claimDaily(at('2026-10-21T03:00:00Z'));
  // The owner stopped renewing. While its data operation may still run, nothing starts and nothing throws.
  expect(await config.dailyDue(at('2026-10-21T03:11:00Z'))).toBe(true);
  expect(await config.claimDaily(new Date('2026-10-21T03:11:00Z'))).toBeNull();
  expect(await dailyRow('2026-10-21')).toMatchObject({ state: 'interrupted' });
  const tomorrow = at('2026-10-22T03:00:00Z');
  expect(await config.claimDaily(tomorrow)).toBeNull();
  // Settled data shows the operation ended; the next day proceeds and the old day stays terminal.
  const next = await config.claimDaily(tomorrow, { dataSettled: true });
  expect(next).toMatchObject({ day: '2026-10-22', attempt: 1 });
  expect(await dailyRow('2026-10-21')).toMatchObject({ state: 'recovered' });
  await expect(config.finishDaily(lost!)).rejects.toThrow(/lost/u);
  await config.finishDaily(next!);
  expect(await dailyRow('2026-10-22')).toMatchObject({ state: 'succeeded' });
});
it('never starts a later day while an earlier owner still renews its claim', async () => {
  const { config } = await setup({ NOCOBASE_DEMO_RESET_HOUR: '23' });
  const late = await config.claimDaily(at('2026-10-21T23:00:00Z'));
  await config.renewDaily(late!);
  // A reset still renewing a minute before the next day's run blocks that run without failing it.
  at('2026-10-22T22:59:00Z');
  await config.renewDaily(late!);
  const now = at('2026-10-22T23:00:00Z');
  expect(await config.dailyDue(now)).toBe(false);
  expect(await config.claimDaily(now, { dataSettled: true })).toBeNull();
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
  expect(
    await config.chatModel({ modelService: 'demo', model: 'demo-chat' }),
  ).toBeUndefined();
  expect(
    await config.runChatTool('normal', {
      run: async () => 'live',
      mock: async () => 'simulated',
    }),
  ).toBe('live');
  await expect(proxy.execute({})).rejects.toMatchObject({
    reason: 'DEMO_MODE_REQUIRED',
  });
});

it('makes integrated chat and adapted tools available without saving settings', async () => {
  const { config } = await setup();
  const simulated = { modelService: 'demo', model: 'demo-chat' };
  // Existing configuration rows without a chat section use the new defaults too.
  expect((await config.read()).chat).toEqual({ enabled: true, tools: {} });
  expect(await config.chatModel(simulated)).toEqual(simulated);
  expect(
    await config.runChatTool('query', {
      readOnly: true,
      run: async () => 'records',
    }),
  ).toBe('records');
  const real = vi.fn(async () => 'external');
  expect(
    await config.runChatTool('send', { run: real, mock: async () => 'demo' }),
  ).toBe('demo');
  expect(
    await config.runChatTool('mockedRead', {
      readOnly: true,
      run: real,
      mock: async () => 'demo',
    }),
  ).toBe('demo');
  await expect(
    config.runChatTool('unadapted', { run: real }),
  ).rejects.toMatchObject({ reason: 'DEMO_TOOL_UNAVAILABLE' });
  expect(real).not.toHaveBeenCalled();
});

it('rechecks explicit chat and tool policy overrides', async () => {
  const { config } = await setup();
  const simulated = { modelService: 'demo', model: 'demo-chat' };
  await config.save('chat', 0, {
    enabled: true,
    tools: { query: 'read', send: 'mock', unsafe: 'read', denied: 'deny' },
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
      mock: async () => 'mocked records',
    }),
  ).toBe('records');
  expect(await config.runChatTool('send', { run, mock: async () => 42 })).toBe(
    42,
  );
  for (const id of ['send', 'unsafe', 'unknown'])
    await expect(config.runChatTool(id, { run })).rejects.toMatchObject({
      reason: 'DEMO_TOOL_UNAVAILABLE',
    });
  await expect(
    config.runChatTool('denied', { readOnly: true, run, mock: run }),
  ).rejects.toMatchObject({ reason: 'DEMO_TOOL_UNAVAILABLE' });
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

it('permits integrated conversation persistence by default only inside its callback', async () => {
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
  request(() =>
    expect(() =>
      inspect({ sql: 'insert into ag_conversations (id) values (1)' }),
    ).toThrow(),
  );
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
      inspect({ sql: 'insert into ag_conversations (id) values (1)' }),
    ).toThrow(),
  );
  await config.save('chat', 0, { enabled: false, tools: {} });
  await expect(
    request(() => config.runOnlineConversation(async () => {})),
  ).rejects.toMatchObject({ reason: 'DEMO_CHAT_DISABLED' });
});

it('lists physical table choices without deployment-managed collections', async () => {
  const { config, container, guard } = await setup();
  expect(await config.availableCollections()).toEqual(
    expect.arrayContaining([{ name: 'demoitems' }, { name: 'demonotes' }]),
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
  await config.save('chat', 0, {
    enabled: true,
    tools: { lookup: 'read' },
  });
  await config.save('collections', 1, ['demoitems']);
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
    await config.save('collections', 2, []);
    await config.save('chat', 3, { enabled: false, tools: {} });
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

it('resolves allowed collections once instead of introspecting the schema on every request', async () => {
  const { config, container } = await setup();
  await config.save('collections', 0, ['demonotes']);
  expect((await app.request('/notes', { method: 'POST' })).status).toBe(200);
  const collections = container
    .resolve(databaseManagerToken)
    .connection().collections;
  const getPhysical = vi.spyOn(collections, 'getPhysical');
  const get = vi.spyOn(collections, 'get');
  for (let request = 0; request < 3; request += 1)
    expect((await app.request('/items')).status).toBe(200);
  expect((await app.request('/items', { method: 'POST' })).status).toBe(400);
  expect(getPhysical).not.toHaveBeenCalled();
  // The guarded routes' own queries still resolve their tables; the allowed rules add no lookups.
  expect(get.mock.calls.map(([name]) => name)).not.toContain('verification');
  expect(get.mock.calls.map(([name]) => name)).not.toContain('demonotes');
});
