/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { ResourcerContext } from '@nocobase/resourcer';
import Application from '@nocobase/server';
import archiver from 'archiver';
import * as crypto from 'crypto';
import dayjs from 'dayjs';
import * as fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { storagePathJoin } from '@nocobase/utils';
import { Readable, Writable } from 'stream';
import { promisify } from 'util';
import { DBAdapter, getDBAdapter } from '../adapters/database';
import type { StorageModel } from '../types';
import {
  BACKUPS,
  BACKUP_EXTENSION,
  BACKUP_TASKS_CACHE_NAME,
  FILE_ENCRYPTION_SALT,
  METADATA_EXTENSION,
  PLUGIN_BACKUPS_NAME,
  getDBVersion,
  humanFileSize,
  resolvePathWithinBase,
} from '../utils';

const BACKUP_METADATA_VERSION = 1;

export interface BackupSettings {
  storageId?: string;
  encryptionPassword: string;
  enableFilesBackup: boolean;
  keep?: number;
  scheduled: boolean;
  cron: string;
  includeTables?: string[];
  excludeTables?: string[];
  description?: string;
}

export interface BackupFile {
  name: string;
  fileSize?: string;
  createdAt?: Date;
  description?: string;
  inProgress: boolean;
}

export interface BackupTaskResult {
  message?: string;
  inProgress: boolean;
}

export class BackupManager {
  app: Application;
  ctx: ResourcerContext | null; // when triggered by cron job, ctx is null
  #settings: BackupSettings;
  #dbAdapter: DBAdapter;
  #backupPrefix: string;
  #backupDir: string;
  #tempDir: string;
  #uploadDir: string;
  #aesKeyPath: string;

  constructor(app: Application, ctx: ResourcerContext | null, settings: BackupSettings) {
    this.app = app;
    this.ctx = ctx;
    this.#settings = settings;
    this.#dbAdapter = getDBAdapter(app.db.options);
    this.#backupPrefix = 'backup_';
    this.#backupDir = storagePathJoin('backups', app.name);
    this.#tempDir = storagePathJoin('tmp', 'backups', app.name);
    this.#uploadDir = storagePathJoin('uploads');
    this.#aesKeyPath = storagePathJoin('apps', app.name, 'aes_key.dat');
  }

  protected set backupPrefix(backupPrefix: string) {
    this.#backupPrefix = backupPrefix;
  }

