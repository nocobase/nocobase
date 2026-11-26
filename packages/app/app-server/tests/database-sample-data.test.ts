import { databaseManagerToken } from '@nocobase/db';
import type { Knex } from 'knex';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Application } from '../src/application/index.js';
import { ServiceProvider } from '@nocobase/service-provider';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  createAppDatabaseManager,
  createAppSeeder,
  DatabaseProvider,
  runAppDatabaseTasks,
  type AppDatabaseConfig,
  type AppDatabaseTaskContributions,
  type AppSeeder,
} from '../src/database/index.js';
import {
  createSampleDataService,
  sampleDataToken,
  type SampleDataLedger,
  type SampleDataRecord,
} from '../src/sample-data/index.js';
import { useTestDatabases } from './support/test-databases.js';

const provision = useTestDatabases();

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

async function fixture() {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'sample-data-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  const databases = await provision(['main']);
  const config: AppDatabaseConfig = {
    default: 'main',
    connections: {
      main: {
        ...databases.connectionConfig('main'),
        seeds: { onChecksumMismatch: 'error' },
      },
    },
  };
  const contributions: AppDatabaseTaskContributions = {
    appPackageName: 'test-app',
    migrations: [],
    seeds: [],
  };
  const migrations = paths.database('main/migrations');
  mkdirSync(migrations, { recursive: true });
  writeFileSync(
    path.join(migrations, '001_rows.ts'),
    `import { defineMigration } from '@nocobase/db';
export default defineMigration({ name: '001_rows', async up({ builder }) {
await builder.createCollection('rows', c => { c.increments('id'); c.string('value'); });
}, async down({ builder }) { await builder.dropCollection('rows'); } });`,
  );
  function seed(name: string, sample: boolean): void {
    const directory = paths.database('main/seeds');
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, `${name}.ts`),
      `import { defineSeed } from '@nocobase/db';
export default defineSeed({ name: '${name}', sample: ${sample}, async run({ query }) {
await query.insertInto('rows').values({ value: '${name}' }).execute();
} });`,
    );
  }
  function run(sampleData: boolean, operation?: 'sample', dryRun = false) {
    return runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: operation ? 'seeds' : ['migrations', 'seeds'],
      ...(operation ? { operation } : {}),
      dryRun,
      runtimeConfig: {
        get: <T>(key: string): T | undefined =>
          (key === 'app.sampleData' ? sampleData : undefined) as T | undefined,
      },
    });
  }
  async function rows(): Promise<string[]> {
    const database = createAppDatabaseManager(config)!;
    try {
      const client = await database.connection('main').client<Knex>();
      const found = await client('rows').select('value').orderBy('id');
      return found.map((row: { value: string }) => row.value);
    } finally {
      await database.destroy();
    }
  }
  async function withSeeder<T>(work: (seeder: AppSeeder) => Promise<T>) {
    const database = createAppDatabaseManager(config)!;
    try {
      return await work(
        createAppSeeder({
          database,
          config: {
            directory: paths.database('main/seeds'),
            autoRun: true,
          },
        }),
      );
    } finally {
      await database.destroy();
    }
  }
  async function start(sampleData: boolean | undefined, names: string[]) {
    const appConfig = new AppConfig();
    await appConfig.loadAll();
    appConfig.mergeDefaults({
      app: { name: 'sample-data-test', sampleData },
      database: config,
    });
    class SamplesProvider extends ServiceProvider<Application> {
      public readonly name = 'sample-data-test';
      public override boot(): void {
        const samples = this.app.container.resolve(sampleDataToken);
        for (const name of names) {
          samples.register({
            name,
            packageName: 'test-app',
            run: async () => {
              const database = this.app.container.resolve(databaseManagerToken);
              const client = await database.connection('main').client<Knex>();
              await client('rows').insert({ value: name });
            },
          });
        }
      }
    }
    const app = new Application({ config: appConfig, paths });
    app.addServiceProvider(DatabaseProvider);
    app.addServiceProvider(SamplesProvider);
    try {
      await app.start();
    } finally {
      await app.shutdown();
    }
  }
  return {
    seed,
    run,
    rows,
    history: () => withSeeder((seeder) => seeder.history()),
    start,
    recordLegacySample: (name: string) =>
      withSeeder((seeder) =>
        seeder.record({ name, packageName: 'test-app', status: 'skipped' }),
      ),
  };
}

describe('sample seeds', () => {
  it('run on fresh and existing databases with app.sampleData', async () => {
    const { seed, run, rows } = await fixture();
    seed('001_required', false);
    seed('002_sample', true);

    const installed = await run(true);
    expect(installed.results[1]).toMatchObject({
      kind: 'seeds',
      executed: ['001_required', '002_sample'],
      freshInstall: true,
    });

    seed('003_later_sample', true);
    const upgraded = await run(true);
    expect(upgraded.results[1]).toMatchObject({
      executed: ['003_later_sample'],
      freshInstall: false,
    });
    expect(await rows()).toEqual([
      '001_required',
      '002_sample',
      '003_later_sample',
    ]);
  });

  it('leave no history while disabled and run unrecorded and legacy samples on request', async () => {
    const { seed, run, rows, history, recordLegacySample } = await fixture();
    seed('001_required', false);
    seed('002_sample', true);

    const installed = await run(false);
    expect(installed.results[1]).toMatchObject({
      executed: ['001_required'],
      skippedSamples: ['002_sample'],
      freshInstall: true,
    });
    expect(await rows()).toEqual(['001_required']);
    expect(await history()).toMatchObject([
      { name: '001_required', status: 'executed' },
    ]);
    seed('003_legacy_sample', true);
    seed('004_now_required', false);
    await recordLegacySample('003_legacy_sample');
    await recordLegacySample('004_now_required');
    expect((await run(false, undefined, true)).results[1]).toMatchObject({
      pending: ['004_now_required'],
      skipped: ['001_required'],
    });
    expect((await run(true, undefined, true)).results[1]).toMatchObject({
      pending: ['002_sample', '003_legacy_sample', '004_now_required'],
      skipped: ['001_required'],
    });
    expect(await rows()).toEqual(['001_required']);

    const sampled = await run(false, 'sample');
    expect(sampled.results[0]).toMatchObject({
      kind: 'seeds',
      status: 'completed',
      executed: ['002_sample', '003_legacy_sample'],
    });
    expect(await rows()).toEqual([
      '001_required',
      '002_sample',
      '003_legacy_sample',
    ]);
    expect((await run(false, 'sample')).results[0].executed).toEqual([]);
    expect((await run(false)).results[1].executed).toEqual([
      '004_now_required',
    ]);
  });
});

