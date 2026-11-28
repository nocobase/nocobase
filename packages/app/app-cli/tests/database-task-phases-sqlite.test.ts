// SQLite-only: real CLI previews must not create missing storage or parent directories.
// @vitest-environment node
import { existsSync, watch } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Application, resolveAppBackupTarget } from '@nocobase/app-server';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { createBackup, restoreBackup } from '@nocobase/backup';
import { testDatabaseDialect } from '@nocobase/db-testing';
import { expect, it } from 'vitest';
import { createDatabasePhasesFixture } from './database-phases-fixture.ts';

it.skipIf(testDatabaseDialect() !== 'sqlite')(
  'previews missing storage through the real CLI without running preparation hooks',
  async () => {
    const f = await createDatabasePhasesFixture({ missingStorage: true });
    try {
      f.sources('main');
      for (const command of ['apply', 'reset']) {
        const result = await f.run(['db', command, '--all', '--dry-run']);
        expect(result.exitCode).toBe(0);
        expect(result.document).toMatchObject({
          ok: true,
          status: 'success-noop',
        });
        expect(result.events).toEqual(['shutdown:resources']);
        for (const file of f.storageFiles) {
          expect(existsSync(file)).toBe(false);
          expect(existsSync(path.dirname(file))).toBe(false);
        }
      }
    } finally {
      await f.close();
    }
  },
  30_000,
);

it.skipIf(testDatabaseDialect() !== 'sqlite')(
  'keeps subprocess database maintenance and restore mutually exclusive through shutdown and permits dry runs',
  async () => {
    const f = await createDatabasePhasesFixture();
    const paths = createAppPaths({ rootDir: f.root });
    const files = paths.storage('uploads');
    const exports = path.join(f.root, 'exports');
    const resumeMaintenance = path.join(f.root, 'maintenance-resume');
    const maintenancePaused = path.join(f.root, 'maintenance-paused');
    try {
      f.sources('main');
      await mkdir(files, { recursive: true });
      await mkdir(exports);
      const upload = path.join(files, 'file');
      await writeFile(upload, 'archive');
      const config = new AppConfig();
      await config.loadAll();
      config.mergeDefaults({
        app: { name: 'database-phases-fixture' },
        drive: {
          default: 'local',
          disks: {
            local: { driver: 'fs', location: files, visibility: 'private' },
          },
        },
      });
      const target = await resolveAppBackupTarget(
        new Application({ config, paths }),
      );
      const saved = await createBackup(target, {
        output: path.join(exports, 'backup.tgz'),
        online: false,
      });
      await writeFile(upload, 'before restore');

      // Subscribe before starting the CLI so even a fast shutdown hook cannot be missed.
      const paused = Promise.withResolvers<void>();
      const watcher = watch(f.root, () => {
        if (existsSync(maintenancePaused)) paused.resolve();
      });
      watcher.on('error', paused.reject);
      const maintenance = f.run(['db', 'apply'], {
        FIXTURE_PAUSE_SHUTDOWN: '1',
      });
      try {
        await Promise.race([
          paused.promise,
          maintenance.then(({ exitCode, stdout, stderr }) => {
            throw new Error(
              `db apply exited before pausing at shutdown (code ${exitCode}): ${stderr || stdout}`,
            );
          }),
        ]);
        const refused = await f.run(['backup', 'restore', saved.file]);
        expect(refused.document).toMatchObject({
          ok: false,
          error: { code: 'RESTORE_APP_RUNNING' },
        });
        expect(await readFile(upload, 'utf8')).toBe('before restore');
      } finally {
        watcher.close();
        await writeFile(resumeMaintenance, '');
        await maintenance;
      }
      expect((await maintenance).exitCode).toBe(0);

      const held = Promise.withResolvers<void>();
      const resumeRestore = Promise.withResolvers<void>();
      const restore = restoreBackup(
        saved.file,
        {
          ...target,
          withStoppedApp: (operation) =>
            target.withStoppedApp!(async () => {
              held.resolve();
              await resumeRestore.promise;
              return operation();
            }),
        },
        { filesOnly: true },
      );
      try {
        await Promise.race([held.promise, restore]);
        const refused = await f.run(['db', 'reset', '--force']);
        expect(refused.document).toMatchObject({
          ok: false,
          error: { code: 'RESTORE_IN_PROGRESS' },
        });
        expect(refused.events).not.toContain('reset:main');
        expect((await f.run(['db', 'apply', '--dry-run'])).exitCode).toBe(0);
        expect(await readFile(upload, 'utf8')).toBe('before restore');
      } finally {
        resumeRestore.resolve();
        await restore;
      }
      expect(await readFile(upload, 'utf8')).toBe('archive');
      expect((await f.run(['db', 'apply'])).exitCode).toBe(0);
    } finally {
      await f.close();
    }
  },
  90_000,
);
