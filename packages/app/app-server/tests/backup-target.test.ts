// db-test-portability: sqlite-only — backup and restore need a file-backed SQLite database.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createBackup, restoreBackup, verifyBackup } from '@nocobase/backup';
import sqlite from '@nocobase/db-sqlite';
import { createDriveManager, type AppDriveConfig } from '@nocobase/drive';
import type { Knex } from 'knex';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { Application } from '../src/application/index.js';
import { resolveAppBackupTarget } from '../src/backup/target.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  createAppDatabaseManager,
  DatabaseProvider,
  type AppDatabaseConfig,
} from '../src/database/index.js';
import { resolveStandaloneAppRuntime } from '../src/node/index.js';
import { defineServerPlugins } from '../src/plugins/index.js';
import {
  createAppFromRuntime,
  defineAppRuntime,
  resolveAppRuntime,
} from '../src/runtime/index.js';

let root: string;
beforeEach(async () => {
  const directory = fileURLToPath(new URL('./.tmp', import.meta.url));
  await mkdir(directory, { recursive: true });
  root = await mkdtemp(join(directory, 'app-backup-target-'));
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: 'backup-test', version: '1.0.0' }),
  );
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

it.each([
  { mode: 'embedded', configuredPackage: undefined },
  { mode: 'standalone', configuredPackage: undefined },
  { mode: 'embedded', configuredPackage: 'app' },
  { mode: 'standalone', configuredPackage: 'app' },
] as const)(
  'checks migration identity after $mode startup with package override $configuredPackage',
  async ({ mode, configuredPackage }) => {
    const revision = join(root, 'revision');
    const dist = join(revision, 'dist');
    const storageDir = join(root, 'volume');
    const migrations = join(dist, 'database/main/migrations');
    const packageName = '@example/built-app';
    await mkdir(migrations, { recursive: true });
    await writeFile(
      join(dist, 'package.json'),
      JSON.stringify({ name: packageName, version: '1.0.0', type: 'module' }),
    );
    const migration = join(migrations, '001_rows.js');
    const source = `import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '001_rows',
  async up({ builder }) {
    await builder.createCollection('rows', (table) => table.increments('id'));
  },
  async down({ builder }) { await builder.dropCollection('rows'); }
});`;
    await writeFile(migration, source);
    const definition = defineAppRuntime({
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
              app: { name: 'backup-test', publicBasePath: '' },
              database: {
                default: 'main',
                drivers: { sqlite },
                migrations: { packageName: configuredPackage },
                connections: {
                  main: {
                    dialect: 'sqlite',
                    filename: join(storageDir, 'data.sqlite'),
                  },
                },
              },
            },
          }),
        }),
    });
    const cliRuntime = await resolveStandaloneAppRuntime(definition, {
      rootDir: dist,
      env: { APP_STORAGE_DIR: storageDir },
    });
    try {
      const runtime =
        mode === 'embedded'
          ? await resolveAppRuntime(definition, {
              mode,
              id: 'backup-test',
              basePath: '',
              rootDir: revision,
              dataDir: storageDir,
              registerDisposer() {},
            })
          : cliRuntime;
      const app = createAppFromRuntime(runtime);
      app.addRuntimeContributions(runtime);
      const cli = createAppFromRuntime(cliRuntime);
      cli.addRuntimeContributions(cliRuntime);
      const target = await resolveAppBackupTarget(cli);
      const file = join(root, 'backup.tgz');
      try {
        await app.start();
        const saved = await createBackup(target, { output: file });
        expect(saved.manifest.connections[0]).toMatchObject({
          migrations: {
            history: [
              {
                name: '001_rows',
                packageName: configuredPackage ?? packageName,
              },
            ],
          },
        });
      } finally {
        await app.shutdown();
      }
      const db = createAppDatabaseManager(
        cli.config.get<AppDatabaseConfig>('database')!,
        cli.paths,
      )!;
      try {
        await db.query('main').insertInto('rows').values({ id: 1 }).execute();
      } finally {
        await db.destroy();
      }
      // A sealed build can still verify the same artifact's pre-sealing checksum.
      const sealed = source + '\n// @nocobase/task-manifest v1\n';
      await writeFile(migration, sealed);
      const taskManifest = join(migrations, '.manifest.json');
      await writeFile(
        taskManifest,
        JSON.stringify({
          version: 1,
          files: {
            '001_rows.js': {
              sourceChecksum: createHash('sha256')
                .update('source version')
                .digest('hex'),
              artifactChecksum: createHash('sha256')
                .update(sealed)
                .digest('hex'),
            },
          },
        }),
      );
      expect(await verifyBackup(file, { target })).toMatchObject({ ok: true });
      expect(await restoreBackup(file, target)).toMatchObject({
        connections: [{ name: 'main', status: 'restored' }],
      });
      await rm(taskManifest);
      await writeFile(migration, source + '\n// Changed migration.');
      expect(await verifyBackup(file, { target })).toMatchObject({
        ok: false,
        problems: [{ code: 'RESTORE_MIGRATION_MISMATCH' }],
      });
    } finally {
      await cliRuntime.scope.destroy();
    }
  },
);

