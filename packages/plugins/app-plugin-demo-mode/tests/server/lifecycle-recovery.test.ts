import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { afterEach, expect, it, vi } from 'vitest';

import { DemoModels } from '../../server/data/models.js';
import { DefaultDemoDataService } from '../../server/data/service.js';
import type { DemoDataset } from '../../shared/data.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await app?.close();
});

async function fixture() {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  const make = (withPolicy?: (run: () => Promise<void>) => Promise<void>) =>
    new DefaultDemoDataService({
      database: app.application.container.resolve(databaseManagerToken),

      enabled: () => true,
      models: new DemoModels(),
      modelBaseUrl: () => 'http://127.0.0.1/demoMode/models/v1',
      withPolicy,
    });
  const clear = vi.fn(async () => {
    await app.connection.query.deleteFrom('demoitems').allowAllRows().execute();
  });
  const dataset: DemoDataset = {
    id: 'recovery',
    languages: ['en-US'],
    accounts: () => [],
    clear,
    steps: () => [
      {
        key: 'item',
        run: async (context) => {
          await app.connection.query
            .insertInto('demoitems')
            .values({ name: 'fixture' })
            .execute();
          await context.track('demoitems', 'fixture', { key: 'name' });
        },
      },
    ],
  };
  return { make, dataset, clear };
}

function gate() {
  let release!: () => void;
  let enter!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const entered = new Promise<void>((resolve) => {
    enter = resolve;
  });
  return { held, entered, release, enter };
}

it.each([false, true])(
  'renews a long cleanup across instances (previous import: %s)',
  async (imported) => {
    const { make, dataset, clear } = await fixture();
    const first = make(),
      second = make();
    const waiting = gate();
    const shared = {
      ...dataset,
      clear: async () => {
        waiting.enter();
        await waiting.held;
        await clear();
      },
    };
    first.register(shared);
    second.register(shared);
    if (imported) await first.importNow('admin');
    // Keep I/O and setImmediate real while advancing beyond the interruption threshold.
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const clearing = first.clear('admin');
    await waiting.entered;
    try {
      await vi.advanceTimersByTimeAsync(11 * 60_000);
      expect((await second.status()).state).toBe('clearing');
      await expect(second.clear('admin')).rejects.toMatchObject({
        reason: 'DEMO_DATA_BUSY',
      });
      await expect(second.importNow('admin')).rejects.toMatchObject({
        reason: 'DEMO_DATA_BUSY',
      });
      await expect(second.reset('admin')).rejects.toMatchObject({
        reason: 'DEMO_DATA_BUSY',
      });
    } finally {
      waiting.release();
      await clearing;
    }
    expect(clear).toHaveBeenCalledTimes(1);
    expect((await second.status()).state).toBeNull();
  },
);

it.each(['resolve', 'reject'] as const)(
  'does not let a replaced cleanup %s over a newer import',
  async (outcome) => {
    const { make, dataset, clear } = await fixture();
    const first = make(),
      second = make();
    const waiting = gate();
    first.register({
      ...dataset,
      clear: async () => {
        waiting.enter();
        await waiting.held;
        if (outcome === 'reject') throw new Error('old cleanup failed');
      },
    });
    second.register(dataset);
    await first.importNow('admin');
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const clearing = first.clear('admin');
    const settled = clearing.then(
      () => undefined,
      (error: unknown) => error,
    );
    await waiting.entered;
    try {
      // Simulate an owner that stopped renewing, followed by another process recovering it.
      vi.setSystemTime(new Date(Date.now() + 11 * 60_000));
      await second.reset('admin', 'en-US', { wait: true });
    } finally {
      waiting.release();
      await settled;
    }
    expect(await settled).toMatchObject({ reason: 'DEMO_DATA_LEASE_LOST' });
    expect(clear).toHaveBeenCalledTimes(1);
    expect(await second.status()).toMatchObject({
      state: 'ready',
      records: 1,
      failure: null,
    });
    expect(
      await app.connection.query
        .selectFrom('demoitems')
        .select('name')
        .execute(),
    ).toEqual([{ name: 'fixture' }]);
  },
);

it('does not let a replaced import heartbeat, fail or clean a newer dataset', async () => {
  const { make, dataset, clear } = await fixture();
  const first = make(),
    second = make();
  const waiting = gate();
  first.register({
    ...dataset,
    steps: () => [
      {
        key: 'held',
        run: async () => {
          waiting.enter();
          await waiting.held;
        },
      },
    ],
  });
  second.register(dataset);
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  const importing = first.importNow('admin');
  const settled = importing.then(
    () => undefined,
    (error: unknown) => error,
  );
  await waiting.entered;
  try {
    vi.setSystemTime(new Date(Date.now() + 11 * 60_000));
    await second.reset('admin', 'en-US', { wait: true });
    const before = await app.connection.query
      .selectFrom('demoModeDatasets')
      .selectAll()
      .executeTakeFirst();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(
      await app.connection.query
        .selectFrom('demoModeDatasets')
        .selectAll()
        .executeTakeFirst(),
    ).toEqual(before);
  } finally {
    waiting.release();
    await settled;
  }
  expect(await settled).toMatchObject({ reason: 'DEMO_DATA_LEASE_LOST' });
  expect(clear).toHaveBeenCalledTimes(1);
  expect(await second.status()).toMatchObject({
    state: 'ready',
    records: 1,
    failure: null,
  });
});

it.each(['steps', 'timezone', 'policy'] as const)(
  'persists a %s initialization failure and allows immediate retry',
  async (failure) => {
    const { make, dataset, clear } = await fixture();
    let broken = true;
    const service = make(async (run) => {
      if (broken && failure === 'policy') throw new Error('policy failed');
      await run();
    });
    service.register({
      ...dataset,
      steps: (language) => {
        if (broken && failure === 'steps') throw new Error('steps failed');
        return dataset.steps!(language);
      },
      timeZone: () =>
        broken && failure === 'timezone' ? 'Invalid/Timezone' : 'UTC',
    });
    await expect(service.importNow('admin')).rejects.toThrow();
    await service.whenIdle();
    expect(await service.status()).toMatchObject({
      state: 'failed',
      importing: null,
      failure: { message: expect.any(String) },
    });
    expect(clear).toHaveBeenCalledTimes(1);
    broken = false;
    expect(await service.importNow('admin')).toMatchObject({
      state: 'ready',
      records: 1,
      failure: null,
    });
  },
);
