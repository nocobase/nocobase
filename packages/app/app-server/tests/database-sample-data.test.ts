import type { Knex } from 'knex';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppPaths } from '../src/config/index.js';
import {
  createAppDatabaseManager,
  runAppDatabaseTasks,
  type AppDatabaseConfig,
  type AppDatabaseTaskContributions,
} from '../src/database/index.js';
import {
  createSampleDataService,
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
    connections: { main: databases.connectionConfig('main') },
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
  function run(sampleData: boolean, operation?: 'sample') {
    return runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: operation ? 'seeds' : ['migrations', 'seeds'],
      ...(operation ? { operation } : {}),
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
  return { seed, run, rows };
}

describe('sample seeds', () => {
  it('run on a fresh install with app.sampleData, and never on a later run', async () => {
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
      executed: [],
      skippedSamples: ['003_later_sample'],
      freshInstall: false,
    });
    expect(await rows()).toEqual(['001_required', '002_sample']);
  });

  it('are recorded as skipped without app.sampleData, and run on request', async () => {
    const { seed, run, rows } = await fixture();
    seed('001_required', false);
    seed('002_sample', true);

    const installed = await run(false);
    expect(installed.results[1]).toMatchObject({
      executed: ['001_required'],
      skippedSamples: ['002_sample'],
      freshInstall: true,
    });
    expect(await rows()).toEqual(['001_required']);

    const sampled = await run(false, 'sample');
    expect(sampled.results[0]).toMatchObject({
      kind: 'seeds',
      status: 'completed',
      executed: ['002_sample'],
    });
    expect(await rows()).toEqual(['001_required', '002_sample']);
  });
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
      record: async (entry) => {
        records.set(entry.name, entry.status);
      },
    };
  }

  it('builds unrecorded samples once when enabled, and records the outcome', async () => {
    const service = createSampleDataService();
    const built = vi.fn(async () => {});
    const broken = vi.fn(async () => {
      throw new Error('broken');
    });
    service.register({ name: 'demo', packageName: 'app', run: built });
    service.register({ name: 'broken', packageName: 'app', run: broken });
    const store = ledger();

    // Nothing runs before the database provider prepares the service.
    expect(await service.run()).toEqual({
      executed: [],
      skipped: [],
      failed: [],
    });

    service.prepare({ ledger: store, enabled: true });
    const result = await service.run();
    expect(result.executed).toEqual(['demo']);
    expect(result.failed.map((entry) => entry.name)).toEqual(['broken']);
    expect([...store.records]).toEqual([
      ['sample-data:demo', 'executed'],
      ['sample-data:broken', 'skipped'],
    ]);

    await service.run();
    expect(built).toHaveBeenCalledOnce();
    expect(broken).toHaveBeenCalledOnce();

    service.rerunSkipped();
    broken.mockResolvedValueOnce(undefined);
    expect((await service.run()).executed).toEqual(['broken']);
    expect(built).toHaveBeenCalledOnce();
    expect(store.records.get('sample-data:broken')).toBe('executed');
  });

  it('records samples as skipped when not enabled, and refuses a duplicate name', async () => {
    const service = createSampleDataService();
    const run = vi.fn(async () => {});
    service.register({ name: 'demo', packageName: 'app', run });
    expect(() =>
      service.register({ name: 'demo', packageName: 'other', run }),
    ).toThrow('Sample data "demo" is already registered.');
    const store = ledger();
    service.prepare({ ledger: store, enabled: false });

    expect(await service.run()).toMatchObject({ skipped: ['demo'] });
    expect(run).not.toHaveBeenCalled();
    expect(store.records.get('sample-data:demo')).toBe('skipped');
  });
});
