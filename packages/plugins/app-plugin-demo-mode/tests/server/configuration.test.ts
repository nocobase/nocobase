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

it('proxies scoped Agent calls, preserves live calls and rechecks disabled proxies', async () => {
  const { config } = await setup();
  let liveCalls = 0;
  const proxy = config.registerAgent({
    id: 'test.agent',
    title: 'Demo Agent',
    scope: 'demo-projects',
    defaultEnabled: true,
    matches: async (input: { projectId: string }) => input.projectId === 'demo',
    execute: async () => 'simulated',
  });
  const real = async () => {
    liveCalls++;
    return 'live';
  };
  expect(await proxy.run({ projectId: 'production' }, real)).toBe('live');
  expect(await proxy.run({ projectId: 'demo' }, real)).toBe('simulated');
  await expect(
    proxy.execute({ projectId: 'production' }),
  ).rejects.toMatchObject({ reason: 'DEMO_SCOPE_DENIED' });
  await config.runWithPolicy(async () => {
    expect(await proxy.prepare({ projectId: 'demo' })).toBe(true);
    await config.save('mocks', 0, { 'test.agent': false });
    await expect(
      config.withFreshPolicy(() => proxy.execute({ projectId: 'demo' })),
    ).rejects.toMatchObject({ reason: 'DEMO_MOCK_UNAVAILABLE' });
  });
  await expect(proxy.run({ projectId: 'demo' }, real)).rejects.toMatchObject({
    reason: 'DEMO_MOCK_UNAVAILABLE',
  });
  expect(liveCalls).toBe(1);
});