it('preserves and restores a database with the historical app migration identity', async () => {
  const revision = join(root, 'revision');
  const dist = join(revision, 'dist');
  const storageDir = join(root, 'volume');
  const migrations = join(dist, 'database/main/migrations');
  const packageName = '@example/built-app';
  await mkdir(migrations, { recursive: true });
  await writeFile(
    join(dist, 'package.json'),
    JSON.stringify({ name: packageName, version: '1.0.0', type: 'module' }),
  );
  const migration = join(migrations, '001_rows.js');
  const source = `import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '001_rows',
  async up({ builder }) {
    await builder.createCollection('rows', (table) => table.increments('id'));
  },
  async down({ builder }) { await builder.dropCollection('rows'); }
});`;
  await writeFile(migration, source);
  const definition = (configuredPackage?: string) =>
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
              app: { name: 'backup-test', publicBasePath: '' },
              database: {
                default: 'main',
                drivers: { sqlite },
                migrations: { packageName: configuredPackage },
                connections: {
                  main: {
                    dialect: 'sqlite',
                    filename: join(storageDir, 'data.sqlite'),
                  },
                },
              },
            },
          }),
        }),
    });
  const resolveEmbedded = () =>
    resolveAppRuntime(definition(), {
      mode: 'embedded',
      id: 'backup-test',
      basePath: '',
      rootDir: revision,
      dataDir: storageDir,
      registerDisposer() {},
    });
  const defaultCliRuntime = await resolveStandaloneAppRuntime(definition(), {
    rootDir: dist,
    env: { APP_STORAGE_DIR: storageDir },
  });
  const matchingCliRuntime = await resolveStandaloneAppRuntime(
    definition('app'),
    {
      rootDir: dist,
      env: { APP_STORAGE_DIR: storageDir },
    },
  );
  const defaultCli = createAppFromRuntime(defaultCliRuntime);
  defaultCli.addRuntimeContributions(defaultCliRuntime);
  const matchingCli = createAppFromRuntime(matchingCliRuntime);
  matchingCli.addRuntimeContributions(matchingCliRuntime);
  const defaultTarget = await resolveAppBackupTarget(defaultCli);
  const matchingTarget = await resolveAppBackupTarget(matchingCli);

  try {
    const firstRuntime = await resolveEmbedded();
    const firstApp = createAppFromRuntime(firstRuntime);
    firstApp.addRuntimeContributions(firstRuntime);
    await firstApp.start();
    await firstApp.shutdown();

    const database = createAppDatabaseManager(
      defaultCli.config.get<AppDatabaseConfig>('database')!,
      defaultCli.paths,
    )!;
    try {
      const knex = await database.connection('main').client<Knex>();
      await knex('__nocobase_migrations')
        .where({ name: '001_rows' })
        .update({ package_name: 'app' });
    } finally {
      await database.destroy();
    }

    const restartedRuntime = await resolveEmbedded();
    const restartedApp = createAppFromRuntime(restartedRuntime);
    restartedApp.addRuntimeContributions(restartedRuntime);
    await restartedApp.start();
    await restartedApp.shutdown();

    const beforeRestore = createAppDatabaseManager(
      defaultCli.config.get<AppDatabaseConfig>('database')!,
      defaultCli.paths,
    )!;
    try {
      expect(
        await beforeRestore
          .query('main')
          .selectFrom('rows')
          .selectAll()
          .execute(),
      ).toEqual([]);
    } finally {
      await beforeRestore.destroy();
    }

    const file = join(root, 'legacy-backup.tgz');
    const saved = await createBackup(defaultTarget, { output: file });
    expect(saved.manifest.connections[0]).toMatchObject({
      migrations: {
        history: [{ name: '001_rows', packageName: 'app' }],
      },
    });
    const current = createAppDatabaseManager(
      defaultCli.config.get<AppDatabaseConfig>('database')!,
      defaultCli.paths,
    )!;
    try {
      await current
        .query('main')
        .insertInto('rows')
        .values({ id: 1 })
        .execute();
      expect(
        await current.query('main').selectFrom('rows').selectAll().execute(),
      ).toEqual([{ id: 1 }]);
    } finally {
      await current.destroy();
    }

    await expect(
      verifyBackup(file, { target: defaultTarget }),
    ).resolves.toMatchObject({
      ok: false,
      problems: [{ code: 'RESTORE_MIGRATION_MISMATCH' }],
    });
    await expect(restoreBackup(file, defaultTarget)).rejects.toMatchObject({
      code: 'RESTORE_MIGRATION_MISMATCH',
    });

    const unchanged = createAppDatabaseManager(
      defaultCli.config.get<AppDatabaseConfig>('database')!,
      defaultCli.paths,
    )!;
    try {
      expect(
        await unchanged.query('main').selectFrom('rows').selectAll().execute(),
      ).toEqual([{ id: 1 }]);
    } finally {
      await unchanged.destroy();
    }

    expect(await verifyBackup(file, { target: matchingTarget })).toMatchObject({
      ok: true,
    });
    expect(await restoreBackup(file, matchingTarget)).toMatchObject({
      connections: [{ name: 'main', status: 'restored' }],
    });
    const restored = createAppDatabaseManager(
      matchingCli.config.get<AppDatabaseConfig>('database')!,
      matchingCli.paths,
    )!;
    try {
      expect(
        await restored.query('main').selectFrom('rows').selectAll().execute(),
      ).toEqual([]);
    } finally {
      await restored.destroy();
    }
  } finally {
    await Promise.all([
      defaultCliRuntime.scope.destroy(),
      matchingCliRuntime.scope.destroy(),
    ]);
  }
});

