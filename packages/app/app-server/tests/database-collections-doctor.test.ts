import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { createAppPaths } from '../src/config/index.js';
import {
  createAppDatabaseManager,
  runAppCollectionsDoctor,
  runAppDatabaseTasks,
  type AppDatabaseConfig,
  type AppDatabaseTaskContributions,
} from '../src/database/index.js';
import { useTestDatabases, withoutDrivers } from './support/test-databases.js';

const provision = useTestDatabases();
const contributions: AppDatabaseTaskContributions = {
  appPackageName: 'test-app',
  migrations: [],
  seeds: [],
};

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

async function fixture() {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'collections-doctor-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  const databases = await provision();
  const config: AppDatabaseConfig = {
    default: 'main',
    connections: { main: databases.connectionConfig('main') },
  };
  return { paths, config };
}

function migration(directory: string, name: string, table: string): void {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, `${name}.ts`),
    `import { defineMigration } from '@nocobase/db';
export default defineMigration({ name: '${name}', async up({ builder }) {
  await builder.createCollection('${table}', (c) => {
    c.increments('id');
    c.string('value', { length: 64 });
  });
}, async down({ builder }) { await builder.dropCollection('${table}'); } });`,
  );
}

/** Drops a table the way a hand-rolled reset does: without its metadata. */
async function dropTable(
  config: AppDatabaseConfig,
  paths: ReturnType<typeof createAppPaths>,
  tableName: string,
): Promise<void> {
  const database = createAppDatabaseManager(config, paths);
  if (!database) throw new Error('Database is not configured.');
  try {
    const client = await database.connection('main').client<Knex>();
    await client.schema.dropTable(tableName);
  } finally {
    await database.destroy();
  }
}

describe('runAppCollectionsDoctor', () => {
  it('reports a healthy connection with nothing to fix', async () => {
    const { config, paths } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    expect(
      (
        await runAppDatabaseTasks(config, {
          paths,
          contributions,
          kind: 'migrations',
        })
      ).ok,
    ).toBe(true);

    const result = await runAppCollectionsDoctor(withoutDrivers(config), {
      paths,
    });
    expect(result).toMatchObject({ ok: true, status: 'completed', fix: false });
    expect(result.results[0]).toMatchObject({
      connection: 'main',
      status: 'completed',
      issues: [],
    });
    expect(result.results[0].checked).toBeGreaterThan(0);
  });

  it('reports a metadata record whose table is gone, and deletes it with fix', async () => {
    const { config, paths } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
    });
    await dropTable(config, paths, 'main_rows');

    const reported = await runAppCollectionsDoctor(withoutDrivers(config), {
      paths,
    });
    expect(reported.results[0].issues).toEqual([
      expect.objectContaining({
        name: 'mainRows',
        tableName: 'main_rows',
        code: 'COLLECTION_TABLE_MISSING',
        orphaned: true,
      }),
    ]);
    // Reporting changes nothing.
    expect(reported.results[0].repaired).toBeUndefined();

    const fixed = await runAppCollectionsDoctor(withoutDrivers(config), {
      paths,
      fix: true,
    });
    expect(fixed.results[0].repaired).toEqual(['mainRows']);

    const after = await runAppCollectionsDoctor(withoutDrivers(config), {
      paths,
    });
    expect(after.results[0].issues).toEqual([]);
  });

  it('leaves an issue a migration has to reconcile alone', async () => {
    const { config, paths } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
    });
    // The table is still there, but a column the metadata records is not.
    const database = createAppDatabaseManager(config, paths);
    if (!database) throw new Error('Database is not configured.');
    try {
      const client = await database.connection('main').client<Knex>();
      await client.schema.alterTable('main_rows', (table) => {
        table.dropColumn('value');
      });
    } finally {
      await database.destroy();
    }

    const result = await runAppCollectionsDoctor(withoutDrivers(config), {
      paths,
      fix: true,
    });
    const issues = result.results[0].issues ?? [];
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((issue) => !issue.orphaned)).toBe(true);
    // Deleting the record would lose the metadata for a table that exists.
    expect(result.results[0].repaired).toEqual([]);
  });
});
