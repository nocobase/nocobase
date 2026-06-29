/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as cp from 'child_process';
import archiver from 'archiver';
import path from 'path';
import { storagePathJoin } from '@nocobase/utils';
import { BACKUP_EXTENSION, getDBVersion, SETTINGS } from '../../utils';
import { getApp } from '..';
import fs from 'fs';
import { MockServer, sleep } from '@nocobase/test/server';
import { BackupManager, BackupSettings } from '../../managers/backup';
import { RestoreManager } from '../../managers/restore';
import backupCliResource from '../../resourcers/backup-cli';
import backupsResource from '../../resourcers/backups';
import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

let mockExecImplementation = (command, _options, callback) => {
  callback(null, 'done');
};

let mockSpawnImplementation = (_command?: string, _args?: string[]) => {
  const stdout = Readable.from(['mocked database backup']);
  const stderr = Readable.from([]);
  const stdin = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const childProcess = new EventEmitter() as any;
  childProcess.stdout = stdout;
  childProcess.stderr = stderr;
  childProcess.stdin = stdin;
  setImmediate(() => {
    childProcess.emit('exit', 0);
    childProcess.emit('close', 0);
  });
  return childProcess;
};

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof cp>();
  return {
    ...actual,
    execSync: vi.fn(),
    exec: vi
      .fn()
      .mockImplementation((command, options, callback) => mockExecImplementation(command, options, callback)),
    spawn: vi.fn().mockImplementation((command, args, options) => mockSpawnImplementation(command, args, options)),
  };
});

const backupFilesFolder = storagePathJoin('backups', 'main');
const schemaMismatchBackupFilePath = path.join(backupFilesFolder, `backup_schema_mismatch.${BACKUP_EXTENSION}`);
const createdBackupFilePaths = new Set<string>();

async function createBackupArchive(filePath: string, metadata: Record<string, any>) {
  createdBackupFilePaths.add(filePath);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.append('mocked database backup', { name: 'data' });
    archive.append(JSON.stringify(metadata, null, 2), { name: '_metadata.json' });
    archive.finalize().catch(reject);
  });
}