async function application(disks?: AppDriveConfig['disks']) {
  const paths = createAppPaths({ rootDir: root });
  const drive: AppDriveConfig = {
    default: 'local',
    disks: disks ?? {
      local: { driver: 'fs', location: paths.storage(), visibility: 'private' },
    },
  };
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    app: { name: 'backup-test' },
    drive,
    jobs: {
      backends: {
        worker: {
          adapter: 'memory',
          persistence: { path: paths.storage('worker-state') },
        },
      },
    },
    queue: {
      backends: {
        queue: {
          adapter: 'inMemory',
          persistence: { path: paths.storage('queue-state') },
        },
      },
    },
    session: {
      stores: { users: { driver: 'fs', base: paths.storage('session-state') } },
    },
  });
  return { app: new Application({ config, paths }), drive, paths };
}

it('excludes a path on the named disk and preserves it during restore', async () => {
  const uploads = join(root, 'uploads');
  const documents = join(root, 'documents');
  const { app } = await application({
    local: { driver: 'fs', location: uploads, visibility: 'private' },
    documents: { driver: 'fs', location: documents, visibility: 'private' },
  });
  app.config.mergeDefaults({
    backup: { disks: { local: { excludePaths: ['cache'] } } },
  });
  for (const location of [uploads, documents]) {
    await mkdir(join(location, 'cache'), { recursive: true });
    await writeFile(join(location, 'cache/file'), 'original');
  }
  const target = await resolveAppBackupTarget(app);
  const saved = await createBackup(target, {
    output: join(root, 'backup.tgz'),
  });
  expect(saved.manifest.disks).toEqual([
    expect.objectContaining({
      name: 'local',
      count: 0,
      skippedPaths: ['.nocobase-backup', 'cache'],
    }),
    expect.objectContaining({
      name: 'documents',
      count: 1,
      skippedPaths: ['.nocobase-backup'],
    }),
  ]);
  for (const location of [uploads, documents]) {
    await writeFile(join(location, 'cache/file'), 'current');
  }
  await restoreBackup(saved.file, target);
  expect(await readFile(join(uploads, 'cache/file'), 'utf8')).toBe('current');
  expect(await readFile(join(documents, 'cache/file'), 'utf8')).toBe(
    'original',
  );
});

