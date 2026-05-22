/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourcerContext } from '@nocobase/resourcer';
import * as crypto from 'crypto';
import fs from 'fs-extra';
import fsPromises from 'fs/promises';
import path from 'path';
import { storagePathJoin } from '@nocobase/utils';
import semver from 'semver';
import { Readable } from 'stream';
import { promisify } from 'util';
import { DBAdapter, getDBAdapter } from '../adapters/database';
import {
  Extractor,
  BACKUP_EXTENSION,
  BACKUPS,
  FILE_ENCRYPTION_SALT,
  getDBVersion,
  PLUGIN_BACKUPS_NAME,
  RESTORE_TASKS_CACHE_NAME,
  RESTORE_TASKS_CACHE_TTL,
  resolvePathWithinBase,
  toMajorVersion,
} from '../utils';
interface Metadata {
  version: string;
  database: {
    dialect: string;
    underscored: boolean;
    tablePrefix: string;
    schema: string;
    version?: string;
    backupClientVersion?: string;
  };
  enableFilesBackup: boolean;
  plugins: Array<{
    name: string;
    version: string;
    packageName: string;
  }>;
}

export interface RestoreOptions {
  forceSchemaRestore?: boolean;
  skipDropAllTables?: boolean;
}

const RESTORE_STEPS = {
  BEGIN: 'restoring begin',
  DATABASE: 'restoring database',
  UPLOADS: 'restoring uploaded files',
  END: 'restoring end',
} as const;

export class RestoreManager {
  ctx: ResourcerContext;
  #dbAdapter: DBAdapter;
  #restoreTasksCacheName: string;
  #backupDir: string;
  #tempDir: string;
  #uploadDir: string;
  #aesKeyPath: string;
  constructor(ctx: ResourcerContext, dbOptions?: any) {
    this.ctx = ctx;
    this.#dbAdapter = getDBAdapter(dbOptions || ctx.app.db.options);
    this.#restoreTasksCacheName = RESTORE_TASKS_CACHE_NAME;
    this.#backupDir = storagePathJoin('backups', ctx.app.name);
    this.#tempDir = storagePathJoin('tmp', 'backups', ctx.app.name);
    this.#uploadDir = storagePathJoin('uploads');
    this.#aesKeyPath = storagePathJoin('apps', ctx.app.name, 'aes_key.dat');
  }

  protected set backupDir(backupDir: string) {
    this.#backupDir = backupDir;
  }

  protected set tempDir(tempDir: string) {
    this.#tempDir = tempDir;
  }

  protected set uploadDir(uploadDir: string) {
    this.#uploadDir = uploadDir;
  }

  protected set restoreTasksCacheName(restoreTasksCacheName: string) {
    this.#restoreTasksCacheName = restoreTasksCacheName;
  }

  async restoreFromBackup(
    backupFileName: string,
    taskId: string,
    password?: string,
    tolerentMode?: boolean,
    options?: RestoreOptions,
  ): Promise<void> {
    const backupFilePath = this.#getValidatedBackupFilePath(backupFileName);
    await this.restore(backupFilePath, taskId, password, tolerentMode, undefined, options);
  }

  async restoreFromUpload(
    backupFile: Express.Multer.File,
    taskId: string,
    password?: string,
    tolerentMode?: boolean,
    options?: RestoreOptions,
  ): Promise<void> {
    const backupFilePath = backupFile.path;
    await this.restore(backupFilePath, taskId, password, tolerentMode, undefined, options);
  }