  async createBackupName() {
    await this.#dbAdapter.check('backup');
    await fsPromises.mkdir(this.#backupDir, { recursive: true });
    await fsPromises.mkdir(this.#tempDir, { recursive: true });
    await fsPromises.mkdir(this.#uploadDir, { recursive: true });
    return this.#generateFileBaseName();
  }

  async backup(fileBaseName: string, opts?: Partial<BackupSettings>) {
    const contentPath = path.join(this.#tempDir, fileBaseName);
    return this.#runBackupTask({ ...this.#settings, ...(opts ?? {}) }, fileBaseName, contentPath);
  }

  async destroy(fileName: string) {
    const filePath = this.#getValidatedFilePath(fileName);
    await fsPromises.unlink(filePath);
  }

  async list() {
    const inProgressBackups = await this.#listProgressBackups();
    const completedBackups = await this.#listCompletedBackups(inProgressBackups);
    // clean up the lock files if the backup process done.
    // These files can be left behind if the backup process is interrupted for some reason
    const cleanStaleLockFiles = async () => {
      const statusCache = this.app.cacheManager.getCache(BACKUP_TASKS_CACHE_NAME);
      for (const backup of inProgressBackups) {
        if (!(await statusCache.get(backup.name))) {
          await this.#removeLockFile(path.basename(backup.name, `.${BACKUP_EXTENSION}`));
          await statusCache.del(backup.name);
        }
      }
    };
    cleanStaleLockFiles().catch(() => {}); // don't block the response
    return [...inProgressBackups, ...completedBackups];
  }

  async createReadStream(fileName: string): Promise<Readable> {
    const filePath = this.#getValidatedFilePath(fileName);
    return fs.createReadStream(filePath);
  }

  #getValidatedFilePath(fileName: string): string {
    const filePath = resolvePathWithinBase(this.#backupDir, fileName);
    if (
      path.basename(fileName) !== fileName ||
      !fileName.endsWith(`.${BACKUP_EXTENSION}`) ||
      !filePath ||
      !fs.existsSync(filePath)
    ) {
      throw new Error(this.#t('FILE_NOT_FOUND', fileName));
    }
    return filePath;
  }

  async #runBackupTask(opts: BackupSettings, fileBaseName: string, contentPath: string) {
    try {
      // create lock file to be able to list in progress backups
      await this.#createLockFile(fileBaseName);
      // create content path to store the uncompressed backup files
      await this.#createContentPath(contentPath);
      // Backup the database
      await this.#dbAdapter.backup({
        dir: contentPath,
        skipFdw: !this.app.pm.has('collection-fdw'),
        includeTables: opts.includeTables,
        excludeTables: opts.excludeTables,
      });
      // save the metadata
      await this.#metadataBackup(opts, contentPath);
      // 3. compress the backup files
      const password = opts.encryptionPassword || undefined;
      const filePath = await this.#compressFiles(contentPath, fileBaseName, password, opts);
      // upload files first, if success, then do the cleanup
      await this.#uploadFiles(filePath, opts.storageId);
      return filePath;
    } catch (error) {
      this.app.logger.error(`Error running backup task: ${error.message}`, { module: BACKUPS });
      fsPromises.unlink(path.join(this.#backupDir, `${fileBaseName}.${BACKUP_EXTENSION}`)).catch(() => {});
      throw new Error(this.#t('ERROR_TRIGGERING_BACKUP', this.#readableErrorMsg(error)));
    } finally {
      // cleanup
      this.#removeContentPath(contentPath).catch(() => {});
      // eslint-disable-next-line promise/catch-or-return
      this.#removeLockFile(fileBaseName)
        .catch(() => {})
        .finally(() => {
          // drop old backups
          if (opts.keep > 0) {
            this.#dropOldBackups(opts.keep).catch(() => {});
          }
        });
    }
  }

  #readableErrorMsg(error: Error) {
    const message = error.message;
    const { database } = this.#dbAdapter.dbOpts;
    const msg = message.replace(new RegExp(`.*data\\s+${database}`), '');
    if (msg.indexOf('pg_dump: error: aborting because of server version') !== -1) {
      return this.#t('PG_DUMP_SERVER_VERSION_MISMATCH');
    }

    return msg;
  }

  async #metadataBackup(opts: BackupSettings, dir: string) {
    const { dialect, underscored, tablePrefix, schema } = this.#dbAdapter.dbOpts;
    const installedPlugins = this.app.pm.getPlugins();
    const plugins = [...installedPlugins.values()]
      .filter((p) => p.enabled)
      .map((installed) => {
        return {
          name: installed.options.name,
          version: installed.options.version,
          packageName: installed.options.packageName,
        };
      });

    const metadata = {
      metadataVersion: BACKUP_METADATA_VERSION,
      enableFilesBackup: opts.enableFilesBackup,
      version: await this.app.version.get(),
      description: opts.description,
      database: {
        dialect,
        underscored,
        tablePrefix,
        schema,
        version: await getDBVersion(this.app.db),
        backupClientVersion: await this.#dbAdapter.clientVersion('backup'),
      },
      plugins,
    };
    const metadataFilePath = path.join(dir, METADATA_EXTENSION);
    try {
      await fsPromises.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      throw new Error(this.#t('ERROR_SAVING_MEATADATA', error.message));
    }
  }

  async #compressFiles(dir: string, fileBaseName: string, password: string | undefined, opts: BackupSettings) {
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    const filePath = path.join(this.#backupDir, `${fileBaseName}.${BACKUP_EXTENSION}`);
    const sourceMetadataFilePath = path.join(dir, METADATA_EXTENSION);
    const metadataFilePath = path.join(this.#backupDir, `${fileBaseName}${METADATA_EXTENSION}`);
    const outputFileStream = fs.createWriteStream(filePath);

    try {
      const output = await this.#createEncryptedStream(outputFileStream, password);

      // Create a promise that resolves when the 'close' event is fired
      const onClose = new Promise<void>((resolve, reject) => {
        output.on('close', () => {
          this.app.logger.info(`Backup file created: ${filePath}`, { module: BACKUPS });
          resolve();
        });

        output.on('end', () => {
          this.app.logger.info(`File ${filePath} has been drained`, { module: BACKUPS });
        });

        output.on('error', reject);

        archive.on('warning', (err) => {
          if (err.code === 'ENOENT') {
            this.app.logger.warn(err.message, { module: BACKUPS });
          } else {
            reject(err);
          }
        });

        archive.on('error', (err) => {
          reject(err);
        });
      });

      // Pipe the archive data directly to the final stream (either the cipher or output)
      archive.pipe(output);

      // Add the directory to the archive
      archive.directory(dir, false);

      if (opts.enableFilesBackup) {
        const fileCollections = [...this.app.db.collections.values()].filter((item) => {
          return item.options.template === 'file';
        });
        const filesPromises = fileCollections.map(async (collection) => {
          try {
            const files = await this.app.db.getRepository(collection.name).find({
              filter: {
                'storage.type': 'local',
              },
            });
            return {
              collectionName: collection.name,
              files,
            };
          } catch (error) {
            this.app.logger.warn(`Skip backing up files from collection "${collection.name}": ${error.message}`, {
              module: BACKUPS,
            });
            return {
              collectionName: collection.name,
              files: [],
            };
          }
        });
        const filesList = await Promise.all(filesPromises);
        for (const { collectionName, files } of filesList) {
          for (const file of files) {
            const backupFile = this.#getLocalFileForBackup(collectionName, file);
            if (!backupFile) {
              continue;
            }
            try {
              archive.file(backupFile.filePath, { name: backupFile.archiveName });
            } catch (error) {
              this.#warnSkipFileBackup(collectionName, file, error.message);
            }
          }
        }
      }

      // backup the aes key
      if (fs.existsSync(this.#aesKeyPath)) {
        archive.file(this.#aesKeyPath, { name: 'aes_key.dat' });
      }

      // Finalize the archive
      await archive.finalize();

      // Wait for the 'close' event
      await onClose;
      await fsPromises.copyFile(sourceMetadataFilePath, metadataFilePath);
    } catch (error) {
      this.app.logger.error(`Error compressing files: ${error.message}`, { module: BACKUPS });
      throw new Error(this.#t('ERROR_COMPRESSING_FILES', error.message));
    } finally {
      outputFileStream.close();
    }
    return filePath;
  }

  #getLocalFileForBackup(collectionName: string, file: any) {
    const filename = file.filename;
    if (typeof filename !== 'string' || filename.length === 0) {
      this.#warnSkipFileBackup(collectionName, file, 'Invalid filename');
      return null;
    }

    const filePath = file.path ?? '';
    if (typeof filePath !== 'string') {
      this.#warnSkipFileBackup(collectionName, file, 'Invalid path');
      return null;
    }

    const resolvedPath = path.resolve(this.#uploadDir, filePath, filename);
    const relativePath = path.relative(this.#uploadDir, resolvedPath);
    if (!relativePath || this.#hasPathTraversal(relativePath, path.sep) || path.isAbsolute(relativePath)) {
      this.#warnSkipFileBackup(collectionName, file, 'Path traversal is not allowed');
      return null;
    }

    const archiveName = path.posix.join('uploads', ...relativePath.split(path.sep));
    if (archiveName.includes('\\')) {
      this.#warnSkipFileBackup(collectionName, file, 'Invalid path');
      return null;
    }

    if (this.#hasPathTraversal(archiveName, path.posix.sep)) {
      this.#warnSkipFileBackup(collectionName, file, 'Path traversal is not allowed');
      return null;
    }

    return {
      filePath: resolvedPath,
      archiveName,
    };
  }

  #hasPathTraversal(filePath: string, separator: string) {
    return filePath === '..' || filePath.startsWith(`..${separator}`) || filePath.split(separator).includes('..');
  }

  #warnSkipFileBackup(collectionName: string, file: any, reason: string) {
    const recordId = file.id == null ? '' : ` id=${file.id}`;
    this.app.logger.warn(
      `Skip backing up invalid local file record from collection "${collectionName}"${recordId}: ${reason}`,
      {
        module: BACKUPS,
      },
    );
  }

  async #createEncryptedStream(output: fs.WriteStream, password?: string): Promise<Writable> {
    if (password) {
      const key = (await promisify(crypto.scrypt)(password, FILE_ENCRYPTION_SALT, 32)) as Uint8Array;
      const iv = crypto.randomBytes(16) as unknown as Uint8Array;

      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

      // Store the IV at the beginning of the file
      try {
        const written = output.write(iv);
        if (!written) {
          await new Promise<void>((resolve, reject) => {
            output.once('drain', resolve);
            output.once('error', reject);
          });
        }
      } catch (err) {
        this.app.logger.error(`Failed to write IV to the output stream: ${err.message}`, { module: BACKUPS });
        throw new Error(this.#t('ERROR_DECRYPTING_FILES', err.message));
      }

      // Pipe the cipher stream into the output stream
      cipher.pipe(output);
      return cipher;
    }

    // if no password, return the output stream
    return output;
  }

  async #uploadFiles(filePath: string, storageId?: string) {
    if (!storageId) {
      return;
    }
    try {
      const storage: StorageModel = await this.app.db.getRepository('storages').findOne({
        filterByTk: storageId,
      });
      if (!storage || storage.type === 'local') {
        this.app.logger.info(`Has not set cloud storage, skip backup file upload process`, { module: BACKUPS });
        return;
      }

      const Plugin = this.app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
      const data = await Plugin.uploadFile({
        filePath,
        storageName: storage.name,
      });
      this.app.logger.info(`Backup file uploaded to: ${data.filename}`, { module: BACKUPS });
    } catch (error) {
      this.app.logger.error(`Error uploading files: ${error.message}`, { module: BACKUPS });
      throw new Error(this.#t('ERROR_UPLOADING_FILES', error.message));
    }
  }

  async #createContentPath(contentPath: string) {
    try {
      await fsPromises.mkdir(contentPath, { recursive: true });
    } catch (error) {
      this.app.logger.error(`Error creating content path: ${error.message}`, { module: BACKUPS });
      throw new Error(this.#t('ERROR_CREATING_PATH', error.message));
    }
  }

  async #removeContentPath(contentPath: string) {
    try {
      await fsPromises.rm(contentPath, { recursive: true });
    } catch (error) {
      this.app.logger.error(`Error removing content path: ${error.message}`, { module: BACKUPS });
      throw new Error(this.#t('ERROR_REMOVING_FILES', error.message));
    }
  }

  async #createLockFile(fileBaseName: string) {
    const filePath = path.join(this.#tempDir, `${fileBaseName}.${BACKUP_EXTENSION}.lock`);
    try {
      await fsPromises.mkdir(this.#tempDir, { recursive: true });
      await fsPromises.writeFile(filePath, 'lock', 'utf8');
    } catch (error) {
      this.app.logger.error(`Error creating lock file: ${error.message}`, { module: BACKUPS });
      throw new Error(this.#t('ERROR_CREATING_LOCK_FILE', error.message));
    }
  }

  async #removeLockFile(fileBaseName: string) {
    const filePath = path.join(this.#tempDir, `${fileBaseName}.${BACKUP_EXTENSION}.lock`);
    try {
      await fsPromises.unlink(filePath);
    } catch (error) {
      this.app.logger.error(`Error removing lock file: ${error.message}`, { module: BACKUPS });
      throw new Error(this.#t('ERROR_REMOVING_FILES', error.message));
    }
  }

  #generateFileBaseName() {
    return `${this.#backupPrefix}${dayjs().format(`YYYYMMDD_HHmmss_${Math.floor(1000 + Math.random() * 9000)}`)}`;
  }

  async #listCompletedBackups(inProgressFiles: BackupFile[] = []): Promise<BackupFile[]> {
    let files: string[];
    try {
      files = await fsPromises.readdir(this.#backupDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      this.app.logger.error(`Error listing backup files: ${error.message}`, { module: BACKUPS });
      throw new Error(this.#t('ERROR_LISTING_BACKUPS', error.message));
    }
    // if same file name exists in lock files, then it means we are still generating the backup, so filter it out
    const inProgressFileNames = inProgressFiles.map((file) => file.name);
    const backupPromises = files
      .filter((file) => file.endsWith(`.${BACKUP_EXTENSION}`) && !inProgressFileNames.includes(file))
      .map(async (file): Promise<BackupFile> => {
        const fileBaseName = path.basename(file, `.${BACKUP_EXTENSION}`);
        const metadataFilePath = path.join(this.#backupDir, `${fileBaseName}${METADATA_EXTENSION}`);
        const [stats, description] = await Promise.all([
          fsPromises.stat(path.join(this.#backupDir, file)),
          this.#readBackupDescription(metadataFilePath),
        ]);
        return {
          name: file,
          fileSize: humanFileSize(stats.size),
          createdAt: stats.ctime,
          description,
          inProgress: false,
        };
      });
    const backups = await Promise.all(backupPromises);
    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async #readBackupDescription(metadataFilePath: string): Promise<string | undefined> {
    try {
      const metadata = JSON.parse(await fsPromises.readFile(metadataFilePath, 'utf8'));
      return typeof metadata?.description === 'string' ? metadata.description : undefined;
    } catch (_error) {
      return undefined;
    }
  }

  async #listProgressBackups(): Promise<BackupFile[]> {
    // list the lock(in progressing) files
    try {
      const files = await fsPromises.readdir(this.#tempDir);
      const backups = files
        .filter((file) => file.endsWith(`.${BACKUP_EXTENSION}.lock`))
        .map((file) => {
          return {
            name: file.replace('.lock', ''),
            inProgress: true,
          };
        });
      return backups;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      } else {
        this.app.logger.error(`Error listing lock files: ${error.message}`, { module: BACKUPS });
        throw new Error(this.#t('ERROR_LISTING_BACKUPS', error.message));
      }
    }
  }

  async #dropOldBackups(keep: number): Promise<void> {
    const inProgressBackups = await this.#listProgressBackups();
    const backups = await this.#listCompletedBackups(inProgressBackups);
    const files = backups.slice(keep);
    await Promise.all(files.map((file) => this.destroy(file.name)));
  }

  #t(message: string, detail?: string) {
    const t = this.ctx?.i18n.t || this.app.i18n.t;
    return t(message, { detail, ns: PLUGIN_BACKUPS_NAME, interpolation: { escapeValue: false } });
  }
}