it('rejects exclusions for unknown disks', async () => {
  const { app } = await application();
  app.config.mergeDefaults({
    backup: { disks: { unknown: { excludePaths: ['cache'] } } },
  });
  await expect(resolveAppBackupTarget(app)).rejects.toMatchObject({
    code: 'BACKUP_INVALID_TARGET',
    details: { disk: 'unknown' },
  });
});

it('keeps explicit backup TLS and executable overrides for a database', async () => {
  const { app, paths } = await application();
  app.config.mergeDefaults({
    database: {
      default: 'main',
      connections: {
        main: {
          dialect: 'postgres',
          database: 'example',
          username: 'exporter',
          ssl: { rejectUnauthorized: false },
        },
      },
    },
    backup: { tools: { pgDump: 'tools/pg_dump', psql: 'psql' } },
  });
  const inferred = await resolveAppBackupTarget(app);
  expect(inferred.connections[0]).toMatchObject({ tls: { mode: 'require' } });
  expect(inferred.tools).toEqual({
    pgDump: join(paths.deploymentRootDir, 'tools/pg_dump'),
    psql: 'psql',
  });
  app.config.mergeDefaults({
    database: { connections: { main: { ssl: { ca: 'custom CA' } } } },
  });
  await expect(resolveAppBackupTarget(app)).rejects.toMatchObject({
    code: 'BACKUP_TLS_CONFIG_REQUIRED',
  });
  app.config.mergeDefaults({
    backup: {
      connections: { main: { tls: { mode: 'verify-full', caFile: 'ca.pem' } } },
    },
  });
  expect((await resolveAppBackupTarget(app)).connections[0]).toMatchObject({
    tls: {
      mode: 'verify-full',
      caFile: join(paths.deploymentRootDir, 'ca.pem'),
    },
  });
});

