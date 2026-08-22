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
import { BACKUP_EXTENSION, ENCRYPTION_FIELD_KEYS_DIRECTORY, getDBVersion, SETTINGS } from '../../utils';
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
    spawnSync: vi.fn().mockReturnValue({ status: 0, stdout: 'PostgreSQL 16.1', stderr: '' }),
    exec: vi
      .fn()
      .mockImplementation((command, options, callback) => mockExecImplementation(command, options, callback)),
    spawn: vi.fn().mockImplementation((command, args, options) => mockSpawnImplementation(command, args, options)),
  };
});

const restoreAppName = 'restore-manager-unit-tests';
const backupFilesFolder = storagePathJoin('backups', restoreAppName);
const schemaMismatchBackupFilePath = path.join(backupFilesFolder, `backup_schema_mismatch.${BACKUP_EXTENSION}`);
const encryptionFieldKeysFolder = storagePathJoin('apps', restoreAppName, ENCRYPTION_FIELD_KEYS_DIRECTORY);
const encryptionFieldKeysParentFolder = path.dirname(encryptionFieldKeysFolder);
const restoreTempFolder = storagePathJoin('tmp', 'backups', restoreAppName);
const createdBackupFilePaths = new Set<string>();
const sourceEncryptionFieldKey = Buffer.alloc(32, 1).toString('base64');
const existingEncryptionFieldKey = Buffer.alloc(32, 2).toString('base64');
const tolerentModeUploadFileName = `${restoreAppName}-tolerent-mode.txt`;
const tolerentModeUploadFilePath = storagePathJoin('uploads', tolerentModeUploadFileName);

async function createBackupArchive(
  filePath: string,
  metadata: Record<string, unknown>,
  extraFiles: Record<string, string> = {},
) {
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
    for (const [name, content] of Object.entries(extraFiles)) {
      archive.append(content, { name });
    }
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

async function expectNoExtractedDirectory(backupFileBaseName: string) {
  const entries = await fs.promises.readdir(restoreTempFolder, { withFileTypes: true }).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  });
  expect(entries.some((entry) => entry.isDirectory() && entry.name.startsWith(`${backupFileBaseName}-`))).toBe(false);
}

async function findEncryptionFieldKeysReplacementDirectories() {
  const entries = await fs.promises.readdir(encryptionFieldKeysParentFolder, { withFileTypes: true }).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  });
  return entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        (entry.name.startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`) ||
          entry.name.startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-`)),
    )
    .map((entry) => path.join(encryptionFieldKeysParentFolder, entry.name));
}