  async restoreCLI(
    filePath: string,
    password?: string,
    tolerentMode?: boolean,
    skipRevertOnError?: boolean,
    options?: RestoreOptions,
  ) {
    await this.#dbAdapter.check('restore');
    const extractedDir = await this.#decompressFiles(filePath, password);
    const backupFiles = await fsPromises.readdir(extractedDir);
    const dbFile = backupFiles.find((file) => file === 'data');
    const metadataFile = backupFiles.find((file) => file === '_metadata.json');
    const uploadsExist = backupFiles.includes('uploads');
    if (!dbFile || !metadataFile) {
      this.ctx.logger.error('Not a valid backup file', { module: BACKUPS });
      throw new Error(this.#t('Not a valid backup file'));
    }
    // check the metadata file
    const metadata = await this.#parseMetadataFile(path.join(extractedDir, metadataFile), tolerentMode, options);
    try {
      await this.#restoreDataCLI(extractedDir, dbFile, uploadsExist, metadata, options);
    } catch (error) {
      const dbVersion = await getDBVersion(this.ctx.app.db);
      const restoreClientVersion = await this.#dbAdapter.clientVersion('restore');
      this.ctx.logger.error(
        `Error restoring backup: "${error.message}".
        Database Version: backup[${metadata.database.version}], current[${dbVersion}],
        Client Version: backup[${metadata.database.backupClientVersion}], restore[${restoreClientVersion}]
        `,
        { module: BACKUPS },
      );
      if (tolerentMode && error.message.includes('ignored')) {
        // if the error was ignored by db client
        this.ctx.logger.warn('Tolerent mode enabled, ignoring the error and continue the upgrade.', {
          module: BACKUPS,
        });
        await this.#restoreFilesAndCleanup(uploadsExist, extractedDir);
        // await sleep(5000); // wait for the client to show the error message, for debug
        await this.ctx.app.upgrade();
      } else if (!skipRevertOnError) {
        await this.#revertDbRestore();
      }
    }
  }

  #getValidatedBackupFilePath(backupFileName: string): string {
    const filePath = resolvePathWithinBase(this.#backupDir, backupFileName);
    if (
      path.basename(backupFileName) !== backupFileName ||
      !backupFileName.endsWith(`.${BACKUP_EXTENSION}`) ||
      !filePath ||
      !fs.existsSync(filePath)
    ) {
      throw new Error(this.#t('FILE_NOT_FOUND', backupFileName));
    }

    return filePath;
  }

  async #restoreDataCLI(
    extractedDir: string,
    dbFile: string,
    restoreUploads: boolean,
    metadata: Metadata,
    options?: RestoreOptions,
  ): Promise<void> {
    const tmpBackupDir = path.join(this.#tempDir, 'before-restore');
    try {
      await fs.mkdir(tmpBackupDir, { recursive: true });
      // ensure the app cleaned before restoring the database
      await this.ctx.app.emitAsync('beforeStop');
      await this.ctx.app.emitAsync('afterStop');
      await this.#dbAdapter.restore({
        filePath: path.join(extractedDir, dbFile),
        schema: metadata.database.schema,
        skipDropAllTables: options?.skipDropAllTables === true,
      });
      this.ctx.logger.info('Database restored successfully', { module: BACKUPS });
      // copy the uploads directory
      await this.#restoreFilesAndCleanup(restoreUploads, extractedDir);
    } catch (error) {
      this.ctx.logger.error(`Error restoring backup: ${error.message}. Trying to revert the backup process`, {
        module: BACKUPS,
      });
      throw error;
    }
  }

