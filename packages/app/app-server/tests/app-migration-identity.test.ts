// db-test-portability: dialect-specific — boots applications against SQLite files and reads the migration ledger
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import sqlite from '@nocobase/db-sqlite';
import knex from 'knex';
import { afterEach, describe, expect, it } from 'vitest';

import { AppConfig } from '../src/config/index.js';
import { DatabaseProvider } from '../src/database/index.js';
import { resolveStandaloneAppRuntime } from '../src/node/index.js';
import { defineServerPlugins } from '../src/plugins/index.js';
import {
  createAppFromRuntime,
  defineAppRuntime,
  resolveAppRuntime,
  type ResolvedAppRuntime,
} from '../src/runtime/index.js';
import { readAppPackageSync } from '../src/support/app-package.js';

const roots: string[] = [];
const disposers: (() => Promise<void>)[] = [];

afterEach(async () => {
  for (const dispose of disposers.splice(0)) await dispose();
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

const appName = '@example/built-app';

function migration(name: string): string {
  return `import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '${name}',
  async up({ builder }) { await builder.createCollection('t_${name}', (t) => t.increments('id')); },
  async down({ builder }) { await builder.dropCollection('t_${name}'); },
});
`;
}

/**
 * A built release as the Host unpacks it: the code root is `<release>/dist`, holding the manifest
 * and the application migrations. The Host loads it in-process with the release directory as the
 * root; standalone, Docker and the deployment CLI run it with `dist` as the root.
 */
function release(
  options: {
    manifest?: Record<string, unknown>;
    migrations?: Record<string, unknown>;
  } = {},
) {
  // Under the package so the migration files resolve @nocobase/db.
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'migration-identity-'));
  roots.push(root);
  const revision = path.join(root, 'revision');
  const dist = path.join(revision, 'dist');
  const migrations = path.join(dist, 'database/main/migrations');
  const volume = (id: string) => path.join(root, 'volumes', id);
  mkdirSync(migrations, { recursive: true });
  writeFileSync(
    path.join(dist, 'package.json'),
    JSON.stringify(
      options.manifest ?? { name: appName, version: '1.0.0', type: 'module' },
    ),
  );
  const addMigration = (name: string) =>
    writeFileSync(path.join(migrations, `${name}.ts`), migration(name));
  const removeMigration = (name: string) =>
    rmSync(path.join(migrations, `${name}.ts`));
  addMigration('202601010001_a');

  const databaseFile = (id: string) => path.join(volume(id), 'data.sqlite');
  const definition = (id: string) =>
    defineAppRuntime({
      deploymentRootDir: '..',
      plugins: defineServerPlugins([]),
      routes: [],
      serviceProviders: [DatabaseProvider],
      createAppConfig: () =>
        new AppConfig().load({
          name: 'test',
          read: async () => ({
            kind: 'map',
            value: {
              app: { name: 'identity', publicBasePath: '' },
              database: {
                default: 'main',
                drivers: { sqlite },
                connections: {
                  main: {
                    dialect: 'sqlite',
                    filename: databaseFile(id),
                    ...(options.migrations
                      ? { migrations: options.migrations }
                      : {}),
                  },
                },
              },
            },
          }),
        }),
    });

  const embedded = (id = 'a') => {
    mkdirSync(volume(id), { recursive: true });
    return resolveAppRuntime(definition(id), {
      mode: 'embedded',
      id,
      basePath: '',
      rootDir: revision,
      dataDir: volume(id),
      registerDisposer() {},
    });
  };
  const standalone = async (id = 'a') => {
    mkdirSync(volume(id), { recursive: true });
    const runtime = await resolveStandaloneAppRuntime(definition(id), {
      rootDir: dist,
      env: { APP_STORAGE_DIR: volume(id) },
    });
    disposers.push(() => runtime.scope.destroy());
    return runtime;
  };
  const ledger = async (id = 'a') => {
    const client = knex({
      client: 'better-sqlite3',
      connection: { filename: databaseFile(id) },
      useNullAsDefault: true,
    });
    try {
      return await client('__nocobase_migrations')
        .select('package_name', 'name')
        .orderBy('id');
    } finally {
      await client.destroy();
    }
  };
  return {
    revision,
    dist,
    volume,
    embedded,
    standalone,
    ledger,
    addMigration,
    removeMigration,
  };
}

async function boot(runtime: ResolvedAppRuntime): Promise<void> {
  const app = createAppFromRuntime(runtime);
  app.addRuntimeContributions(runtime);
  try {
    await app.start();
  } finally {
    await app.shutdown();
  }
}

describe('application migration identity', () => {
  it('is the release manifest name in every entry and instance, with storage left per entry', async () => {
    const built = release();
    const first = await built.embedded('a');
    const second = await built.embedded('b');
    const standalone = await built.standalone('c');

    expect([
      first.plugins.appPackageName,
      second.plugins.appPackageName,
      standalone.plugins.appPackageName,
    ]).toEqual([appName, appName, appName]);
    expect(first.paths.rootDir).toBe(built.revision);
    expect(first.paths.storageDir).toBe(built.volume('a'));
    expect(second.paths.storageDir).toBe(built.volume('b'));
    expect(standalone.paths.rootDir).toBe(built.dist);
    expect(standalone.paths.deploymentRootDir).toBe(built.revision);
    expect(standalone.paths.storageDir).toBe(built.volume('c'));
  });

  it('keeps one ledger identity across entries, so both refuse a database newer than the code', async () => {
    const built = release();
    await boot(await built.embedded());
    built.addMigration('202601010002_b');
    await boot(await built.standalone());
    expect(await built.ledger()).toEqual([
      { package_name: appName, name: '202601010001_a' },
      { package_name: appName, name: '202601010002_b' },
    ]);

    built.removeMigration('202601010002_b');
    await expect(boot(await built.embedded())).rejects.toThrow(
      /newer than the code/,
    );
    await expect(boot(await built.standalone())).rejects.toThrow(
      /newer than the code/,
    );
  });

  it.each([
    ['a manifest without a name', { manifest: { version: '1.0.0' } }],
    ['a manifest named app', { manifest: { name: 'app', version: '1.0.0' } }],
    ['an explicit packageName of app', { migrations: { packageName: 'app' } }],
  ])('records app for %s in every entry', async (_, options) => {
    const built = release(options);
    await boot(await built.embedded());
    await boot(await built.standalone());
    expect(await built.ledger()).toEqual([
      { package_name: 'app', name: '202601010001_a' },
    ]);
  });
});

describe('readAppPackageSync', () => {
  it('prefers a root manifest and rejects a corrupt one', () => {
    const parent = path.resolve('tests/.tmp');
    mkdirSync(path.join(parent), { recursive: true });
    const root = mkdtempSync(path.join(parent, 'app-package-'));
    roots.push(root);
    mkdirSync(path.join(root, 'dist'));
    writeFileSync(
      path.join(root, 'dist/package.json'),
      JSON.stringify({ name: 'built' }),
    );
    expect(readAppPackageSync(root).name).toBe('built');
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'source' }),
    );
    expect(readAppPackageSync(root).name).toBe('source');
    writeFileSync(path.join(root, 'package.json'), '{');
    expect(() => readAppPackageSync(root)).toThrow(SyntaxError);
  });
});
