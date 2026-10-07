import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createSeeder } from '../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../helpers.js';

const tempRoot = join(process.cwd(), 'tests/.tmp');
const tempDirectories: string[] = [];

describeIntegrationDatabases('sample seeds', (context) => {
  afterEach(async () => {
    await Promise.all(
      tempDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  async function prepare(prefix: string): Promise<{
    directory: string;
    tableName: string;
    lockTableName: string;
    dataTableName: string;
  }> {
    const directory = await createTempDirectory();
    const tableName = context.table(`${prefix}History`);
    const lockTableName = context.table(`${prefix}Lock`);
    const dataTableName = context.table(`${prefix}Rows`);
    await context.db.schema.createTable(dataTableName, (table) => {
      table.increments('id').primary();
      table.string('event').notNullable();
    });
    await writeRowSeed(directory, '202610060001_required', `${prefix}Rows`);
    await writeRowSeed(directory, '202610060002_sample', `${prefix}Rows`, true);
    return { directory, tableName, lockTableName, dataTableName };
  }

  it('records a sample seed as skipped unless enabled, and runs it later on request', async () => {
    const { directory, tableName, lockTableName, dataTableName } =
      await prepare('sampleSkip');
    const seeder = createSeeder({
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    });

    await expect(seeder.run()).resolves.toEqual({
      executed: ['202610060001_required'],
      skipped: [],
      skippedSamples: ['202610060002_sample'],
      warnings: [],
    });
    await expect(
      context.db(dataTableName).select('event').orderBy('id'),
    ).resolves.toEqual([{ event: '202610060001_required' }]);
    await expect(seeder.history()).resolves.toMatchObject([
      { name: '202610060001_required', status: 'executed' },
      { name: '202610060002_sample', status: 'skipped', durationMs: null },
    ]);

    // Recorded, so a later run, even one that enables sample data, leaves it alone.
    await expect(
      createSeeder({
        database: context.database,
        connection: context.spec.name,
        directory,
        tableName,
        lockTableName,
        sample: { enabled: true },
      }).run(),
    ).resolves.toMatchObject({ executed: [], skippedSamples: [] });

    await expect(seeder.runSamples()).resolves.toEqual({
      executed: ['202610060002_sample'],
    });
    await expect(
      context.db(dataTableName).select('event').orderBy('id'),
    ).resolves.toEqual([
      { event: '202610060001_required' },
      { event: '202610060002_sample' },
    ]);
    await expect(seeder.history()).resolves.toMatchObject([
      { name: '202610060001_required', status: 'executed' },
      { name: '202610060002_sample', status: 'executed' },
    ]);
    await expect(seeder.runSamples()).resolves.toEqual({ executed: [] });
  });

  it('runs a sample seed when enabled', async () => {
    const { directory, tableName, lockTableName, dataTableName } =
      await prepare('sampleEnabled');
    const seeder = createSeeder({
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
      sample: { enabled: true },
    });

    await expect(seeder.run()).resolves.toMatchObject({
      executed: ['202610060001_required', '202610060002_sample'],
      skippedSamples: [],
    });
    await expect(
      context.db(dataTableName).select('event').orderBy('id'),
    ).resolves.toEqual([
      { event: '202610060001_required' },
      { event: '202610060002_sample' },
    ]);
    await expect(seeder.history()).resolves.toMatchObject([
      { status: 'executed' },
      { status: 'executed' },
    ]);
  });

  it('records and rewrites entries no seed file describes', async () => {
    const { directory, tableName, lockTableName } =
      await prepare('sampleRecord');
    const seeder = createSeeder({
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    });
    await seeder.run();

    await seeder.record({
      packageName: 'acme',
      name: 'sample-data:acme/demo',
      status: 'skipped',
    });
    await seeder.record({
      packageName: 'acme',
      name: 'sample-data:acme/demo',
      status: 'executed',
      durationMs: 12,
    });

    const history = await seeder.history();
    expect(
      history.filter((record) => record.name === 'sample-data:acme/demo'),
    ).toMatchObject([
      {
        packageName: 'acme',
        status: 'executed',
        durationMs: 12,
      },
    ]);
    // An entry is not a seed: a run neither warns about nor reruns it.
    await expect(seeder.run()).resolves.toMatchObject({
      executed: [],
      warnings: [],
    });
  });

  it('adds the status column to a history table that predates it', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('legacySeedHistory');
    const lockTableName = context.table('legacySeedLock');
    await context.db.schema.createTable(tableName, (table) => {
      table.increments('id').primary();
      table.string('package_name', 191).notNullable();
      table.string('name', 191).notNullable().unique();
      table.string('checksum', 128).notNullable();
      table.dateTime('executed_at').notNullable();
      table.integer('duration_ms').nullable();
    });
    await context.db(tableName).insert({
      package_name: 'app',
      name: '202601010001_old',
      checksum: 'old',
      executed_at: new Date(),
      duration_ms: 1,
    });
    const seeder = createSeeder({
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    });

    // Read without upgrading first.
    await expect(seeder.history()).resolves.toMatchObject([
      { name: '202601010001_old', status: 'executed' },
    ]);
    await seeder.run();
    await expect(
      context.db.schema.hasColumn(tableName, 'status'),
    ).resolves.toBe(true);
    await expect(seeder.history()).resolves.toMatchObject([
      { name: '202601010001_old', status: 'executed' },
    ]);
  });
});

async function createTempDirectory(): Promise<string> {
  await mkdir(tempRoot, { recursive: true });
  const directory = await mkdtemp(join(tempRoot, 'sample-seeds-'));
  tempDirectories.push(directory);
  return directory;
}

async function writeRowSeed(
  directory: string,
  name: string,
  tableName: string,
  sample = false,
): Promise<void> {
  await writeFile(
    join(directory, `${name}.ts`),
    `import { defineSeed } from '../../../../db/src/index.js';
export default defineSeed({
  name: '${name}',
  sample: ${sample},
  async run({ query }) {
    await query.insertInto('${tableName}').values({ event: '${name}' }).execute();
  },
});
`,
  );
}
