import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { randomUUID } from 'node:crypto';
import {
  createAgents,
  AGENTS_MIGRATIONS,
  AGENTS_PACKAGE,
} from '@nocobase/app-plugin-agents/testing';
import { createSecretsService } from '@nocobase/app-server/secrets';
import { databaseManagerToken } from '@nocobase/db';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { DefaultDemoDataService } from '../../server/data/service.js';
import { DemoModels } from '../../server/data/models.js';
import type { DemoAgents } from '../../server/integrations/agents.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
const models = new Map<string, { name: string; enabled: boolean }>();
const services = {
  list: vi.fn(async () => [...models.values()]),
  create: vi.fn(async () => {
    const model = { name: `demo-${++sequence}`, enabled: true };
    models.set(model.name, model);
    return model;
  }),
  update: vi.fn(async (name: string, input: { enabled?: boolean }) => {
    Object.assign(models.get(name)!, input);
  }),
  remove: vi.fn(async (name: string) => {
    models.delete(name);
  }),
};
let sequence = 0;
let enabled = true;
const make = (agents: DemoAgents = { models: { services } }) =>
  new DefaultDemoDataService({
    database: app.application.container.resolve(databaseManagerToken),

    enabled: () => enabled,
    models: new DemoModels(),
    modelBaseUrl: () => 'http://127.0.0.1:13000/api/demoMode/models/v1',
    agents: () => agents,
  });

beforeAll(async () => {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
});
afterAll(() => app.close());
beforeEach(async () => {
  for (const table of ['demoModeModel', 'demoModeDatasets', 'demoModeRecords'])
    await app.connection.query.deleteFrom(table).allowAllRows().execute();
  vi.clearAllMocks();
  models.clear();
  enabled = true;
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

it('disables the owned service when off and reuses it when enabled again', async () => {
  const demo = make();
  await demo.initialize();
  const name = demo.models.serviceName!;
  enabled = false;
  await demo.initialize();
  expect(demo.models.serviceName).toBeNull();
  expect(models.get(name)?.enabled).toBe(false);
  services.create.mockClear();
  await make().initialize();
  expect(services.create).not.toHaveBeenCalled();
  enabled = true;
  const restarted = make();
  await restarted.initialize();
  expect(restarted.models.serviceName).toBe(name);
  expect(models.get(name)?.enabled).toBe(true);
  expect(services.create).not.toHaveBeenCalled();
});

it('can start with Demo Mode disabled after the owned model was removed', async () => {
  await make().initialize();
  models.clear();
  services.update.mockClear();
  enabled = false;
  await make().initialize();
  expect(services.update).not.toHaveBeenCalled();
});

it('preserves real Agents defaults and retires a legacy demo default on shutdown', async () => {
  const database = app.application.container.resolve(databaseManagerToken);
  await database
    .createMigrator({
      packageName: AGENTS_PACKAGE,
      directory: AGENTS_MIGRATIONS,
    })
    .latest();
  const agents = createAgents({
    database,
    idGenerator: { generateString: randomUUID },
    secrets: createSecretsService({
      keys: [{ version: 1, key: 'a'.repeat(64) }],
    }),
  });
  const api = agents.models.services;
  const real = await api.create({
    title: 'Real model',
    provider: 'openai-compatible',
    baseUrl: 'https://models.example.com/v1',
    models: [{ value: 'real-chat', label: 'Real chat' }],
  });
  const original = { modelService: real.name, model: 'real-chat' };
  await api.setDefaultChat(original, null);
  const demo = make(agents);
  await demo.initialize();
  await make(agents).initialize();
  expect((await api.defaults()).chat).toEqual(original);
  const demoRef = {
    modelService: demo.models.serviceName!,
    model: 'demo-chat',
  };
  // Older previews persisted this default; disabling Demo Mode must make it ineligible.
  await api.setDefaultChat(demoRef, null);
  enabled = false;
  await make(agents).initialize();
  expect((await api.defaults()).effectiveChat).toMatchObject(original);
  expect(
    (await api.list()).find((item) => item.name === real.name)?.enabled,
  ).toBe(true);
  // An administrator's subsequent selection survives re-enabling Demo Mode.
  await api.setDefaultChat(original, null);
  enabled = true;
  await make(agents).initialize();
  expect((await api.defaults()).chat).toEqual(original);
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
});
