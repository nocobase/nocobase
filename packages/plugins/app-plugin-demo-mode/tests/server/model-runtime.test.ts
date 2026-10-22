import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import { databaseManagerToken } from '@nocobase/db';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { DefaultDemoDataService } from '../../server/data/service.js';
import { DemoModels } from '../../server/data/models.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
const services = {
  create: vi.fn(async () => ({ name: `demo-${++sequence}` })),
  update: vi.fn(async () => undefined),
  remove: vi.fn(async () => undefined),
  setDefaultChat: vi.fn(async () => undefined),
};
let sequence = 0;
let mode: 'off' | 'observe' = 'observe';
const make = () =>
  new DefaultDemoDataService({
    database: app.application.container.resolve(databaseManagerToken),

    mode: () => mode,
    models: new DemoModels(),
    modelBaseUrl: () => 'http://127.0.0.1:13000/api/demoMode/models/v1',
    agents: () => ({ models: { services } }) as unknown as Agents,
  });

beforeAll(async () => {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { mode: 'observe' } },
  });
});
afterAll(() => app.close());
beforeEach(async () => {
  for (const table of ['demoModeModel', 'demoModeDatasets', 'demoModeRecords'])
    await app.connection.query.deleteFrom(table).allowAllRows().execute();
  vi.clearAllMocks();
  mode = 'observe';
});

it('provisions before import and keeps the same model and credentials after clear, reset and restart', async () => {
  const demo = make();
  const dataset = {
    id: 'fixture',
    languages: ['en-US'],
    accounts: () => [],
    steps: () => [],
    clear: async () => {},
  };
  demo.register(dataset);
  await demo.initialize();
  const name = demo.models.serviceName;
  const binding = await app.connection.query
    .selectFrom('demoModeModel')
    .selectAll()
    .executeTakeFirst();
  expect(name).toBeTruthy();
  expect(services.setDefaultChat).toHaveBeenCalledWith(
    { modelService: name, model: 'demo-chat' },
    null,
  );
  await demo.importNow('admin');
  await demo.clear('admin');
  expect((await demo.status()).model.service).toBe(name);
  await demo.reset('admin', 'en-US', { wait: true });
  const restarted = make();
  restarted.register(dataset);
  await restarted.initialize();
  expect(restarted.models.serviceName).toBe(name);
  expect(
    await app.connection.query
      .selectFrom('demoModeModel')
      .selectAll()
      .executeTakeFirst(),
  ).toEqual(binding);
  expect(services.create).toHaveBeenCalledTimes(1);
  expect(services.remove).not.toHaveBeenCalled();
});

it('keeps the environment model after a failed import', async () => {
  const demo = make();
  demo.register({
    id: 'fixture',
    languages: ['en-US'],
    accounts: () => [],
    steps: () => [
      {
        key: 'fail',
        run: async () => {
          throw new Error('failed step');
        },
      },
    ],
    clear: async () => {},
  });
  await demo.initialize();
  const name = demo.models.serviceName;
  await expect(demo.importNow('admin')).rejects.toThrow('failed step');
  expect((await demo.status()).model.service).toBe(name);
  expect(services.remove).not.toHaveBeenCalled();
});

it('does not provision or expose a model when demo mode is off', async () => {
  const demo = make();
  await demo.initialize();
  mode = 'off';
  await demo.initialize();
  expect(demo.models.serviceName).toBeNull();
  services.create.mockClear();
  services.setDefaultChat.mockClear();
  await make().initialize();
  expect(services.create).not.toHaveBeenCalled();
  expect(services.setDefaultChat).not.toHaveBeenCalled();
});

it('concurrent startups converge on one durable model binding', async () => {
  const a = make();
  const b = make();
  await Promise.all([a.initialize(), b.initialize()]);
  expect(a.models.serviceName).toBe(b.models.serviceName);
  expect(a.models.serviceName).toBeTruthy();
  expect(
    services.create.mock.calls.length - services.remove.mock.calls.length,
  ).toBe(1);
});

it('fails startup when model configuration fails instead of falling back to another model', async () => {
  services.update.mockRejectedValueOnce(new Error('missing model'));
  await expect(make().initialize()).rejects.toThrow('missing model');
  expect(services.setDefaultChat).not.toHaveBeenCalled();
});
