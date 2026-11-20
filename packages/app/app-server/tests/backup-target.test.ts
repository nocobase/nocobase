import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBackup, restoreBackup } from '@nocobase/backup';
import { createDriveManager, type AppDriveConfig } from '@nocobase/drive';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { Application } from '../src/application/index.js';
import { resolveAppBackupTarget } from '../src/backup/target.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'app-backup-target-'));
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: 'backup-test', version: '1.0.0' }),
  );
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
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

it('discards a backup on an overlapping disk write and lets the next backup publish', async () => {
  const { app, drive } = await application({
    local: {
      driver: 'fs',
      location: join(root, 'storage'),
      visibility: 'private',
    },
    nested: {
      driver: 'fs',
      location: join(root, 'storage', 'nested'),
      visibility: 'private',
    },
  });
  const parent = createDriveManager(drive).use('local');
  await parent.put('nested/upload', 'v1');
  const target = await resolveAppBackupTarget(app);
  const output = join(root, 'exports');
  await mkdir(output);
  const archive = join(output, 'backup.tgz');
  await expect(
    createBackup(
      {
        ...target,
        withDeferredDeletes: (names, capture) =>
          target.withDeferredDeletes!(names, async () => {
            await capture();
            await parent.put('nested/upload', 'v2');
          }),
      },
      { output: archive, includeDisks: ['nested'] },
    ),
  ).rejects.toMatchObject({
    code: 'BACKUP_FILE_CHANGED',
    details: { disks: ['local'] },
  });
  expect(await parent.get('nested/upload')).toBe('v2');
  expect(await readdir(output)).toEqual([]);
  await createBackup(target, { output: archive, includeDisks: ['nested'] });
  await parent.put('nested/upload', 'v3');
  await restoreBackup(archive, target, { filesOnly: true });
  expect(await parent.get('nested/upload')).toBe('v2');
});
