import { sampleDataToken } from '@nocobase/app-server/sample-data';
import type { SampleDataRecord } from '@nocobase/app-server/sample-data';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterEach, expect, it, vi } from 'vitest';

import { demoDataToken, type DemoDataset } from '../../server/tokens.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
afterEach(async () => app?.close());

async function fixture() {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { mode: 'observe' } },
  });
  const query = app.connection.query;
  let failGeneration = false;
  let failCleanup = false;
  const generate = vi.fn(async () => {
    await query.insertInto('demoitems').values({ name: 'sample' }).execute();
    if (failGeneration) throw new Error('generation interrupted');
  });
  const dataset: DemoDataset = {
    id: 'shared',
    languages: ['en-US'],
    accounts: () => [],
    generate,
    clear: async () => {
      if (failCleanup) throw new Error('cleanup unavailable');
      await query.deleteFrom('demoitems').allowAllRows().execute();
    },
  };
  const demo = app.application.container.resolve(demoDataToken);
  demo.register(dataset);
  const names = async () =>
    (await query.selectFrom('demoitems').select('name').execute()).map(
      (row) => row.name,
    );
  return {
    demo,
    dataset,
    generate,
    names,
    failGeneration: (value: boolean) => {
      failGeneration = value;
    },
    failCleanup: (value: boolean) => {
      failCleanup = value;
    },
  };
}

it('reuses a core sample generator without resetting or consulting its execution history', async () => {
  const { demo, generate, names } = await fixture();
  const samples = app.application.container.resolve(sampleDataToken);
  const history: SampleDataRecord[] = [
    { name: 'required-initialization', status: 'executed' },
  ];
  const record = vi.fn(async (entry: SampleDataRecord) => {
    history.push(entry);
  });
  samples.prepare({
    enabled: true,
    ledger: { history: async () => history, record },
  });
  samples.register({
    name: 'shared/business',
    packageName: 'fixture',
    run: generate,
  });
  await samples.run();
  expect(await names()).toEqual(['sample']);
  const saved = structuredClone(history);
  const writes = record.mock.calls.length;
  await app.connection.query
    .insertInto('demoitems')
    .values({ name: 'visitor' })
    .execute();
  await demo.reset('admin', 'en-US', { wait: true });
  await demo.reset('admin', 'en-US', { wait: true });
  expect(await names()).toEqual(['sample']);
  expect(generate).toHaveBeenCalledTimes(3);
  expect(history).toEqual(saved);
  expect(record).toHaveBeenCalledTimes(writes);
  await samples.run();
  expect(generate).toHaveBeenCalledTimes(3);
});

it('starts a reset from cleanup after generation and cleanup both failed', async () => {
  const { demo, generate, names, failGeneration, failCleanup } =
    await fixture();
  failGeneration(true);
  failCleanup(true);
  await expect(demo.importNow('admin')).rejects.toThrow(
    'generation interrupted',
  );
  expect(await names()).toEqual(['sample']);
  await expect(demo.reset('admin', 'en-US', { wait: true })).rejects.toThrow(
    'cleanup unavailable',
  );
  expect(generate).toHaveBeenCalledTimes(1);
  failCleanup(false);
  failGeneration(false);
  await demo.reset('admin', 'en-US', { wait: true });
  expect(await names()).toEqual(['sample']);
  expect((await demo.status()).present).toBe(true);
});

it('requires exactly one generation entry point', async () => {
  const { demo, dataset } = await fixture();
  expect(() => demo.register({ ...dataset, steps: () => [] })).toThrow(
    'either generate or steps',
  );
  expect(() => demo.register({ ...dataset, generate: undefined })).toThrow(
    'either generate or steps',
  );
});
