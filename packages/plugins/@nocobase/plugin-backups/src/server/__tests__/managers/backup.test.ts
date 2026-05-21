import { getApp } from '..';
import { BackupManager, BackupSettings } from '../../managers/backup';
import { MockServer } from '@nocobase/test';
import path from 'path';
import { storagePathJoin } from '@nocobase/utils';
import { BACKUP_EXTENSION } from '../../utils';
import fs from 'fs';
import * as cp from 'child_process';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof cp>();
  return {
    ...actual,
    execSync: vi.fn(),
    exec: vi.fn().mockImplementation((command, _options, callback) => {
      if (command.includes(' > ')) {
        // mock the command to create a backup file
        const fileName = command.split(' > ')[1].trim();
        fs.writeFileSync(fileName, 'mocked database backup');
      }
      callback(null, 'done');
    }),
  };
});

const backupFileBaseName = 'backup_for_unit_tests';
const backupFilesFolder = storagePathJoin('backups', 'main');
const finalBackupFilePath = path.join(backupFilesFolder, `${backupFileBaseName}.${BACKUP_EXTENSION}`);

describe('BackupManager', async () => {
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
  });

  afterEach(async () => {
    await app.destroy();
  });

  afterAll(async () => {
    fs.promises.unlink(finalBackupFilePath).catch(() => {});
  });

  it('createBackupName', async () => {
    const backupManager = new BackupManager(app, null, defaultBackupSettings);
    await expect(backupManager.createBackupName()).resolves.toMatch(/backup_.*/);
  });

  describe('backup', async () => {
    it('should generate a backup file', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);
      await backupManager.backup(backupFileBaseName);
      const files = await fs.promises.readdir(backupFilesFolder);
      expect(files).toContain(`${backupFileBaseName}.${BACKUP_EXTENSION}`);
    });

    it('should generate a backup file with encryption', async () => {
      const backupManager = new BackupManager(app, null, {
        ...defaultBackupSettings,
        encryptionPassword: 'password',
      });
      await backupManager.backup(backupFileBaseName);
      const files = await fs.promises.readdir(backupFilesFolder);
      expect(files).toContain(`${backupFileBaseName}.nbdata`);
    });

    it('should warn and continue when a file collection query fails', async () => {
      const backupManager = new BackupManager(app, null, {
        ...defaultBackupSettings,
        enableFilesBackup: true,
      });
      const brokenCollection = {
        name: 'broken_file_collection',
        options: {
          template: 'file',
        },
      } as any;
      const getRepository = app.db.getRepository.bind(app.db);
      const warnSpy = vi.spyOn(app.logger, 'warn').mockImplementation(() => undefined as any);
      const findSpy = vi.fn().mockRejectedValue(new Error('relation "source_schema.test_files" does not exist'));

      app.db.collections.set(brokenCollection.name, brokenCollection);
      const getRepositorySpy = vi.spyOn(app.db, 'getRepository').mockImplementation((name: string) => {
        if (name === brokenCollection.name) {
          return {
            find: findSpy,
          } as any;
        }
        return getRepository(name);
      });

      try {
        await backupManager.backup(backupFileBaseName);

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`Skip backing up files from collection "${brokenCollection.name}"`),
          expect.objectContaining({ module: expect.any(String) }),
        );
        const files = await fs.promises.readdir(backupFilesFolder);
        expect(files).toContain(`${backupFileBaseName}.${BACKUP_EXTENSION}`);
      } finally {
        app.db.collections.delete(brokenCollection.name);
        getRepositorySpy.mockRestore();
        warnSpy.mockRestore();
      }
    });

    it('should skip invalid local file records and continue backup', async () => {
      const backupManager = new BackupManager(app, null, {
        ...defaultBackupSettings,
        enableFilesBackup: true,
      });
      const fileCollection = {
        name: 'invalid_file_records',
        options: {
          template: 'file',
        },
      } as any;
      const uploadsDir = path.join(process.cwd(), 'storage/uploads');
      const validFileName = 'valid-root-file-for-backup.txt';
      const validFilePath = path.join(uploadsDir, validFileName);
      const dottedFileName = '..valid-root-file-for-backup.txt';
      const dottedFilePath = path.join(uploadsDir, dottedFileName);
      const getRepository = app.db.getRepository.bind(app.db);
      const warnSpy = vi.spyOn(app.logger, 'warn').mockImplementation(() => undefined as any);
      const findSpy = vi.fn().mockResolvedValue([
        { id: 1, path: null, filename: null },
        { id: 2, path: 123, filename: 'invalid-path.txt' },
        { id: 3, path: '../private', filename: 'secret.txt' },
        { id: 4, path: null, filename: validFileName },
        { id: 5, path: null, filename: 'nested\\..\\..\\secret.txt' },
        { id: 6, path: null, filename: dottedFileName },
      ]);

      app.db.collections.set(fileCollection.name, fileCollection);
      const getRepositorySpy = vi.spyOn(app.db, 'getRepository').mockImplementation((name: string) => {
        if (name === fileCollection.name) {
          return {
            find: findSpy,
          } as any;
        }
        return getRepository(name);
      });

      try {
        await fs.promises.mkdir(uploadsDir, { recursive: true });
        await fs.promises.writeFile(validFilePath, 'valid file');
        await fs.promises.writeFile(dottedFilePath, 'valid dotted file');

        await backupManager.backup(backupFileBaseName);

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`collection "${fileCollection.name}" id=1: Invalid filename`),
          expect.objectContaining({ module: expect.any(String) }),
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`collection "${fileCollection.name}" id=2: Invalid path`),
          expect.objectContaining({ module: expect.any(String) }),
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`collection "${fileCollection.name}" id=3: Path traversal is not allowed`),
          expect.objectContaining({ module: expect.any(String) }),
        );
        expect(warnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining(`collection "${fileCollection.name}" id=4`),
          expect.anything(),
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`collection "${fileCollection.name}" id=5: Invalid path`),
          expect.objectContaining({ module: expect.any(String) }),
        );
        expect(warnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining(`collection "${fileCollection.name}" id=6`),
          expect.anything(),
        );
        const files = await fs.promises.readdir(backupFilesFolder);
        expect(files).toContain(`${backupFileBaseName}.${BACKUP_EXTENSION}`);
      } finally {
        app.db.collections.delete(fileCollection.name);
        await fs.promises.unlink(validFilePath).catch(() => {});
        await fs.promises.unlink(dottedFilePath).catch(() => {});
        getRepositorySpy.mockRestore();
        warnSpy.mockRestore();
      }
    });
  });

  describe('destroy', async () => {
    it('should delete the backup file', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);
      await backupManager.backup(backupFileBaseName);
      await backupManager.destroy(`${backupFileBaseName}.${BACKUP_EXTENSION}`);
      const files = await fs.promises.readdir(backupFilesFolder);
      expect(files).not.toContain(`${backupFileBaseName}.${BACKUP_EXTENSION}`);
    });

    it('should reject path traversal attempts', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);

      // Test various path traversal patterns
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '../../../../var/log/system.log',
        './.env',
        '../package.json',
        'subdir/../../../sensitive.txt',
        '../../backup.nbdata', // Even valid extension but wrong path
      ];

      for (const maliciousFilename of maliciousFilenames) {
        await expect(backupManager.destroy(maliciousFilename)).rejects.toThrow(/(FILE_NOT_FOUND|not found)/);
      }
    });

    it('should reject invalid filenames', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);

      const invalidFilenames = [
        'backup_without_extension',
        'backup.txt', // Wrong extension
        'backup.sql', // Wrong extension
        '', // Empty string
        'backup.nbdata.txt', // Wrong extension
      ];

      for (const invalidFilename of invalidFilenames) {
        await expect(backupManager.destroy(invalidFilename)).rejects.toThrow(/(FILE_NOT_FOUND|not found)/);
      }
    });

    it('should reject non-existent files', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);

      await expect(backupManager.destroy('non_existent_backup.nbdata')).rejects.toThrow(/(FILE_NOT_FOUND|not found)/);
    });
  });

  describe('createReadStream', async () => {
    it('should return a read stream', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);
      await backupManager.backup(backupFileBaseName);
      const readStream = await backupManager.createReadStream(`${backupFileBaseName}.${BACKUP_EXTENSION}`);
      expect(readStream).toBeTruthy();
    });

    it('should reject path traversal attempts', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);

      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '../../../../var/log/system.log',
        './.env',
        '../package.json',
        'subdir/../../../sensitive.txt',
        '../../backup.nbdata', // Even valid extension but wrong path
      ];

      for (const maliciousFilename of maliciousFilenames) {
        await expect(backupManager.createReadStream(maliciousFilename)).rejects.toThrow(/(FILE_NOT_FOUND|not found)/);
      }
    });

    it('should reject invalid filenames', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);

      const invalidFilenames = [
        'backup_without_extension',
        'backup.txt', // Wrong extension
        'backup.sql', // Wrong extension
        '', // Empty string
        'backup.nbdata.txt', // Wrong extension
      ];

      for (const invalidFilename of invalidFilenames) {
        await expect(backupManager.createReadStream(invalidFilename)).rejects.toThrow(/(FILE_NOT_FOUND|not found)/);
      }
    });
  });

  describe('list', async () => {
    it('should return a list of backup files', async () => {
      const backupManager = new BackupManager(app, null, defaultBackupSettings);
      await backupManager.backup(backupFileBaseName);
      const backups = await backupManager.list();
      expect(backups.map((b) => b.name)).toContain(`${backupFileBaseName}.${BACKUP_EXTENSION}`);
    });
  });
});