  protected async getStatusCache() {
    try {
      return this.ctx.app.cacheManager.getCache(this.#restoreTasksCacheName);
    } catch (e) {
      return await this.ctx.app.cacheManager.createCache({
        name: this.#restoreTasksCacheName,
        store: 'memory',
        ttl: RESTORE_TASKS_CACHE_TTL,
        max: 10,
      });
    }
  }

  async restore(
    filePath: string,
    taskId: string,
    password?: string,
    tolerentMode?: boolean,
    skipRevertOnError?: boolean,
    options?: RestoreOptions,
  ): Promise<void> {
    await this.#dbAdapter.check('restore');
    const extractedDir = await this.#decompressFiles(filePath, password);
    const backupFiles = await fsPromises.readdir(extractedDir);
    const dbFile = backupFiles.find((file) => file === 'data');
    const metadataFile = backupFiles.find((file) => file === '_metadata.json');
    const uploadsExist = backupFiles.includes('uploads');
    if (!dbFile || !metadataFile) {
      this.ctx.logger.error('Not a valid backup file', { module: BACKUPS });
      throw new Error(this.#t('Not a valid backup file'));
    }
    // check the metadata file
    const metadata = await this.#parseMetadataFile(path.join(extractedDir, metadataFile), tolerentMode, options);
    this.#restoreData(extractedDir, dbFile, uploadsExist, taskId, metadata, options).catch(async (error) => {
      try {
        const dbVersion = await getDBVersion(this.ctx.app.db);
        const restoreClientVersion = await this.#dbAdapter.clientVersion('restore');
        this.ctx.logger.error(
          `Error restoring backup: "${error.message}".
          Database Version: backup[${metadata.database.version}], current[${dbVersion}],
          Client Version: backup[${metadata.database.backupClientVersion}], restore[${restoreClientVersion}]
          `,
          { module: BACKUPS },
        );
        if (tolerentMode && error.message.includes('ignored')) {
          // if the error was ignored by db client
          this.ctx.logger.warn('Tolerent mode enabled, ignoring the error and continue the upgrade.', {
            module: BACKUPS,
          });
          await this.#restoreFilesAndCleanup(uploadsExist, extractedDir);
          // await sleep(5000); // wait for the client to show the error message, for debug
          await this.ctx.app.runCommand('upgrade');
        } else {
          if (!tolerentMode && this.#dbAdapter.dbOpts.dialect === 'postgres') {
            const backupClientVersion = Number(toMajorVersion(metadata.database.backupClientVersion));
            const dbServerVersion = Number(toMajorVersion(dbVersion));
            if (backupClientVersion > 16 && dbServerVersion <= 16) {
              // pg_dump 17 introduced some incompatible options, give user a friendly message
              const statusCache = await this.getStatusCache();
              await statusCache.set(taskId, {
                message: this.#t('ERROR_PG_DUMP_LT_17'),
              });
            }
          }
          if (!skipRevertOnError) {
            await this.#revertDbRestore();
          }
          await this.ctx.app.runCommand('upgrade');
        }
      } catch (err) {
        this.ctx.logger.error(`Error handling restore failure: ${err.message}`, { module: BACKUPS });
      }
    });
  }

