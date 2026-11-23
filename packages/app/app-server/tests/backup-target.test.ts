// db-test-portability: sqlite-only — backup and restore need a file-backed SQLite database.
import { execFile } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createBackup, restoreBackup, verifyBackup } from '@nocobase/backup';
import sqlite from '@nocobase/db-sqlite';
import { createDriveManager, type AppDriveConfig } from '@nocobase/drive';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { Application } from '../src/application/index.js';
import { resolveAppBackupTarget } from '../src/backup/target.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  createAppDatabaseManager,
  DatabaseProvider,
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

it.each(['embedded', 'standalone'] as const)(
  'verifies and restores a backup made after %s startup from a built release',
  async (mode) => {
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
                packageName: mode === 'embedded' ? 'app' : packageName,
              },
            ],
          },
        });
        expect(await verifyBackup(file, { target })).toMatchObject({
          ok: true,
        });
      } finally {
        await app.shutdown();
      }
      expect(await restoreBackup(file, target)).toMatchObject({
        connections: [{ name: 'main', status: 'restored' }],
      });
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