function createBackupFile(caseName: string) {
  const backupFileBaseName = `backup_${caseName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const backupFilePath = path.join(backupFilesFolder, `${backupFileBaseName}.${BACKUP_EXTENSION}`);
  createdBackupFilePaths.add(backupFilePath);
  return {
    backupFileBaseName,
    backupFilePath,
  };
}

describe('RestoreManager', () => {
  let app: MockServer;
  const defaultBackupSettings: BackupSettings = {
    scheduled: false,
    cron: '',
    encryptionPassword: '',
    enableFilesBackup: false,
    keep: 10,
  };

  beforeEach(async () => {
    app = await getApp();
    await fs.promises.mkdir(backupFilesFolder, { recursive: true });
    await fs.promises.unlink(schemaMismatchBackupFilePath).catch(() => {});

    mockExecImplementation = (command, _options, callback) => {
      if (command.includes('-f')) {
        // mock the command to create a backup file
        const cmds = command.split(' ');
        const fIndex = cmds.indexOf('-f');
        const fileName = cmds[fIndex + 1];
        if (fileName) {
          fs.writeFileSync(fileName, 'mocked database backup');
        }
      }
      if (command.includes('psql') || command.includes('mysql') || command.includes('pg_restore')) {
        // simulate restore side effect: clear the encryption password
        app.db
          .getRepository(SETTINGS)
          .update({
            values: { encryptionPassword: '' },
            filter: { id: 1 },
          })
          .catch(() => {});
      }
      callback(null, 'done');
    };

    mockSpawnImplementation = (command) => {
      if (
        ['psql', 'pg_restore', 'ksql', 'sys_restore', 'mysql'].some((restoreCommand) =>
          String(command).includes(restoreCommand),
        )
      ) {
        // simulate restore side effect: clear the encryption password
        app.db
          .getRepository(SETTINGS)
          .update({
            values: { encryptionPassword: '' },
            filter: { id: 1 },
          })
          .catch(() => {});
      }
      const stdout = Readable.from(['mocked database backup']);
      const stderr = Readable.from([]);
      const stdin = new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      });
      const childProcess = new EventEmitter() as any;
      childProcess.stdout = stdout;
      childProcess.stderr = stderr;
      childProcess.stdin = stdin;
      setImmediate(() => {
        childProcess.emit('exit', 0);
        childProcess.emit('close', 0);
      });
      return childProcess;
    };
  });

  afterEach(async () => {
    await app.destroy();
    for (const backupFilePath of createdBackupFilePaths) {
      await fs.promises.unlink(backupFilePath).catch(() => {});
    }
    createdBackupFilePaths.clear();
  });

  afterAll(async () => {
    fs.promises.unlink(schemaMismatchBackupFilePath).catch(() => {});
  });

  function createMetadata(database: Record<string, any> = {}) {
    return {
      enableFilesBackup: false,
      version: app.getPackageVersion(),
      database: {
        dialect: 'postgres',
        underscored: false,
        tablePrefix: '',
        schema: 'source_schema',
        version: 'PostgreSQL 16.1',
        backupClientVersion: 'pg_dump (PostgreSQL) 16.1',
        ...database,
      },
      plugins: [],
    };
  }

  async function createMetadataCompatibleWithCurrentDb(database: Record<string, any> = {}) {
    const version = await getDBVersion(app.db);
    return createMetadata({
      version,
      backupClientVersion: version,
      ...database,
    });
  }

  function createCtx(requestBody: Record<string, any> = {}) {
    return {
      app,
      logger: app.logger,
      i18n: app.i18n,
      request: {
        body: requestBody,
      },
    };
  }

  function createStatusCache() {
    return {
      set: vi.fn().mockResolvedValue(undefined),
    };
  }

  function createResourceApp(statusCache: ReturnType<typeof createStatusCache>) {
    return {
      name: 'main',
      db: {
        options: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      },
      cacheManager: {
        getCache: vi.fn().mockReturnValue(statusCache),
      },
    };
  }

  it('restoreFromBackup', async () => {
    const { backupFileBaseName, backupFilePath } = createBackupFile('restore-from-backup');
    await fs.promises.writeFile(backupFilePath, 'mocked backup file');
    const ctx = {
      app: app,
      logger: app.logger,
      i18n: app.i18n,
    };
    const restoreManager = new RestoreManager(ctx);
    const restoreSpy = vi.spyOn(restoreManager, 'restore').mockResolvedValue(undefined);
    await restoreManager.restoreFromBackup(`${backupFileBaseName}.${BACKUP_EXTENSION}`, 'task_id');
    expect(restoreSpy).toHaveBeenCalled();
  });

  it('restoreFromBackup should reject sibling files that only match the backup directory prefix', async () => {
    const ctx = {
      app,
      logger: app.logger,
      i18n: app.i18n,
    };
    const restoreManager = new RestoreManager(ctx);
    const siblingDir = path.join(path.dirname(backupFilesFolder), 'main_evil');
    const siblingFileName = `prefix-collision.${BACKUP_EXTENSION}`;
    const siblingFilePath = path.join(siblingDir, siblingFileName);

    try {
      await fs.promises.mkdir(siblingDir, { recursive: true });
      await fs.promises.writeFile(siblingFilePath, 'malicious sibling file');

      await expect(restoreManager.restoreFromBackup(`../main_evil/${siblingFileName}`, 'task_id')).rejects.toThrow(
        /(FILE_NOT_FOUND|not found)/,
      );
    } finally {
      await fs.promises.unlink(siblingFilePath).catch(() => {});
      await fs.promises.rm(siblingDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it('restoreFromUpload', async () => {
    const { backupFilePath } = createBackupFile('restore-from-upload');
    await fs.promises.writeFile(backupFilePath, 'mocked backup file');
    const ctx = {
      app: app,
      logger: app.logger,
      i18n: app.i18n,
    };
    const restoreManager = new RestoreManager(ctx);
    const restoreSpy = vi.spyOn(restoreManager, 'restore').mockResolvedValue(undefined);
    await restoreManager.restoreFromUpload(
      {
        path: backupFilePath,
      } as unknown as Express.Multer.File,
      'task_id',
    );
    expect(restoreSpy).toHaveBeenCalled();
  });

  it('restore', async () => {
    const { backupFilePath } = createBackupFile('restore');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb());
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue({} as any);
    const ctx = {
      app: app,
      logger: app.logger,
      i18n: app.i18n,
    };
    let settings = await app.db.getRepository(SETTINGS).findOne();
    // before the restore, the backup encryption should be disabled
    expect(settings.encryptionPassword).toBe('');
    await app.db
      .getRepository(SETTINGS)
      .update({ values: { encryptionPassword: '123456' }, filterByTk: settings.get('id') });
    // update the settings to enable the backup encryption
    settings = await app.db.getRepository(SETTINGS).findOne();
    expect(settings.encryptionPassword).toBe('123456');

    const restoreManager = new RestoreManager(ctx, {
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 5432,
      schema: 'source_schema',
    });
    await restoreManager.restore(backupFilePath, 'task_id');
    await vi.waitFor(() => {
      expect(runCommandSpy).toHaveBeenCalledWith('upgrade');
    });
    settings = await app.db.getRepository(SETTINGS).findOne();
    // after the restore, the backup encryption should be disabled
    expect(settings.encryptionPassword).toBe('');
  });

  it('restore with tolerentMode', async () => {
    const { backupFilePath } = createBackupFile('restore-tolerent-mode');
    await createBackupArchive(backupFilePath, createMetadata());
    const ctx = {
      app: app,
      logger: app.logger,
      i18n: app.i18n,
    };
    let settings = await app.db.getRepository(SETTINGS).findOne();
    // before the restore, the backup encryption should be disabled
    expect(settings.encryptionPassword).toBe('');
    await app.db
      .getRepository(SETTINGS)
      .update({ values: { encryptionPassword: '123456' }, filterByTk: settings.get('id') });
    // update the settings to enable the backup encryption
    settings = await app.db.getRepository(SETTINGS).findOne();
    expect(settings.encryptionPassword).toBe('123456');

    const restoreManager = new RestoreManager(ctx, {
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 5432,
      schema: 'source_schema',
    });
    const tolerentMode = true;
    const runCommandSpy = vi
      .spyOn(app, 'runCommand')
      .mockRejectedValueOnce(new Error('some errors happend and ignored'))
      .mockResolvedValue({} as any);
    await restoreManager.restore(backupFilePath, 'task_id', undefined, tolerentMode);
    await vi.waitFor(() => {
      expect(runCommandSpy).toHaveBeenCalledTimes(2);
    });
    settings = await app.db.getRepository(SETTINGS).findOne();
    // after the restore, the backup encryption should be disabled
    expect(settings.encryptionPassword).toBe('');
  });

  it('throws on PostgreSQL schema mismatch by default', async () => {
    await createBackupArchive(schemaMismatchBackupFilePath, createMetadata());
    const restoreManager = new RestoreManager(createCtx(), {
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 5432,
      schema: 'target_schema',
    });

    await expect(
      restoreManager.restore(schemaMismatchBackupFilePath, 'task_id', undefined, true, true),
    ).rejects.toThrow(/database schema mismatch/i);
  });

  it('allows PostgreSQL schema mismatch with force schema restore', async () => {
    vi.spyOn(app, 'runCommand').mockReturnValue({} as any);
    await createBackupArchive(schemaMismatchBackupFilePath, createMetadata());
    const restoreManager = new RestoreManager(createCtx(), {
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 5432,
      schema: 'target_schema',
    });

    await expect(
      restoreManager.restore(schemaMismatchBackupFilePath, 'task_id', undefined, true, true, {
        forceSchemaRestore: true,
      }),
    ).resolves.toBeUndefined();
    await sleep(3000);
    expect(app.runCommand).toHaveBeenCalledWith('upgrade');
  });

  it('allows Kingbase schema mismatch with force schema restore', async () => {
    vi.spyOn(app, 'runCommand').mockReturnValue({} as any);
    await createBackupArchive(
      schemaMismatchBackupFilePath,
      createMetadata({
        dialect: 'kingbase',
        toolchain: 'kingbase',
        version: 'KingbaseES V009R001C010',
        backupClientVersion: 'sys_dump (KingbaseES) V009R001C010',
      }),
    );
    const restoreManager = new RestoreManager(createCtx(), {
      dialect: 'kingbase',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 54321,
      schema: 'target_schema',
    });

    await expect(
      restoreManager.restore(schemaMismatchBackupFilePath, 'task_id', undefined, true, true, {
        forceSchemaRestore: true,
      }),
    ).resolves.toBeUndefined();
    await sleep(3000);
    expect(app.runCommand).toHaveBeenCalledWith('upgrade');
  });

  it('infers PostgreSQL toolchain for legacy Kingbase backups created by pg_dump', async () => {
    const { backupFilePath } = createBackupFile('kingbase-pg-toolchain');
    await createBackupArchive(
      backupFilePath,
      createMetadata({
        dialect: 'kingbase',
        schema: 'source_schema',
        version: 'KingbaseES V009R001C010',
        backupClientVersion: 'pg_dump (PostgreSQL) 17.2',
      }),
    );
    const mockedSpawn = cp.spawn as unknown as Mock;
    mockedSpawn.mockClear();
    const restoreManager = new RestoreManager(createCtx(), {
      dialect: 'kingbase',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 54321,
      schema: 'source_schema',
    });

    await restoreManager.restore(backupFilePath, 'task_id', undefined, true, true);

    await vi.waitFor(() => {
      expect(mockedSpawn.mock.calls.some(([command]) => String(command).includes('pg_restore'))).toBe(true);
    });
    expect(mockedSpawn.mock.calls.some(([, , options]) => options.env?.PGPASSWORD === 'test')).toBe(true);
  });

  it('does not ignore dialect mismatch with force schema restore', async () => {
    await createBackupArchive(schemaMismatchBackupFilePath, createMetadata({ dialect: 'mysql' }));
    const restoreManager = new RestoreManager(createCtx(), {
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 5432,
      schema: 'target_schema',
    });

    await expect(
      restoreManager.restore(schemaMismatchBackupFilePath, 'task_id', undefined, true, true, {
        forceSchemaRestore: true,
      }),
    ).rejects.toThrow(/database dialect mismatch/i);
  });

  it('passes force from backup CLI API to restore manager', async () => {
    const restoreSpy = vi.spyOn(RestoreManager.prototype, 'restore').mockResolvedValue(undefined);
    const next = vi.fn();
    const ctx = {
      app: createResourceApp(createStatusCache()),
      action: {
        params: {
          name: `backup.${BACKUP_EXTENSION}`,
          force: 'true',
        },
      },
      request: {
        body: {},
      },
      throw: (_status: number, message: string) => {
        throw new Error(message);
      },
    };

    await backupCliResource.actions.restore(ctx as any, next);

    expect(restoreSpy).toHaveBeenCalledWith(
      path.resolve(storagePathJoin('backups', 'main'), `backup.${BACKUP_EXTENSION}`),
      expect.any(String),
      undefined,
      true,
      false,
      {
        forceSchemaRestore: true,
      },
    );
    expect(next).toHaveBeenCalled();
    restoreSpy.mockRestore();
  });

  it('marks backups restore task as failed when restoreFromBackup rejects early', async () => {
    const statusCache = createStatusCache();
    const restoreSpy = vi
      .spyOn(RestoreManager.prototype, 'restoreFromBackup')
      .mockRejectedValue(new Error('Invalid backup name'));
    const ctx = {
      app: createResourceApp(statusCache),
      request: {
        body: {
          name: `backup.${BACKUP_EXTENSION}`,
          password: 'secret',
        },
      },
    };

    await expect(backupsResource.actions.restore(ctx as any, vi.fn())).rejects.toThrow('Invalid backup name');

    const taskId = statusCache.set.mock.calls[0][0];
    expect(statusCache.set).toHaveBeenNthCalledWith(1, taskId, {
      inProgress: true,
    });
    expect(statusCache.set).toHaveBeenNthCalledWith(2, taskId, {
      inProgress: false,
      message: 'Invalid backup name',
    });

    restoreSpy.mockRestore();
  });

  it('marks backups upload restore task as failed when restoreFromUpload rejects early', async () => {
    const taskId = 'backups-upload';
    const uploadPath = path.join(backupFilesFolder, `${taskId}.${BACKUP_EXTENSION}`);
    await fs.promises.writeFile(uploadPath, 'temp backup upload');

    const statusCache = createStatusCache();
    const restoreSpy = vi
      .spyOn(RestoreManager.prototype, 'restoreFromUpload')
      .mockRejectedValue(new Error('Invalid upload file'));
    const ctx = {
      app: createResourceApp(statusCache),
      request: {
        file: {
          path: uploadPath,
        },
        body: {
          password: 'secret',
        },
      },
    };

    await expect(backupsResource.actions.upload(ctx as any, vi.fn())).rejects.toThrow('Invalid upload file');

    const restoreTaskId = statusCache.set.mock.calls[0][0];
    expect(statusCache.set).toHaveBeenNthCalledWith(1, restoreTaskId, {
      inProgress: true,
    });
    expect(statusCache.set).toHaveBeenNthCalledWith(2, restoreTaskId, {
      inProgress: false,
      message: 'Invalid upload file',
    });
    expect(fs.existsSync(uploadPath)).toBe(false);

    restoreSpy.mockRestore();
  });

  it('marks backup CLI restore task as failed when backup name validation fails early', async () => {
    const statusCache = createStatusCache();
    const ctx = {
      app: createResourceApp(statusCache),
      action: {
        params: {
          name: `../backup.${BACKUP_EXTENSION}`,
        },
      },
      request: {
        body: {},
      },
      throw: (_status: number, message: string) => {
        throw new Error(message);
      },
    };

    await expect(backupCliResource.actions.restore(ctx as any, vi.fn())).rejects.toThrow('Invalid backup name');

    const taskId = statusCache.set.mock.calls[0][0];
    expect(statusCache.set).toHaveBeenNthCalledWith(1, taskId, {
      inProgress: true,
    });
    expect(statusCache.set).toHaveBeenNthCalledWith(2, taskId, {
      inProgress: false,
      message: 'Invalid backup name',
    });
  });

  it('marks backup CLI upload restore task as failed when restore rejects early', async () => {
    const taskId = 'backup-cli-upload';
    const uploadPath = path.join(backupFilesFolder, `${taskId}.${BACKUP_EXTENSION}`);
    await fs.promises.writeFile(uploadPath, 'temp backup upload');

    const statusCache = createStatusCache();
    const restoreSpy = vi
      .spyOn(RestoreManager.prototype, 'restore')
      .mockRejectedValue(new Error('Invalid backup file'));
    const ctx = {
      app: createResourceApp(statusCache),
      action: {
        params: {},
      },
      request: {
        body: {},
        file: {
          path: uploadPath,
        },
      },
    };

    await expect(backupCliResource.actions.restoreUpload(ctx as any, vi.fn())).rejects.toThrow('Invalid backup file');

    const restoreTaskId = statusCache.set.mock.calls[0][0];
    expect(statusCache.set).toHaveBeenNthCalledWith(1, restoreTaskId, {
      inProgress: true,
    });
    expect(statusCache.set).toHaveBeenNthCalledWith(2, restoreTaskId, {
      inProgress: false,
      message: 'Invalid backup file',
    });
    expect(fs.existsSync(uploadPath)).toBe(false);

    restoreSpy.mockRestore();
  });
});