it('runs unrecorded and legacy samples once on subsequent enabled starts', async () => {
  const { seed, start, rows, history, recordLegacySample } = await fixture();
  seed('001_required', false);
  seed('002_sample', true);

  await start(undefined, ['demo']);
  expect(await rows()).toEqual(['001_required']);
  expect(await history()).toMatchObject([
    { name: '001_required', status: 'executed' },
  ]);

  await recordLegacySample('002_sample');
  await recordLegacySample('sample-data:demo');
  const beforeUpgrade = await history();
  seed('003_sample', true);
  await start(false, ['demo', 'demo-upgrade']);
  expect(await rows()).toEqual(['001_required']);
  expect(await history()).toEqual(beforeUpgrade);

  seed('004_sample', true);
  const registrations = ['demo', 'demo-upgrade', 'demo-new'];
  await start(true, registrations);
  await start(true, registrations);

  expect(await rows()).toEqual([
    '001_required',
    '002_sample',
    '003_sample',
    '004_sample',
    ...registrations,
  ]);
  expect(
    (await history()).map(({ name, status }) => [name, status]).sort(),
  ).toEqual([
    ['001_required', 'executed'],
    ['002_sample', 'executed'],
    ['003_sample', 'executed'],
    ['004_sample', 'executed'],
    ['sample-data:demo', 'executed'],
    ['sample-data:demo-new', 'executed'],
    ['sample-data:demo-upgrade', 'executed'],
  ]);
});

it('builds registrations when the app has no seed files', async () => {
  const { start, rows, history } = await fixture();
  await start(true, ['demo']);

  expect(await rows()).toEqual(['demo']);
  expect(await history()).toMatchObject([
    { name: 'sample-data:demo', status: 'executed' },
  ]);
});

describe('sample data service', () => {
  function ledger(): SampleDataLedger & { records: Map<string, string> } {
    const records = new Map<string, string>();
    return {
      records,
      history: async (): Promise<SampleDataRecord[]> =>
        [...records].map(([name, status]) => ({
          name,
          status: status as SampleDataRecord['status'],
        })),
      record: vi.fn(async (entry) => {
        records.set(entry.name, entry.status);
      }),
    };
  }

  it('records only successful registrations and retries failures', async () => {
    const service = createSampleDataService();
    const built = vi.fn(async () => {});
    const broken = vi.fn(async () => {
      throw new Error('broken');
    });
    const legacy = vi.fn(async () => {
      throw new Error('legacy');
    });
    service.register({ name: 'demo', packageName: 'app', run: built });
    service.register({ name: 'broken', packageName: 'app', run: broken });
    service.register({ name: 'legacy', packageName: 'app', run: legacy });
    const store = ledger();
    store.records.set('sample-data:legacy', 'skipped');

    // Nothing runs before the database provider prepares the service.
    expect(await service.run()).toEqual({
      executed: [],
      skipped: [],
      failed: [],
    });

    service.prepare({ ledger: store, enabled: true });
    const result = await service.run();
    expect(result.executed).toEqual(['demo']);
    expect(result.failed.map((entry) => entry.name)).toEqual([
      'broken',
      'legacy',
    ]);
    expect([...store.records]).toEqual([
      ['sample-data:legacy', 'skipped'],
      ['sample-data:demo', 'executed'],
    ]);
    expect(store.record).toHaveBeenCalledOnce();

    broken.mockResolvedValueOnce(undefined);
    legacy.mockResolvedValueOnce(undefined);
    expect((await service.run()).executed).toEqual(['broken', 'legacy']);
    expect(built).toHaveBeenCalledOnce();
    expect(broken).toHaveBeenCalledTimes(2);
    expect(store.records.get('sample-data:broken')).toBe('executed');
    expect(store.records.get('sample-data:legacy')).toBe('executed');
  });

  it('reports disabled samples without writing history and can run them on request', async () => {
    const service = createSampleDataService();
    const run = vi.fn(async () => {});
    service.register({ name: 'demo', packageName: 'app', run });
    expect(() =>
      service.register({ name: 'demo', packageName: 'other', run }),
    ).toThrow('Sample data "demo" is already registered.');
    const store = ledger();
    store.records.set('sample-data:legacy', 'skipped');
    service.register({ name: 'legacy', packageName: 'app', run });
    service.prepare({ ledger: store, enabled: false });

    expect(await service.run()).toMatchObject({ skipped: ['demo', 'legacy'] });
    expect(run).not.toHaveBeenCalled();
    expect([...store.records]).toEqual([['sample-data:legacy', 'skipped']]);
    expect(store.record).not.toHaveBeenCalled();

    service.rerunSkipped();
    expect((await service.run()).executed).toEqual(['demo', 'legacy']);
    expect((await service.run()).executed).toEqual([]);
    expect(run).toHaveBeenCalledTimes(2);
    expect(store.records.get('sample-data:demo')).toBe('executed');
  });
});
