import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterEach, expect, it, vi } from 'vitest';

import { demoDataToken, type DemoDataset } from '../../server/tokens.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
afterEach(async () => app?.close());

async function fixture(mode: 'off' | 'read-only' | 'observe') {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { mode, data: { models: false } } },
  });
  const service = app.application.container.resolve(demoDataToken);
  const clear = vi.fn(async () => {
    await app.connection.query.deleteFrom('demoitems').allowAllRows().execute();
  });
  const dataset: DemoDataset = {
    id: 'fixture',
    languages: ['en-US', 'zh-CN'],
    accounts: () => [],
    steps: (language) => [
      {
        key: 'items',
        run: async (context) => {
          await app.connection.query
            .insertInto('demoitems')
            .values({ name: language })
            .execute();
          await context.track('demoitems', language, { key: 'name' });
        },
      },
    ],
    clear,
  };
  service.register(dataset);
  await app.connection.query
    .insertInto('demoitems')
    .values({ name: 'existing' })
    .execute();
  const names = async () =>
    (
      await app.connection.query
        .selectFrom('demoitems')
        .select(['name'])
        .execute<{ name: string }>()
    )
      .map((row) => row.name)
      .sort();
  return { service, dataset, clear, names };
}

it.each(['read-only', 'observe'] as const)(
  'allows explicit full cleanup in %s mode, before and after imports',
  async (mode) => {
    const { service, clear, names } = await fixture(mode);
    expect(await service.clear('admin')).toMatchObject({
      state: null,
      present: false,
    });
    expect(await names()).toEqual([]);
    await app.connection.query
      .insertInto('demoitems')
      .values({ name: 'another-project' })
      .execute();
    expect(await service.reset('admin', 'zh-CN', { wait: true })).toMatchObject(
      { present: true, language: 'zh-CN' },
    );
    expect(await names()).toEqual(['zh-CN']);
    await service.clear('admin');
    await service.clear('admin');
    expect(clear).toHaveBeenCalledTimes(4);
  },
);

it('refuses full clear and reset with demo mode off, without touching existing data', async () => {
  const { service, clear, names } = await fixture('off');
  for (const operation of ['clear', 'reset'] as const)
    await expect(service[operation]('admin')).rejects.toMatchObject({
      reason: 'DEMO_MODE_REQUIRED',
    });
  await expect(service.importNow('admin')).rejects.toMatchObject({
    reason: 'DEMO_MODE_REQUIRED',
  });
  await expect(service.reset('admin')).rejects.toMatchObject({
    reason: 'DEMO_MODE_REQUIRED',
  });
  expect(await names()).toEqual(['existing']);
  expect(clear).not.toHaveBeenCalled();
});

it('uses the same full cleanup for failed and interrupted imports', async () => {
  const { service, dataset, clear, names } = await fixture('read-only');
  service.register({
    ...dataset,
    steps: (language) => [
      ...dataset.steps(language),
      {
        key: 'fail',
        run: async () => {
          throw new Error('import failed');
        },
      },
    ],
  });
  await expect(service.importNow('admin')).rejects.toThrow('import failed');
  expect(await names()).toEqual([]);
  service.register(dataset);
  await service.importNow('admin');
  await app.connection.query
    .updateTable('demoModeDatasets')
    .set({ state: 'importing', updatedAt: new Date(0) })
    .where('id', '=', 'fixture')
    .execute();
  await service.importNow('admin', 'zh-CN');
  expect(await names()).toEqual(['zh-CN']);
  expect(clear).toHaveBeenCalledTimes(3);
});

it('persists a lease for full cleanup even when no dataset was imported', async () => {
  const { service, dataset, clear } = await fixture('read-only');
  let finish!: () => void;
  let entered!: () => void;
  const held = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  service.register({
    ...dataset,
    clear: async () => {
      entered();
      await held;
      await clear();
    },
  });
  const clearing = service.clear('admin');
  await started;
  expect(
    await app.connection.query
      .selectFrom('demoModeDatasets')
      .select(['state'])
      .where('id', '=', 'fixture')
      .executeTakeFirst(),
  ).toMatchObject({ state: 'clearing' });
  await expect(service.clear('admin')).rejects.toMatchObject({
    reason: 'DEMO_DATA_BUSY',
  });
  await expect(service.importNow('admin')).rejects.toMatchObject({
    reason: 'DEMO_DATA_BUSY',
  });
  finish();
  await clearing;
  expect((await service.status()).state).toBeNull();
});