  async #parseMetadataFile(filePath: string, tolerentMode: boolean, options?: RestoreOptions) {
    let metadata: Metadata;
    try {
      const metadataContent = await fsPromises.readFile(filePath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      this.ctx.logger.error(`Error parsing metadata file: ${error.message}`, { module: BACKUPS });
      throw new Error(this.#t('ERROR_PARSING_BACKUP_FILE', error.message));
    }
    await this.#assertMetadata(metadata, tolerentMode, options);
    return metadata;
  }

  async #assertMetadata(metadata: Metadata, tolerentMode: boolean, options?: RestoreOptions): Promise<boolean> {
    const { version: backupVersion } = metadata;
    const packageVersion = this.ctx.app.getPackageVersion();
    const extractVersion = (version: string) => {
      const match = version.match(/^(\d+\.\d+\.\d+)/);
      return match ? match[0] : version;
    };
    if (semver.gt(extractVersion(backupVersion), extractVersion(packageVersion))) {
      throw new Error(this.#t('BACKUP_VERSION_MISMATCH', { backupVersion, currentVersion: packageVersion }));
    }
    const { dialect, underscored, tablePrefix, schema } = this.#dbAdapter.dbOpts;
    if (metadata.database.dialect !== dialect) {
      throw new Error(this.#t('Database dialect mismatch'));
    }
    if ((metadata.database.underscored || false) != (underscored || false)) {
      throw new Error(this.#t('Database underscored mismatch'));
    }
    if ((metadata.database.tablePrefix || '') !== (tablePrefix || '')) {
      throw new Error(this.#t('Database table prefix mismatch'));
    }

    const forceSchemaRestore = options?.forceSchemaRestore === true && dialect === 'postgres';
    if (!forceSchemaRestore) {
      if (this.ctx.request?.body?.dbSchema && this.ctx.request?.body?.dbSchema !== (schema || 'public')) {
        throw new Error(this.#t('Database schema mismatch'));
      }

      if (!this.ctx.request?.body?.dbSchema && (schema || '') !== (metadata.database.schema || '')) {
        throw new Error(this.#t('Database schema mismatch'));
      }
    }

    const dbVersionInBackup = toMajorVersion(metadata.database.version);
    if (!tolerentMode && dbVersionInBackup) {
      const dbVersionRaw = await getDBVersion(this.ctx.app.db);
      const dbVersion = toMajorVersion(dbVersionRaw);
      if (dbVersionInBackup > dbVersion) {
        throw new Error(
          this.#t(
            'Database version is lower than the backup, if you really want to restore, please enable the tolerent mode.',
          ),
        );
      }
    }

    const pluginsInBackup = metadata.plugins;
    const missingPlugins = pluginsInBackup.filter((plugin) => {
      try {
        require.resolve(plugin.packageName);
        return false;
      } catch (error) {
        return true;
      }
    });
    if (missingPlugins.length) {
      const missingPluginsMsg = this.#t(
        'WARN_RESTORING_BACKUP_MISSING_PLUGINS',
        missingPlugins.map((plugin) => plugin.name).join(', '),
      );
      this.ctx.logger.warn(missingPluginsMsg, {
        module: BACKUPS,
      });
    }
    return true;
  }

  async #decompressFiles(filePath: string, password?: string): Promise<string> {
    const fileBaseName = path.basename(filePath, `.${BACKUP_EXTENSION}`);
    const outputDir = path.join(this.#tempDir, fileBaseName);
    const inputFileStream = fs.createReadStream(filePath);
    let inputStream: Readable | null = null;

    try {
      await fsPromises.mkdir(outputDir, { recursive: true });
      // Assign inputStream within the try block after creating the stream
      inputStream = await this.#createDecryptedStream(inputFileStream, password);
      const extractor = new Extractor({ path: outputDir });

      // Use pipeline for better error handling in streams
      const pipeline = promisify(require('stream').pipeline);
      await pipeline(inputStream, extractor);

      this.ctx.logger.info(`Backup file extracted to: ${outputDir}`, { module: BACKUPS });
    } catch (error) {
      this.ctx.logger.error(`Error decrypting file: ${error.message}. Please confirm your password.`, {
        module: BACKUPS,
      });
      throw new Error(this.#t('ERROR_DECRYPTING_PLS_CHECK_PASSWORD', error.message));
    } finally {
      // Ensure input file stream is always closed
      if (!inputFileStream.closed) {
        inputFileStream.close();
      }
      // Ensure the potentially intermediate decipher stream is destroyed
      // Check if inputStream was assigned and is different from inputFileStream
      if (inputStream && inputStream !== inputFileStream && !inputStream.destroyed) {
        inputStream.destroy();
      }
    }
    return outputDir;
  }

  async #createDecryptedStream(input: fs.ReadStream, password?: string): Promise<Readable> {
    if (!password) {
      // If no password, return the input stream directly
      return input;
    }

    // If password provided, attempt decryption
    try {
      // Read the IV (first 16 bytes)
      const iv = await new Promise<Buffer>((resolve, reject) => {
        let ivBuffer = Buffer.alloc(0);
        const onReadable = () => {
          let chunk;
          while (null !== (chunk = input.read(16 - ivBuffer.length))) {
            ivBuffer = Buffer.concat([ivBuffer, chunk]);
            if (ivBuffer.length === 16) {
              input.removeListener('readable', onReadable); // Clean up listener
              resolve(ivBuffer);
              return;
            }
          }
          // If read returns null but we don't have 16 bytes yet, wait for more data or end
        };
        input.once('error', (err) => {
          input.removeListener('readable', onReadable); // Clean up listener
          reject(err);
        });
        input.once('end', () => {
          input.removeListener('readable', onReadable); // Clean up listener
          if (ivBuffer.length < 16) {
            reject(
              new Error('Failed to read complete 16-byte IV from stream. File may be too short or not encrypted.'),
            );
          }
        });
        input.on('readable', onReadable);
      });

      const key = (await promisify(crypto.scrypt)(password, FILE_ENCRYPTION_SALT, 32)) as Buffer; // Use Buffer directly
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

      // Forward errors from decipher to the pipeline
      decipher.on('error', (err) => {
        this.ctx.logger.error(`Decryption error: ${err.message}.`, { module: BACKUPS });
        // Let the pipeline handle the error propagation
      });

      return input.pipe(decipher);
    } catch (error) {
      this.ctx.logger.error(`Error setting up decryption stream: ${error.message}`, { module: BACKUPS });
      // Re-throw the error to be caught by #decompressFiles
      throw error;
    }
  }

  async #restoreData(
    extractedDir: string,
    dbFile: string,
    restoreUploads: boolean,
    taskId: string,
    metadata: Metadata,
    options?: RestoreOptions,
  ): Promise<void> {
    this.#notify(RESTORE_STEPS.BEGIN);
    // restore the database
    this.#notify(RESTORE_STEPS.DATABASE);
    const statusCache = await this.getStatusCache();
    const tmpBackupDir = path.join(this.#tempDir, 'before-restore');
    try {
      await fsPromises.mkdir(tmpBackupDir, { recursive: true });
      await this.#dbAdapter.backup({ dir: tmpBackupDir });

      // ensure the app cleaned before restoring the database
      await this.ctx.app.emitAsync('beforeStop');
      await this.ctx.app.emitAsync('afterStop');

      await this.#dbAdapter.restore({
        filePath: path.join(extractedDir, dbFile),
        schema: metadata.database.schema,
        skipDropAllTables: options?.skipDropAllTables === true,
      });
      this.ctx.logger.info('Database restored successfully', { module: BACKUPS });
      // copy the uploads directory
      if (restoreUploads) {
        this.#notify(RESTORE_STEPS.UPLOADS);
      }
      await this.#restoreFilesAndCleanup(restoreUploads, extractedDir);
    } catch (error) {
      await statusCache.set(taskId, {
        inProgress: false,
        message: error.message,
      });
      this.ctx.logger.error(`Error restoring backup: ${error.message}. Trying to revert the backup process`, {
        module: BACKUPS,
      });
      throw error;
    } finally {
      this.#notify(RESTORE_STEPS.END);
    }
    await statusCache.set(taskId, {
      inProgress: false,
    });
    await this.ctx.app.runCommand('upgrade');
  }

  async #restoreFilesAndCleanup(restoreUploads: boolean, extractedDir: string) {
    if (restoreUploads) {
      const uploadsDir = path.join(extractedDir, 'uploads');
      await fsPromises.mkdir(this.#uploadDir, { recursive: true });
      // overwrite the existing uploads directory
      await fs.copy(uploadsDir, this.#uploadDir, { overwrite: true });
    }
    // restore the aes key
    const aesKeyPath = path.join(extractedDir, 'aes_key.dat');
    if (await fs.pathExists(aesKeyPath)) {
      await fs.copy(aesKeyPath, this.#aesKeyPath, { overwrite: true });
    }
    // cleanup the temp directory
    fs.rm(extractedDir, { recursive: true }).catch((e) => {
      this.ctx.logger.error(`Error cleaning up the temp directory: ${e.message}`, { module: BACKUPS });
    });
  }

  async #revertDbRestore() {
    this.ctx.logger.info('Reverting the database restore process', { module: BACKUPS });
    const dbFile = path.join(this.#tempDir, 'before-restore', 'data');
    if (await fs.pathExists(dbFile)) {
      try {
        await this.#dbAdapter.restore({ filePath: dbFile, schema: this.#dbAdapter.dbOpts.schema });
      } catch (error) {
        this.ctx.logger.error('Error reverting the database restore process', { module: BACKUPS });
      }
    } else {
      this.ctx.logger.error('Database backup file for revert restore process not found', { module: BACKUPS });
    }
  }

  async #notify(step: string) {
    const app = await this.ctx.app; //await AppSupervisor.getInstance().getApp('main');
    if (step === RESTORE_STEPS.BEGIN) {
      app.emit('maintaining', { status: 'command_begin' });
      return;
    }
    if (step === RESTORE_STEPS.END) {
      app.emit('maintaining', { status: 'command_end' });
      return;
    }
    app.emit('maintainingMessageChanged', {
      message: `${step}...`,
      maintainingStatus: {
        command: {
          name: 'APP restoring',
        },
        status: 'command_running',
      },
    });
  }

  #t(message: string, detail?: string | Record<string, string>) {
    if (typeof detail === 'object') {
      return this.ctx.i18n.t(message, { ...detail, ns: PLUGIN_BACKUPS_NAME, interpolation: { escapeValue: false } });
    }
    return this.ctx.i18n.t(message, { detail, ns: PLUGIN_BACKUPS_NAME, interpolation: { escapeValue: false } });
  }
}