it.each(['../outside', 'escape'] as const)(
  'rejects a disk exclusion that points outside storage: %s',
  async (path) => {
    const { app, paths } = await application();
    const outside = join(root, 'outside');
    await mkdir(paths.storage(), { recursive: true });
    await mkdir(outside);
    await symlink(outside, paths.storage('escape'), 'junction');
    await writeFile(join(outside, 'keep'), 'unchanged');
    const saved = await createBackup(await resolveAppBackupTarget(app), {
      output: join(root, 'initial.tgz'),
    });
    app.config.mergeDefaults({
      backup: { disks: { local: { excludePaths: [path] } } },
    });
    const target = await resolveAppBackupTarget(app);
    const output = join(root, 'invalid.tgz');
    await expect(createBackup(target, { output })).rejects.toMatchObject({
      code: 'BACKUP_UNSAFE_PATH',
    });
    await expect(access(output)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(restoreBackup(saved.file, target)).rejects.toMatchObject({
      code: 'BACKUP_UNSAFE_PATH',
    });
    expect(await readFile(join(outside, 'keep'), 'utf8')).toBe('unchanged');
  },
);

it('keeps configured jobs, queue and session persistence outside the archive and restore', async () => {
  const { app, paths } = await application();
  const runtime = ['worker-state', 'queue-state', 'session-state'];
  for (const path of runtime) {
    await mkdir(paths.storage(path), { recursive: true });
    await writeFile(join(paths.storage(path), 'state'), 'runtime 1');
  }
  await writeFile(paths.storage('upload'), 'upload 1');
  const target = await resolveAppBackupTarget(app);
  const output = join(root, 'exports');
  await mkdir(output);
  const saved = await createBackup(target, {
    output: join(output, 'backup.tgz'),
  });
  expect(saved.manifest.disks[0]).toMatchObject({
    count: 1,
    skippedPaths: expect.arrayContaining(runtime),
  });
  for (const path of runtime)
    await writeFile(join(paths.storage(path), 'state'), 'runtime 2');
  await writeFile(paths.storage('upload'), 'upload 2');
  await restoreBackup(saved.file, target, { filesOnly: true });
  for (const path of runtime)
    expect(await readFile(join(paths.storage(path), 'state'), 'utf8')).toBe(
      'runtime 2',
    );
  expect(await readFile(paths.storage('upload'), 'utf8')).toBe('upload 1');
});

it('rejects factory disks even when excluded from a parent disk backup', async () => {
  const { app, paths } = await application({
    local: {
      driver: 'fs',
      location: join(root, 'storage'),
      visibility: 'private',
    },
    factory: () =>
      createDriveManager({
        default: 'nested',
        disks: {
          nested: {
            driver: 'fs',
            location: join(root, 'storage', 'nested'),
            visibility: 'private',
          },
        },
      }).use().driver,
  });
  await mkdir(paths.storage('nested'), { recursive: true });
  await writeFile(join(paths.storage('nested'), 'private'), 'keep separate');
  const output = join(root, 'backup.tgz');
  await expect(
    resolveAppBackupTarget(app).then((target) =>
      createBackup(target, { output, excludeDisks: ['factory'] }),
    ),
  ).rejects.toMatchObject({
    code: 'BACKUP_DISK_METADATA_REQUIRED',
    details: { disk: 'factory' },
  });
  await expect(access(output)).rejects.toMatchObject({ code: 'ENOENT' });
});

const nestedDisks = (): AppDriveConfig['disks'] => ({
  local: {
    driver: 'fs',
    location: join(root, 'storage'),
    visibility: 'private',
  },
  artifacts: {
    driver: 'fs',
    location: join(root, 'storage', 'deployment', 'artifacts'),
    visibility: 'private',
  },
});

it('archives the parent disk while a deployment artifact on the excluded disk is replaced', async () => {
  const { app, drive } = await application(nestedDisks());
  const manager = createDriveManager(drive);
  const local = manager.use('local');
  const artifacts = manager.use('artifacts');
  await local.put('upload', 'retained');
  await local.put('worker-state/queue.bin', 'old');
  await artifacts.put('install.zip', 'old');
  const target = await resolveAppBackupTarget(app);
  const output = join(root, 'exports');
  await mkdir(output);
  const result = await createBackup(
    {
      ...target,
      withDeferredDeletes: (names, capture, findCapturedDisk) =>
        target.withDeferredDeletes!(
          names,
          async () => {
            await capture();
            await artifacts.put('install.zip', 'new');
            await local.put('worker-state/queue.bin', 'new');
          },
          findCapturedDisk,
        ),
    },
    { output: join(output, 'backup.tgz'), excludeDisks: ['artifacts'] },
  );
  expect(await readdir(output)).toEqual(['backup.tgz']);
  expect(result.manifest.disks).toEqual([
    expect.objectContaining({
      name: 'local',
      count: 1,
      skippedPaths: expect.arrayContaining([
        'deployment/artifacts',
        'worker-state',
      ]),
    }),
    expect.objectContaining({ name: 'artifacts', mode: 'excluded' }),
  ]);
  expect(await artifacts.get('install.zip')).toBe('new');
  expect(await local.get('worker-state/queue.bin')).toBe('new');
});

it('rejects publication when a separate process overwrites a selected child through its parent and restores matching bytes on retry', async () => {
  const { app, drive, paths } = await application(nestedDisks());
  const parent = createDriveManager(drive).use('local');
  const key = 'deployment/artifacts/upload';
  await parent.put(key, 'v1');
  const database = {
    drivers: { sqlite },
    default: 'main',
    connections: {
      main: {
        dialect: 'sqlite' as const,
        filename: paths.storage('data.sqlite'),
      },
    },
  };
  app.config.mergeDefaults({ database });
  const writeVersion = async (version: string) => {
    const db = createAppDatabaseManager(database, paths)!;
    try {
      await db
        .query('main')
        .updateTable('uploads')
        .set({ version })
        .where('key', '=', 'upload')
        .execute();
    } finally {
      await db.destroy();
    }
  };
  const db = createAppDatabaseManager(database, paths)!;
  try {
    await db.connection('main').builder.createCollection('uploads', (table) => {
      table.increments('id');
      table.string('disk');
      table.string('key');
      table.string('version');
    });
    await db
      .query('main')
      .insertInto('uploads')
      .values({ disk: 'artifacts', key: 'upload', version: 'v1' })
      .execute();
  } finally {
    await db.destroy();
  }
  const target = await resolveAppBackupTarget(app);
  const [connection] = target.connections;
  if (!connection)
    throw new Error('The fixture requires an SQLite connection.');
  const output = join(root, 'exports');
  await mkdir(output);
  const archive = join(output, 'backup.tgz');
  await expect(
    createBackup(
      {
        ...target,
        connections: [
          {
            ...connection,
            async *readFileReferences(reader) {
              for await (const row of reader.readRows({ name: 'uploads' }, [
                'version',
              ]))
                expect(row.version).toBe('v1');
              await promisify(execFile)(
                process.execPath,
                [
                  '--import',
                  'tsx',
                  '--input-type=module',
                  '-e',
                  `import { createDriveManager } from '@nocobase/drive';
const [location, key] = process.argv.slice(1);
const disk = createDriveManager({ default: 'local', disks: { local: { driver: 'fs', location, visibility: 'private' } } }).use();
await disk.put(key, 'v2');`,
                  paths.storage(),
                  key,
                ],
                { cwd: fileURLToPath(new URL('..', import.meta.url)) },
              );
              await writeVersion('v2');
              yield* connection.readFileReferences!(reader);
            },
          },
        ],
      },
      { output: archive, includeDisks: ['artifacts'] },
    ),
  ).rejects.toMatchObject({
    code: 'BACKUP_FILE_CHANGED',
    details: { disks: ['artifacts'] },
  });
  expect(await parent.get(key)).toBe('v2');
  expect(await readdir(output)).toEqual([]);
  await createBackup(target, { output: archive, includeDisks: ['artifacts'] });
  await parent.put(key, 'v3');
  await writeVersion('v3');
  expect((await restoreBackup(archive, target)).missingFiles).toEqual([]);
  const restored = createAppDatabaseManager(database, paths)!;
  try {
    const row = await restored
      .query('main')
      .selectFrom('uploads')
      .selectAll()
      .executeTakeFirstOrThrow();
    expect(row).toMatchObject({
      disk: 'artifacts',
      key: 'upload',
      version: 'v2',
    });
    expect(await parent.get(key)).toBe(row.version);
  } finally {
    await restored.destroy();
  }
});