async function cleanupEncryptionFieldKeysReplacementDirectories() {
  const directories = await findEncryptionFieldKeysReplacementDirectories();
  await Promise.all(directories.map((directory) => fs.promises.rm(directory, { recursive: true, force: true })));
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
    app = await getApp({ name: restoreAppName });
    await fs.promises.mkdir(backupFilesFolder, { recursive: true });
    await fs.promises.unlink(schemaMismatchBackupFilePath).catch(() => {});
    await fs.promises.rm(encryptionFieldKeysFolder, { recursive: true, force: true });
    await cleanupEncryptionFieldKeysReplacementDirectories();
    await fs.promises.rm(restoreTempFolder, { recursive: true, force: true });
    await fs.promises.rm(tolerentModeUploadFilePath, { force: true });

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
    await fs.promises.rm(encryptionFieldKeysFolder, { recursive: true, force: true });
    await cleanupEncryptionFieldKeysReplacementDirectories();
    await fs.promises.rm(restoreTempFolder, { recursive: true, force: true });
    await fs.promises.rm(tolerentModeUploadFilePath, { force: true });
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

  function createRestoreManager() {
    return new RestoreManager(createCtx(), {
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      database: 'test',
      host: 'localhost',
      port: 5432,
      schema: 'source_schema',
    });
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
    const siblingDirectoryName = `${restoreAppName}_evil`;
    const siblingDir = path.join(path.dirname(backupFilesFolder), siblingDirectoryName);
    const siblingFileName = `prefix-collision.${BACKUP_EXTENSION}`;
    const siblingFilePath = path.join(siblingDir, siblingFileName);

    try {
      await fs.promises.mkdir(siblingDir, { recursive: true });
      await fs.promises.writeFile(siblingFilePath, 'malicious sibling file');

      await expect(
        restoreManager.restoreFromBackup(`../${siblingDirectoryName}/${siblingFileName}`, 'task_id'),
      ).rejects.toThrow(/(FILE_NOT_FOUND|not found)/);
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

  it('should restore encryption field keys through the CLI restore flow', async () => {
    const { backupFileBaseName, backupFilePath } = createBackupFile('restore-cli-encryption-field-keys');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(restoredKeyFile, existingEncryptionFieldKey);
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);

    const restoreManager = createRestoreManager();
    await restoreManager.restoreCLI(backupFilePath);

    await expect(fs.promises.readFile(restoredKeyFile, 'utf8')).resolves.toBe(sourceEncryptionFieldKey);
    expect(fs.existsSync(existingKeyFile)).toBe(false);
    await expectNoExtractedDirectory(backupFileBaseName);
  });

  it('should replace encryption field keys before upgrading and ignore invalid entries', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const secondaryKeyFile = path.join(encryptionFieldKeysFolder, 'secondary.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    const ignoredTextFile = path.join(encryptionFieldKeysFolder, 'ignored.txt');
    const nestedKeyFile = path.join(encryptionFieldKeysFolder, 'nested', 'nested.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/secondary.key`]: existingEncryptionFieldKey,
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/ignored.txt`]: 'not a key',
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/nested/nested.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(path.dirname(nestedKeyFile), { recursive: true });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    await fs.promises.writeFile(restoredKeyFile, existingEncryptionFieldKey);
    await fs.promises.writeFile(ignoredTextFile, 'existing text');
    await fs.promises.writeFile(nestedKeyFile, 'existing nested key');
    let restoredKeyAtUpgrade: string | undefined;
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockImplementation(async () => {
      restoredKeyAtUpgrade = await fs.promises.readFile(restoredKeyFile, 'utf8');
    });

    const restoreManager = createRestoreManager();
    await restoreManager.restore(backupFilePath, 'task_id');

    await vi.waitFor(async () => {
      expect(runCommandSpy).toHaveBeenCalledWith('upgrade');
      await expect(fs.promises.readFile(restoredKeyFile, 'utf8')).resolves.toBe(sourceEncryptionFieldKey);
    });
    expect(restoredKeyAtUpgrade).toBe(sourceEncryptionFieldKey);
    await expect(fs.promises.readFile(secondaryKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
    expect(fs.existsSync(existingKeyFile)).toBe(false);
    expect(fs.existsSync(ignoredTextFile)).toBe(false);
    expect(fs.existsSync(nestedKeyFile)).toBe(false);
  });

  it('should preserve existing encryption field keys when restoring a legacy backup', async () => {
    const { backupFilePath } = createBackupFile('restore-legacy-encryption-field-keys');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb());
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    const restoreManager = createRestoreManager();
    await restoreManager.restore(backupFilePath, 'task_id');

    await vi.waitFor(() => {
      expect(runCommandSpy).toHaveBeenCalledWith('upgrade');
    });
    await expect(fs.promises.readFile(existingKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
  });

  it('should clear existing encryption field keys when the backup contains an empty key directory', async () => {
    const { backupFilePath } = createBackupFile('restore-empty-encryption-field-keys');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/`]: '',
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);

    const restoreManager = createRestoreManager();
    await restoreManager.restoreCLI(backupFilePath);

    await expect(fs.promises.readdir(encryptionFieldKeysFolder)).resolves.toEqual([]);
  });

  it('should not restore stale extracted encryption field keys from a legacy backup', async () => {
    const { backupFileBaseName, backupFilePath } = createBackupFile('restore-legacy-with-stale-extracted-key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    const staleExtractedKeyFile = path.join(
      restoreTempFolder,
      backupFileBaseName,
      ENCRYPTION_FIELD_KEYS_DIRECTORY,
      'stale.key',
    );
    const staleTargetKeyFile = path.join(encryptionFieldKeysFolder, 'stale.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb());
    await fs.promises.mkdir(path.dirname(staleExtractedKeyFile), { recursive: true });
    await fs.promises.writeFile(staleExtractedKeyFile, sourceEncryptionFieldKey);
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    const restoreManager = createRestoreManager();
    await restoreManager.restore(backupFilePath, 'task_id');

    await vi.waitFor(() => {
      expect(runCommandSpy).toHaveBeenCalledWith('upgrade');
    });
    await expect(fs.promises.readFile(existingKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
    expect(fs.existsSync(staleTargetKeyFile)).toBe(false);
  });

  it('should set restrictive permissions on restored encryption field keys', async () => {
    if (process.platform === 'win32') {
      return;
    }

    const { backupFilePath } = createBackupFile('restore-encryption-field-key-permissions');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    const restoreManager = createRestoreManager();
    await restoreManager.restore(backupFilePath, 'task_id');

    await vi.waitFor(async () => {
      expect(runCommandSpy).toHaveBeenCalledWith('upgrade');
      expect(fs.existsSync(restoredKeyFile)).toBe(true);
    });
    const directoryMode = (await fs.promises.stat(encryptionFieldKeysFolder)).mode & 0o777;
    const fileMode = (await fs.promises.stat(restoredKeyFile)).mode & 0o777;
    expect(directoryMode).toBe(0o700);
    expect(fileMode).toBe(0o600);
  });

  it('should replace encryption field keys without renaming across filesystems', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-same-filesystem');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      if (path.dirname(oldPath.toString()) !== path.dirname(newPath.toString())) {
        const error = new Error('Cross-device link not permitted') as NodeJS.ErrnoException;
        error.code = 'EXDEV';
        throw error;
      }
      await rename(oldPath, newPath);
    });

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restoreCLI(backupFilePath);
    } finally {
      renameSpy.mockRestore();
    }

    await expect(fs.promises.readFile(restoredKeyFile, 'utf8')).resolves.toBe(sourceEncryptionFieldKey);
    expect(fs.existsSync(existingKeyFile)).toBe(false);
  });

  it('should preserve previous encryption field keys when installation and rollback both fail', async () => {
    const { backupFileBaseName, backupFilePath } = createBackupFile('restore-encryption-field-keys-rollback-failure');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    const revertDatabaseFile = path.join(restoreTempFolder, 'before-restore', 'data');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    await fs.promises.mkdir(path.dirname(revertDatabaseFile), { recursive: true });
    await fs.promises.writeFile(revertDatabaseFile, 'mocked database backup');
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      const source = oldPath.toString();
      const destination = newPath.toString();
      if (
        destination === encryptionFieldKeysFolder &&
        source.startsWith(path.join(encryptionFieldKeysParentFolder, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`))
      ) {
        throw new Error('mock rollback failure');
      }
      if (
        destination === encryptionFieldKeysFolder &&
        source.startsWith(path.join(encryptionFieldKeysParentFolder, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-`))
      ) {
        throw new Error('mock installation failure');
      }
      await rename(oldPath, newPath);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');

    try {
      const restoreManager = createRestoreManager();
      await expect(restoreManager.restoreCLI(backupFilePath)).rejects.toThrow(
        'Failed to roll back the encryption field keys',
      );
    } finally {
      renameSpy.mockRestore();
    }

    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    expect(previousDirectory).toBeDefined();
    if (!previousDirectory) {
      throw new Error('Previous encryption field keys directory was not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
    expect(fs.existsSync(encryptionFieldKeysFolder)).toBe(false);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`The keys were preserved at "${previousDirectory}"`),
      expect.any(Object),
    );
    await expectNoExtractedDirectory(backupFileBaseName);
  });

  it('should fail CLI restore when restored encryption field keys cannot be activated', async () => {
    const { backupFilePath } = createBackupFile('restore-cli-encryption-field-keys-activation-failure');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      const sourceName = path.basename(oldPath.toString());
      if (
        newPath.toString() === encryptionFieldKeysFolder &&
        sourceName.startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-`) &&
        !sourceName.startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`)
      ) {
        throw new Error('mock encryption field key activation failure');
      }
      await rename(oldPath, newPath);
    });

    try {
      const restoreManager = createRestoreManager();
      await expect(restoreManager.restoreCLI(backupFilePath, undefined, false, true)).rejects.toThrow(
        'Failed to activate the restored encryption field keys',
      );
    } finally {
      renameSpy.mockRestore();
    }

    await expect(fs.promises.readFile(existingKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const restoredDirectory = replacementDirectories.find(
      (directory) =>
        !path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`) &&
        !path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-discarded-`),
    );
    expect(restoredDirectory).toBeDefined();
    if (!restoredDirectory) {
      throw new Error('Restored encryption field keys directory was not preserved');
    }
    await expect(fs.promises.readFile(path.join(restoredDirectory, 'source.key'), 'utf8')).resolves.toBe(
      sourceEncryptionFieldKey,
    );
  });

  it('should stop recovery when encryption field key staging fails and the database is not reverted', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-staging-failure');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const copyFile = fs.promises.copyFile.bind(fs.promises);
    const copyFileSpy = vi.spyOn(fs.promises, 'copyFile').mockImplementation(async (source, destination, mode) => {
      if (destination.toString().endsWith(`${path.sep}source.key`)) {
        throw new Error('mock encryption field key staging failure');
      }
      await copyFile(source, destination, mode);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id', undefined, false, true);

      await vi.waitFor(() => {
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Restored encryption field keys are unavailable'),
          expect.any(Object),
        );
      });
    } finally {
      copyFileSpy.mockRestore();
    }

    expect(runCommandSpy).not.toHaveBeenCalled();
    await expect(fs.promises.readFile(existingKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
  });

  it('should preserve uploads and the AES key when encryption field key staging fails', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-staging-failure-file-order');
    const uploadFileName = `${restoreAppName}-staging-failure.txt`;
    const uploadFilePath = storagePathJoin('uploads', uploadFileName);
    const aesKeyPath = storagePathJoin('apps', restoreAppName, 'aes_key.dat');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    const revertDatabaseFile = path.join(restoreTempFolder, 'before-restore', 'data');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`uploads/${uploadFileName}`]: 'restored upload',
      'aes_key.dat': 'restored AES key',
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.mkdir(path.dirname(uploadFilePath), { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    await fs.promises.writeFile(uploadFilePath, 'existing upload');
    await fs.promises.writeFile(aesKeyPath, 'existing AES key');
    await fs.promises.mkdir(path.dirname(revertDatabaseFile), { recursive: true });
    await fs.promises.writeFile(revertDatabaseFile, 'mocked database backup');
    const copyFile = fs.promises.copyFile.bind(fs.promises);
    const copyFileSpy = vi.spyOn(fs.promises, 'copyFile').mockImplementation(async (source, destination, mode) => {
      if (destination.toString().endsWith(`${path.sep}source.key`)) {
        throw new Error('mock encryption field key staging failure');
      }
      await copyFile(source, destination, mode);
    });

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restoreCLI(backupFilePath);

      await expect(fs.promises.readFile(uploadFilePath, 'utf8')).resolves.toBe('existing upload');
      await expect(fs.promises.readFile(aesKeyPath, 'utf8')).resolves.toBe('existing AES key');
      await expect(fs.promises.readFile(existingKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
    } finally {
      copyFileSpy.mockRestore();
      await fs.promises.rm(uploadFilePath, { force: true });
      await fs.promises.rm(aesKeyPath, { force: true });
    }
  });

  it('should stop recovery when active encryption field keys cannot be preserved', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-preserve-active-failure');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      if (
        oldPath.toString() === encryptionFieldKeysFolder &&
        path.basename(newPath.toString()).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`)
      ) {
        throw new Error('mock preserving active encryption field keys failure');
      }
      await rename(oldPath, newPath);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id', undefined, false, true);

      await vi.waitFor(() => {
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to preserve the active encryption field keys'),
          expect.any(Object),
        );
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(runCommandSpy).not.toHaveBeenCalled();
    await expect(fs.promises.readFile(existingKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const restoredDirectory = replacementDirectories.find(
      (directory) =>
        !path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`) &&
        !path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-discarded-`),
    );
    expect(restoredDirectory).toBeDefined();
    if (!restoredDirectory) {
      throw new Error('Restored encryption field keys directory was not preserved');
    }
    await expect(fs.promises.readFile(path.join(restoredDirectory, 'source.key'), 'utf8')).resolves.toBe(
      sourceEncryptionFieldKey,
    );
  });

  it('should stop recovery when encryption field key installation and rollback both fail', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-installation-rollback-failure');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      const source = oldPath.toString();
      const destination = newPath.toString();
      if (
        destination === encryptionFieldKeysFolder &&
        (source.startsWith(
          path.join(encryptionFieldKeysParentFolder, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
        ) ||
          source.startsWith(path.join(encryptionFieldKeysParentFolder, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-`)))
      ) {
        throw new Error('mock encryption field key installation and rollback failure');
      }
      await rename(oldPath, newPath);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id');

      await vi.waitFor(() => {
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to roll back encryption field keys.'),
          expect.any(Object),
        );
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(runCommandSpy).not.toHaveBeenCalled();
    expect(fs.existsSync(encryptionFieldKeysFolder)).toBe(false);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    expect(previousDirectory).toBeDefined();
    if (!previousDirectory) {
      throw new Error('Previous encryption field keys directory was not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
  });

  it('should stop recovery and preserve both key sets when installation fails and database revert is skipped', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-installation-failure-skip-revert');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      const source = oldPath.toString();
      const destination = newPath.toString();
      if (
        destination === encryptionFieldKeysFolder &&
        (source.startsWith(
          path.join(encryptionFieldKeysParentFolder, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
        ) ||
          source.startsWith(path.join(encryptionFieldKeysParentFolder, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-`)))
      ) {
        throw new Error('mock encryption field key activation failure');
      }
      await rename(oldPath, newPath);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id', undefined, false, true);

      await vi.waitFor(() => {
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to activate the restored encryption field keys.'),
          expect.any(Object),
        );
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(runCommandSpy).not.toHaveBeenCalled();
    expect(fs.existsSync(encryptionFieldKeysFolder)).toBe(false);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    const restoredDirectory = replacementDirectories.find(
      (directory) =>
        !path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`) &&
        !path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-discarded-`),
    );
    expect(previousDirectory).toBeDefined();
    expect(restoredDirectory).toBeDefined();
    if (!previousDirectory || !restoredDirectory) {
      throw new Error('Encryption field key recovery directories were not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
    await expect(fs.promises.readFile(path.join(restoredDirectory, 'source.key'), 'utf8')).resolves.toBe(
      sourceEncryptionFieldKey,
    );
  });

  it('should stop recovery and preserve both key sets when installation and database revert both fail', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-installation-and-db-revert-failure');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    const revertDatabaseFile = path.join(restoreTempFolder, 'before-restore', 'data');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    let installationFailed = false;
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      const source = oldPath.toString();
      const destination = newPath.toString();
      if (
        destination === encryptionFieldKeysFolder &&
        (source.startsWith(
          path.join(encryptionFieldKeysParentFolder, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
        ) ||
          source.startsWith(path.join(encryptionFieldKeysParentFolder, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-`)))
      ) {
        if (!installationFailed) {
          installationFailed = true;
          await fs.promises.rm(revertDatabaseFile, { force: true });
        }
        throw new Error('mock encryption field key activation failure');
      }
      await rename(oldPath, newPath);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id');

      await vi.waitFor(() => {
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to activate the restored encryption field keys.'),
          expect.any(Object),
        );
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(runCommandSpy).not.toHaveBeenCalled();
    expect(fs.existsSync(encryptionFieldKeysFolder)).toBe(false);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    const restoredDirectory = replacementDirectories.find(
      (directory) =>
        !path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`) &&
        !path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-discarded-`),
    );
    expect(previousDirectory).toBeDefined();
    expect(restoredDirectory).toBeDefined();
    if (!previousDirectory || !restoredDirectory) {
      throw new Error('Encryption field key recovery directories were not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
    await expect(fs.promises.readFile(path.join(restoredDirectory, 'source.key'), 'utf8')).resolves.toBe(
      sourceEncryptionFieldKey,
    );
  });

  it('should restore previous encryption field keys when upgrade fails and the database is reverted', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-upgrade-failure');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const runCommandSpy = vi
      .spyOn(app, 'runCommand')
      .mockRejectedValueOnce(new Error('mock upgrade failure'))
      .mockResolvedValue(undefined);

    const restoreManager = createRestoreManager();
    await restoreManager.restore(backupFilePath, 'task_id');

    await vi.waitFor(() => {
      expect(runCommandSpy).toHaveBeenCalledTimes(2);
    });
    await expect(fs.promises.readFile(existingKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
    expect(fs.existsSync(restoredKeyFile)).toBe(false);
  });

  it('should stop recovery when restored encryption field keys cannot be moved for rollback', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-active-rollback-failure');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      if (
        oldPath.toString() === encryptionFieldKeysFolder &&
        path.basename(newPath.toString()).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-discarded-`)
      ) {
        throw new Error('mock active keys rollback failure');
      }
      await rename(oldPath, newPath);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');
    const runCommandSpy = vi
      .spyOn(app, 'runCommand')
      .mockRejectedValueOnce(new Error('mock upgrade failure'))
      .mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id');

      await vi.waitFor(() => {
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to remove the restored encryption field keys while rolling back.'),
          expect.any(Object),
        );
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(runCommandSpy).toHaveBeenCalledTimes(1);
    await expect(fs.promises.readFile(restoredKeyFile, 'utf8')).resolves.toBe(sourceEncryptionFieldKey);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    expect(previousDirectory).toBeDefined();
    if (!previousDirectory) {
      throw new Error('Previous encryption field keys directory was not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
  });

  it('should stop recovery and reactivate restored keys when previous encryption field keys cannot be restored', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-previous-rollback-failure');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      if (
        newPath.toString() === encryptionFieldKeysFolder &&
        path.basename(oldPath.toString()).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`)
      ) {
        throw new Error('mock previous keys rollback failure');
      }
      await rename(oldPath, newPath);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');
    const runCommandSpy = vi
      .spyOn(app, 'runCommand')
      .mockRejectedValueOnce(new Error('mock upgrade failure'))
      .mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id');

      await vi.waitFor(() => {
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('The restored keys remain active.'),
          expect.any(Object),
        );
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(runCommandSpy).toHaveBeenCalledTimes(1);
    await expect(fs.promises.readFile(restoredKeyFile, 'utf8')).resolves.toBe(sourceEncryptionFieldKey);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    expect(previousDirectory).toBeDefined();
    if (!previousDirectory) {
      throw new Error('Previous encryption field keys directory was not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
  });

  it('should stop recovery and preserve both key sets when encryption field key rollback cannot reactivate either set', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-complete-rollback-failure');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      const sourceName = path.basename(oldPath.toString());
      if (
        newPath.toString() === encryptionFieldKeysFolder &&
        (sourceName.startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`) ||
          sourceName.startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-discarded-`))
      ) {
        throw new Error('mock encryption field keys reactivation failure');
      }
      await rename(oldPath, newPath);
    });
    const loggerErrorSpy = vi.spyOn(app.logger, 'error');
    const runCommandSpy = vi
      .spyOn(app, 'runCommand')
      .mockRejectedValueOnce(new Error('mock upgrade failure'))
      .mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id');

      await vi.waitFor(() => {
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('but could not be reinstalled'),
          expect.any(Object),
        );
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(runCommandSpy).toHaveBeenCalledTimes(1);
    expect(fs.existsSync(encryptionFieldKeysFolder)).toBe(false);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    const discardedDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-discarded-`),
    );
    expect(previousDirectory).toBeDefined();
    expect(discardedDirectory).toBeDefined();
    if (!previousDirectory || !discardedDirectory) {
      throw new Error('Encryption field key rollback directories were not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
    await expect(fs.promises.readFile(path.join(discardedDirectory, 'source.key'), 'utf8')).resolves.toBe(
      sourceEncryptionFieldKey,
    );
  });

  it('should keep restored encryption field keys when database revert is skipped after an upgrade failure', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-skip-revert');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const runCommandSpy = vi
      .spyOn(app, 'runCommand')
      .mockRejectedValueOnce(new Error('mock upgrade failure'))
      .mockResolvedValue(undefined);

    const restoreManager = createRestoreManager();
    await restoreManager.restore(backupFilePath, 'task_id', undefined, false, true);

    await vi.waitFor(() => {
      expect(runCommandSpy).toHaveBeenCalledTimes(2);
    });
    await expect(fs.promises.readFile(restoredKeyFile, 'utf8')).resolves.toBe(sourceEncryptionFieldKey);
    expect(fs.existsSync(existingKeyFile)).toBe(false);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    expect(previousDirectory).toBeDefined();
    if (!previousDirectory) {
      throw new Error('Previous encryption field keys directory was not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
  });

  it('should keep restored encryption field keys when database revert fails after an upgrade failure', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-revert-failure');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    const revertDatabaseFile = path.join(restoreTempFolder, 'before-restore', 'data');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const runCommandSpy = vi
      .spyOn(app, 'runCommand')
      .mockImplementationOnce(async () => {
        await fs.promises.rm(revertDatabaseFile, { force: true });
        throw new Error('mock upgrade failure');
      })
      .mockResolvedValue(undefined);

    const restoreManager = createRestoreManager();
    await restoreManager.restore(backupFilePath, 'task_id');

    await vi.waitFor(() => {
      expect(runCommandSpy).toHaveBeenCalledTimes(2);
    });
    await expect(fs.promises.readFile(restoredKeyFile, 'utf8')).resolves.toBe(sourceEncryptionFieldKey);
    expect(fs.existsSync(existingKeyFile)).toBe(false);
    const replacementDirectories = await findEncryptionFieldKeysReplacementDirectories();
    const previousDirectory = replacementDirectories.find((directory) =>
      path.basename(directory).startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`),
    );
    expect(previousDirectory).toBeDefined();
    if (!previousDirectory) {
      throw new Error('Previous encryption field keys directory was not preserved');
    }
    await expect(fs.promises.readFile(path.join(previousDirectory, 'existing.key'), 'utf8')).resolves.toBe(
      existingEncryptionFieldKey,
    );
  });

  it('should revert encryption field keys even when restore diagnostics fail', async () => {
    const { backupFilePath } = createBackupFile('restore-encryption-field-keys-diagnostics-failure');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const querySpy = vi.spyOn(app.db.sequelize, 'query').mockRejectedValueOnce(new Error('mock diagnostics failure'));
    const runCommandSpy = vi
      .spyOn(app, 'runCommand')
      .mockRejectedValueOnce(new Error('mock upgrade failure'))
      .mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id', undefined, true);

      await vi.waitFor(() => {
        expect(runCommandSpy).toHaveBeenCalledTimes(2);
      });
    } finally {
      querySpy.mockRestore();
    }

    await expect(fs.promises.readFile(existingKeyFile, 'utf8')).resolves.toBe(existingEncryptionFieldKey);
    expect(fs.existsSync(restoredKeyFile)).toBe(false);
  });

  it('should activate staged encryption field keys before continuing a tolerent restore', async () => {
    const { backupFilePath } = createBackupFile('restore-tolerent-mode-encryption-field-key-installation-failure');
    const restoredKeyFile = path.join(encryptionFieldKeysFolder, 'source.key');
    const existingKeyFile = path.join(encryptionFieldKeysFolder, 'existing.key');
    await createBackupArchive(backupFilePath, await createMetadataCompatibleWithCurrentDb(), {
      [`${ENCRYPTION_FIELD_KEYS_DIRECTORY}/source.key`]: sourceEncryptionFieldKey,
    });
    await fs.promises.mkdir(encryptionFieldKeysFolder, { recursive: true });
    await fs.promises.writeFile(existingKeyFile, existingEncryptionFieldKey);
    const rename = fs.promises.rename.bind(fs.promises);
    let installationFailed = false;
    const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (oldPath, newPath) => {
      const sourceName = path.basename(oldPath.toString());
      if (
        !installationFailed &&
        newPath.toString() === encryptionFieldKeysFolder &&
        sourceName.startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-`) &&
        !sourceName.startsWith(`.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-`)
      ) {
        installationFailed = true;
        throw new Error('ignored encryption field key installation failure');
      }
      await rename(oldPath, newPath);
    });
    const runCommandSpy = vi.spyOn(app, 'runCommand').mockResolvedValue(undefined);

    try {
      const restoreManager = createRestoreManager();
      await restoreManager.restore(backupFilePath, 'task_id', undefined, true);

      await vi.waitFor(async () => {
        expect(runCommandSpy).toHaveBeenCalledTimes(1);
        await expect(fs.promises.readFile(restoredKeyFile, 'utf8')).resolves.toBe(sourceEncryptionFieldKey);
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(fs.existsSync(existingKeyFile)).toBe(false);
    await expect(findEncryptionFieldKeysReplacementDirectories()).resolves.toEqual([]);
  });

  it('restore with tolerentMode', async () => {
    const { backupFileBaseName, backupFilePath } = createBackupFile('restore-tolerent-mode');
    await createBackupArchive(backupFilePath, createMetadata(), {
      [`uploads/${tolerentModeUploadFileName}`]: 'restored upload',
    });
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
    await expect(fs.promises.readFile(tolerentModeUploadFilePath, 'utf8')).resolves.toBe('restored upload');
    await expectNoExtractedDirectory(backupFileBaseName);
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
    await expectNoExtractedDirectory('backup_schema_mismatch');
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
