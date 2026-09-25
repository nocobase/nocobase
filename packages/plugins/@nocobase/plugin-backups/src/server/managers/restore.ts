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
import { DBAdapter, DBBackupToolchain, getDBAdapter } from '../adapters/database';
import {
  Extractor,
  BACKUP_EXTENSION,
  BACKUPS,
  ENCRYPTION_FIELD_KEYS_DIRECTORY,
  FILE_ENCRYPTION_SALT,
  getDBVersion,
  PLUGIN_BACKUPS_NAME,
  RESTORE_TASKS_CACHE_NAME,
  RESTORE_TASKS_CACHE_TTL,
  resolvePathWithinBase,
  toMajorVersion,
} from '../utils';
interface Metadata {
  metadataVersion?: number;
  partialBackupMode?: string;
  version: string;
  database: {
    dialect: string;
    toolchain?: DBBackupToolchain;
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

interface EncryptionFieldKeysRestoreState {
  previousPath?: string;
  restoredPath?: string;
  previousKeysActive?: boolean;
  restoreFailed?: boolean;
}

class RestoreDataError extends Error {
  encryptionFieldKeysRestore?: EncryptionFieldKeysRestoreState;

  constructor(error: unknown, encryptionFieldKeysRestore?: EncryptionFieldKeysRestoreState) {
    super(error instanceof Error ? error.message : String(error));
    this.name = 'RestoreDataError';
    this.encryptionFieldKeysRestore = encryptionFieldKeysRestore;
    if (error instanceof Error && error.stack) {
      this.stack = error.stack;
    }
  }
}

export interface RestoreOptions {
  forceSchemaRestore?: boolean;
  skipDropAllTables?: boolean;
  restoreMode?: 'preserveTables';
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
  #encryptionFieldKeysPath: string;
  constructor(ctx: ResourcerContext, dbOptions?: any) {
    this.ctx = ctx;
    this.#dbAdapter = getDBAdapter(dbOptions || ctx.app.db.options);
    this.#restoreTasksCacheName = RESTORE_TASKS_CACHE_NAME;
    this.#backupDir = storagePathJoin('backups', ctx.app.name);
    this.#tempDir = storagePathJoin('tmp', 'backups', ctx.app.name);
    this.#uploadDir = storagePathJoin('uploads');
    this.#aesKeyPath = storagePathJoin('apps', ctx.app.name, 'aes_key.dat');
    this.#encryptionFieldKeysPath = storagePathJoin('apps', ctx.app.name, ENCRYPTION_FIELD_KEYS_DIRECTORY);
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
    try {
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
        const restoreError = error instanceof RestoreDataError ? error : new RestoreDataError(error, undefined);
        await this.#logRestoreError(restoreError, metadata);
        if (tolerentMode && restoreError.message.includes('ignored')) {
          // if the error was ignored by db client
          this.ctx.logger.warn('Tolerent mode enabled, ignoring the error and continue the upgrade.', {
            module: BACKUPS,
          });
          const encryptionFieldKeysRestore = await this.#restoreFilesForTolerentMode(
            uploadsExist,
            extractedDir,
            restoreError.encryptionFieldKeysRestore,
          );
          // await sleep(5000); // wait for the client to show the error message, for debug
          await this.ctx.app.upgrade();
          await this.#commitEncryptionFieldKeysRestore(encryptionFieldKeysRestore);
        } else if (!skipRevertOnError) {
          const databaseReverted = await this.#revertDbRestore();
          if (databaseReverted) {
            const encryptionFieldKeysReverted = await this.#rollbackEncryptionFieldKeysRestore(
              restoreError.encryptionFieldKeysRestore,
            );
            if (!encryptionFieldKeysReverted) {
              throw new RestoreDataError(
                'Failed to roll back the encryption field keys',
                restoreError.encryptionFieldKeysRestore,
              );
            }
          } else {
            const encryptionFieldKeysActivated = await this.#activateRestoredEncryptionFieldKeys(
              restoreError.encryptionFieldKeysRestore,
            );
            if (!encryptionFieldKeysActivated) {
              throw new RestoreDataError(
                'Failed to activate the restored encryption field keys',
                restoreError.encryptionFieldKeysRestore,
              );
            }
          }
        } else {
          const encryptionFieldKeysActivated = await this.#activateRestoredEncryptionFieldKeys(
            restoreError.encryptionFieldKeysRestore,
          );
          if (!encryptionFieldKeysActivated) {
            throw new RestoreDataError(
              'Failed to activate the restored encryption field keys',
              restoreError.encryptionFieldKeysRestore,
            );
          }
        }
      }
    } finally {
      await this.#cleanupExtractedDir(extractedDir);
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
    let encryptionFieldKeysRestore: EncryptionFieldKeysRestoreState | undefined;
    try {
      await fs.mkdir(tmpBackupDir, { recursive: true });
      // ensure the app cleaned before restoring the database
      await this.ctx.app.emitAsync('beforeStop');
      await this.ctx.app.emitAsync('afterStop');
      await this.#dbAdapter.restore({
        filePath: path.join(extractedDir, dbFile),
        schema: metadata.database.schema,
        skipDropAllTables: options?.skipDropAllTables === true,
        restoreMode: options?.restoreMode,
        toolchain: this.#resolveRestoreToolchain(metadata),
      });
      this.ctx.logger.info('Database restored successfully', { module: BACKUPS });
      // copy the uploads directory
      encryptionFieldKeysRestore = await this.#restoreFilesAndCleanup(restoreUploads, extractedDir);
      await this.#commitEncryptionFieldKeysRestore(encryptionFieldKeysRestore);
    } catch (error) {
      const restoreError =
        error instanceof RestoreDataError ? error : new RestoreDataError(error, encryptionFieldKeysRestore);
      this.ctx.logger.error(`Error restoring backup: ${restoreError.message}. Trying to revert the backup process`, {
        module: BACKUPS,
      });
      throw restoreError;
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
    let dbFile: string;
    let uploadsExist: boolean;
    let metadata: Metadata;
    try {
      const backupFiles = await fsPromises.readdir(extractedDir);
      const foundDbFile = backupFiles.find((file) => file === 'data');
      const metadataFile = backupFiles.find((file) => file === '_metadata.json');
      uploadsExist = backupFiles.includes('uploads');
      if (!foundDbFile || !metadataFile) {
        this.ctx.logger.error('Not a valid backup file', { module: BACKUPS });
        throw new Error(this.#t('Not a valid backup file'));
      }
      dbFile = foundDbFile;
      // check the metadata file
      metadata = await this.#parseMetadataFile(path.join(extractedDir, metadataFile), tolerentMode, options);
    } catch (error) {
      await this.#cleanupExtractedDir(extractedDir);
      throw error;
    }

    this.#restoreData(extractedDir, dbFile, uploadsExist, taskId, metadata, options)
      .catch(async (error) => {
        const restoreError = error instanceof RestoreDataError ? error : new RestoreDataError(error, undefined);
        const dbVersion = await this.#logRestoreError(restoreError, metadata);
        try {
          if (tolerentMode && restoreError.message.includes('ignored')) {
            // if the error was ignored by db client
            this.ctx.logger.warn('Tolerent mode enabled, ignoring the error and continue the upgrade.', {
              module: BACKUPS,
            });
            const encryptionFieldKeysRestore = await this.#restoreFilesForTolerentMode(
              uploadsExist,
              extractedDir,
              restoreError.encryptionFieldKeysRestore,
            );
            // await sleep(5000); // wait for the client to show the error message, for debug
            await this.ctx.app.runCommand('upgrade');
            await this.#commitEncryptionFieldKeysRestore(encryptionFieldKeysRestore);
          } else {
            if (!tolerentMode && dbVersion && this.#isPostgresLikeDialect(this.#dbAdapter.dbOpts.dialect)) {
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
            let databaseReverted = false;
            if (!skipRevertOnError) {
              databaseReverted = await this.#revertDbRestore();
            }
            if (databaseReverted) {
              const encryptionFieldKeysReverted = await this.#rollbackEncryptionFieldKeysRestore(
                restoreError.encryptionFieldKeysRestore,
              );
              if (!encryptionFieldKeysReverted) {
                return;
              }
            } else {
              const encryptionFieldKeysActivated = await this.#activateRestoredEncryptionFieldKeys(
                restoreError.encryptionFieldKeysRestore,
              );
              if (!encryptionFieldKeysActivated) {
                return;
              }
            }
            await this.ctx.app.runCommand('upgrade');
          }
        } catch (err) {
          this.ctx.logger.error(`Error handling restore failure: ${err.message}`, { module: BACKUPS });
        }
      })
      .finally(async () => {
        await this.#cleanupExtractedDir(extractedDir);
      })
      .catch((error) => {
        this.ctx.logger.error(`Error finalizing restore: ${error.message}`, { module: BACKUPS });
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

    const forceSchemaRestore = options?.forceSchemaRestore === true && this.#isPostgresLikeDialect(dialect);
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

  #isPostgresLikeDialect(dialect: string) {
    return dialect === 'postgres' || dialect === 'kingbase';
  }

  #resolveRestoreToolchain(metadata: Metadata): DBBackupToolchain | undefined {
    if (metadata.database.dialect !== 'kingbase') {
      return undefined;
    }

    if (metadata.database.toolchain === 'kingbase' || metadata.database.toolchain === 'postgres') {
      return metadata.database.toolchain;
    }

    const backupClientVersion = metadata.database.backupClientVersion || '';
    if (/sys_dump/i.test(backupClientVersion)) {
      return 'kingbase';
    }
    if (/pg_dump|postgresql/i.test(backupClientVersion)) {
      return 'postgres';
    }

    return this.#dbAdapter.backupToolchain;
  }

  async #decompressFiles(filePath: string, password?: string): Promise<string> {
    const fileBaseName = path.basename(filePath, `.${BACKUP_EXTENSION}`);
    await fsPromises.mkdir(this.#tempDir, { recursive: true });
    const outputDir = await fsPromises.mkdtemp(path.join(this.#tempDir, `${fileBaseName}-`));
    const inputFileStream = fs.createReadStream(filePath);
    let inputStream: Readable | null = null;

    try {
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
      await this.#cleanupExtractedDir(outputDir);
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
    let encryptionFieldKeysRestore: EncryptionFieldKeysRestoreState | undefined;
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
        restoreMode: options?.restoreMode,
        toolchain: this.#resolveRestoreToolchain(metadata),
      });
      this.ctx.logger.info('Database restored successfully', { module: BACKUPS });
      // copy the uploads directory
      if (restoreUploads) {
        this.#notify(RESTORE_STEPS.UPLOADS);
      }
      encryptionFieldKeysRestore = await this.#restoreFilesAndCleanup(restoreUploads, extractedDir);
      await statusCache.set(taskId, {
        inProgress: false,
      });
      await this.ctx.app.runCommand('upgrade');
      await this.#commitEncryptionFieldKeysRestore(encryptionFieldKeysRestore);
    } catch (error) {
      const restoreError =
        error instanceof RestoreDataError ? error : new RestoreDataError(error, encryptionFieldKeysRestore);
      try {
        await statusCache.set(taskId, {
          inProgress: false,
          message: restoreError.message,
        });
      } catch (statusError) {
        this.ctx.logger.error(`Error updating restore task status: ${statusError.message}`, { module: BACKUPS });
      }
      this.ctx.logger.error(`Error restoring backup: ${restoreError.message}. Trying to revert the backup process`, {
        module: BACKUPS,
      });
      throw restoreError;
    } finally {
      this.#notify(RESTORE_STEPS.END);
    }
  }

  async #restoreFilesAndCleanup(
    restoreUploads: boolean,
    extractedDir: string,
  ): Promise<EncryptionFieldKeysRestoreState | undefined> {
    const encryptionFieldKeysRestore = await this.#restoreEncryptionFieldKeys(extractedDir);
    try {
      await this.#restoreUploadsAndAesKey(restoreUploads, extractedDir);
    } catch (error) {
      throw new RestoreDataError(error, encryptionFieldKeysRestore);
    }
    return encryptionFieldKeysRestore;
  }

  async #restoreUploadsAndAesKey(restoreUploads: boolean, extractedDir: string): Promise<void> {
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
  }

  async #restoreFilesForTolerentMode(
    restoreUploads: boolean,
    extractedDir: string,
    restoreState: EncryptionFieldKeysRestoreState | undefined,
  ): Promise<EncryptionFieldKeysRestoreState | undefined> {
    let encryptionFieldKeysRestore = restoreState;
    if (!encryptionFieldKeysRestore) {
      try {
        return await this.#restoreFilesAndCleanup(restoreUploads, extractedDir);
      } catch (error) {
        const restoreError = error instanceof RestoreDataError ? error : new RestoreDataError(error, undefined);
        if (!restoreError.encryptionFieldKeysRestore?.restoreFailed) {
          throw error;
        }
        encryptionFieldKeysRestore = restoreError.encryptionFieldKeysRestore;
      }
    }

    if (encryptionFieldKeysRestore.restoreFailed) {
      const encryptionFieldKeysActivated = await this.#activateRestoredEncryptionFieldKeys(encryptionFieldKeysRestore);
      if (!encryptionFieldKeysActivated) {
        throw new RestoreDataError('Failed to activate the restored encryption field keys', encryptionFieldKeysRestore);
      }
      try {
        await this.#restoreUploadsAndAesKey(restoreUploads, extractedDir);
      } catch (error) {
        throw new RestoreDataError(error, encryptionFieldKeysRestore);
      }
    }
    return encryptionFieldKeysRestore;
  }

  async #restoreEncryptionFieldKeys(extractedDir: string): Promise<EncryptionFieldKeysRestoreState | undefined> {
    const sourcePath = path.join(extractedDir, ENCRYPTION_FIELD_KEYS_DIRECTORY);
    let sourceStat: fs.Stats;
    try {
      sourceStat = await fsPromises.lstat(sourcePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Backups created before encryption field keys were included must keep the current keys.
        return undefined;
      }
      throw new RestoreDataError(error, { restoreFailed: true });
    }
    if (!sourceStat.isDirectory()) {
      throw new RestoreDataError(this.#t('Not a valid backup file'), { restoreFailed: true });
    }

    let keyEntries: fs.Dirent[];
    try {
      keyEntries = (await fsPromises.readdir(sourcePath, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && path.extname(entry.name) === '.key')
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch (error) {
      throw new RestoreDataError(error, { restoreFailed: true });
    }

    const parentPath = path.dirname(this.#encryptionFieldKeysPath);
    let stagingPath: string | undefined;
    try {
      await fsPromises.mkdir(parentPath, { recursive: true });
      stagingPath = await fsPromises.mkdtemp(path.join(parentPath, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-`));
      if (process.platform !== 'win32') {
        await fsPromises.chmod(stagingPath, 0o700);
      }
      for (const entry of keyEntries) {
        const sourceKeyPath = path.join(sourcePath, entry.name);
        const stagedKeyPath = path.join(stagingPath, entry.name);
        await fsPromises.copyFile(sourceKeyPath, stagedKeyPath);
        if (process.platform !== 'win32') {
          await fsPromises.chmod(stagedKeyPath, 0o600);
        }
      }
    } catch (error) {
      await this.#cleanupEncryptionFieldKeysDirectory(stagingPath, 'incomplete staged');
      throw new RestoreDataError(error, { restoreFailed: true });
    }
    if (!stagingPath) {
      throw new RestoreDataError('Failed to prepare the encryption field keys', { restoreFailed: true });
    }

    const previousPath = path.join(parentPath, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-${crypto.randomUUID()}`);
    let hadPreviousKeys = false;
    let previousMoved = false;

    try {
      try {
        await fsPromises.lstat(this.#encryptionFieldKeysPath);
        hadPreviousKeys = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw new RestoreDataError(error, {
            restoredPath: stagingPath,
            previousKeysActive: true,
            restoreFailed: true,
          });
        }
      }

      if (hadPreviousKeys) {
        try {
          await fsPromises.rename(this.#encryptionFieldKeysPath, previousPath);
          previousMoved = true;
        } catch (error) {
          throw new RestoreDataError(error, {
            restoredPath: stagingPath,
            previousKeysActive: true,
            restoreFailed: true,
          });
        }
      }

      try {
        await fsPromises.rename(stagingPath, this.#encryptionFieldKeysPath);
      } catch (installError) {
        if (previousMoved) {
          try {
            await fsPromises.rename(previousPath, this.#encryptionFieldKeysPath);
            previousMoved = false;
          } catch (rollbackError) {
            this.ctx.logger.error(
              `Failed to restore the previous encryption field keys. The keys were preserved at "${previousPath}": ${rollbackError.message}`,
              { module: BACKUPS },
            );
            throw new RestoreDataError(
              new Error(
                `Failed to install encryption field keys: ${installError.message}. Failed to restore the previous keys; they were preserved at "${previousPath}": ${rollbackError.message}`,
              ),
              {
                previousPath,
                restoredPath: stagingPath,
                restoreFailed: true,
              },
            );
          }
        }
        throw new RestoreDataError(installError, {
          restoredPath: stagingPath,
          previousKeysActive: hadPreviousKeys,
          restoreFailed: true,
        });
      }
      return {
        previousPath: previousMoved ? previousPath : undefined,
      };
    } catch (error) {
      const preserveStagingPath =
        error instanceof RestoreDataError && error.encryptionFieldKeysRestore?.restoredPath === stagingPath;
      if (!preserveStagingPath) {
        await this.#cleanupEncryptionFieldKeysDirectory(stagingPath, 'staged');
      }
      throw error instanceof RestoreDataError ? error : new RestoreDataError(error, { restoreFailed: true });
    }
  }

  async #commitEncryptionFieldKeysRestore(restoreState: EncryptionFieldKeysRestoreState | undefined): Promise<void> {
    if (!restoreState?.previousPath) {
      return;
    }
    try {
      await fsPromises.rm(restoreState.previousPath, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    } catch (error) {
      this.ctx.logger.error(
        `Error cleaning up previous encryption field keys directory "${restoreState.previousPath}": ${error.message}`,
        { module: BACKUPS },
      );
    }
  }

  async #rollbackEncryptionFieldKeysRestore(
    restoreState: EncryptionFieldKeysRestoreState | undefined,
  ): Promise<boolean> {
    if (!restoreState) {
      return true;
    }

    if (restoreState.restoreFailed) {
      if (!restoreState.previousKeysActive && restoreState.previousPath) {
        try {
          await fsPromises.rename(restoreState.previousPath, this.#encryptionFieldKeysPath);
        } catch (rollbackError) {
          const restoredKeysLocation = restoreState.restoredPath
            ? ` The restored keys were preserved at "${restoreState.restoredPath}".`
            : '';
          this.ctx.logger.error(
            `Failed to roll back encryption field keys. The previous keys were preserved at "${restoreState.previousPath}".${restoredKeysLocation} ${rollbackError.message}`,
            { module: BACKUPS },
          );
          return false;
        }
      }
      await this.#cleanupEncryptionFieldKeysDirectory(restoreState.restoredPath, 'staged restored');
      return true;
    }

    const parentPath = path.dirname(this.#encryptionFieldKeysPath);
    const discardedPath = path.join(parentPath, `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-discarded-${crypto.randomUUID()}`);
    let installedKeysMoved = false;

    try {
      await fsPromises.rename(this.#encryptionFieldKeysPath, discardedPath);
      installedKeysMoved = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        const previousKeysLocation = restoreState.previousPath
          ? ` The previous keys were preserved at "${restoreState.previousPath}".`
          : '';
        this.ctx.logger.error(
          `Failed to remove the restored encryption field keys while rolling back.${previousKeysLocation} ${error.message}`,
          { module: BACKUPS },
        );
        return false;
      }
    }

    if (restoreState.previousPath) {
      try {
        await fsPromises.rename(restoreState.previousPath, this.#encryptionFieldKeysPath);
      } catch (rollbackError) {
        let restoredKeysLocation = installedKeysMoved ? ` The restored keys remain at "${discardedPath}".` : '';
        if (installedKeysMoved) {
          try {
            await fsPromises.rename(discardedPath, this.#encryptionFieldKeysPath);
            installedKeysMoved = false;
            restoredKeysLocation = ' The restored keys remain active.';
          } catch (reinstallError) {
            restoredKeysLocation = ` The restored keys were preserved at "${discardedPath}" but could not be reinstalled: ${reinstallError.message}.`;
          }
        }
        this.ctx.logger.error(
          `Failed to roll back encryption field keys. The previous keys were preserved at "${restoreState.previousPath}".${restoredKeysLocation} ${rollbackError.message}`,
          { module: BACKUPS },
        );
        return false;
      }
    }

    if (installedKeysMoved) {
      try {
        await fsPromises.rm(discardedPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      } catch (error) {
        this.ctx.logger.error(
          `Error cleaning up rolled back encryption field keys directory "${discardedPath}": ${error.message}`,
          { module: BACKUPS },
        );
      }
    }
    return true;
  }

  async #activateRestoredEncryptionFieldKeys(
    restoreState: EncryptionFieldKeysRestoreState | undefined,
  ): Promise<boolean> {
    if (!restoreState?.restoreFailed) {
      return true;
    }
    if (!restoreState.restoredPath) {
      this.ctx.logger.error('Restored encryption field keys are unavailable; stopping the restore process.', {
        module: BACKUPS,
      });
      return false;
    }

    let previousPath = restoreState.previousPath;
    let previousKeysMoved = false;
    if (restoreState.previousKeysActive) {
      previousPath =
        previousPath ??
        path.join(
          path.dirname(this.#encryptionFieldKeysPath),
          `.${ENCRYPTION_FIELD_KEYS_DIRECTORY}-previous-${crypto.randomUUID()}`,
        );
      try {
        await fsPromises.rename(this.#encryptionFieldKeysPath, previousPath);
        previousKeysMoved = true;
        restoreState.previousPath = previousPath;
        restoreState.previousKeysActive = false;
      } catch (error) {
        this.ctx.logger.error(
          `Failed to preserve the active encryption field keys at "${previousPath}" before activating the restored keys. The restored keys were preserved at "${restoreState.restoredPath}": ${error.message}`,
          { module: BACKUPS },
        );
        return false;
      }
    }

    try {
      await fsPromises.rename(restoreState.restoredPath, this.#encryptionFieldKeysPath);
      return true;
    } catch (activationError) {
      let previousKeysLocation = previousPath ? ` The previous keys were preserved at "${previousPath}".` : '';
      if (previousKeysMoved && previousPath) {
        try {
          await fsPromises.rename(previousPath, this.#encryptionFieldKeysPath);
          previousKeysLocation = ' The previous keys remain active.';
        } catch (rollbackError) {
          previousKeysLocation = ` The previous keys were preserved at "${previousPath}" but could not be reactivated: ${rollbackError.message}.`;
        }
      }
      this.ctx.logger.error(
        `Failed to activate the restored encryption field keys. The restored keys were preserved at "${restoreState.restoredPath}".${previousKeysLocation} ${activationError.message}`,
        { module: BACKUPS },
      );
      return false;
    }
  }

  async #cleanupEncryptionFieldKeysDirectory(directoryPath: string | undefined, description: string): Promise<void> {
    if (!directoryPath) {
      return;
    }
    try {
      await fsPromises.rm(directoryPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch (error) {
      this.ctx.logger.error(
        `Error cleaning up ${description} encryption field keys directory "${directoryPath}": ${error.message}`,
        { module: BACKUPS },
      );
    }
  }

  async #cleanupExtractedDir(extractedDir: string): Promise<void> {
    try {
      await fsPromises.rm(extractedDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch (error) {
      this.ctx.logger.error(`Error cleaning up temporary backup directory "${extractedDir}": ${error.message}`, {
        module: BACKUPS,
      });
    }
  }

  async #logRestoreError(error: Error, metadata: Metadata): Promise<string | undefined> {
    let dbVersion: string | undefined;
    let restoreClientVersion: string | undefined;
    try {
      dbVersion = await getDBVersion(this.ctx.app.db);
    } catch (diagnosticError) {
      this.ctx.logger.error(`Error reading the current database version: ${diagnosticError.message}`, {
        module: BACKUPS,
      });
    }
    try {
      restoreClientVersion = await this.#dbAdapter.clientVersion('restore');
    } catch (diagnosticError) {
      this.ctx.logger.error(`Error reading the restore client version: ${diagnosticError.message}`, {
        module: BACKUPS,
      });
    }
    this.ctx.logger.error(
      `Error restoring backup: "${error.message}".
      Database Version: backup[${metadata.database.version}], current[${dbVersion ?? 'unknown'}],
      Client Version: backup[${metadata.database.backupClientVersion}], restore[${restoreClientVersion ?? 'unknown'}]
      `,
      { module: BACKUPS },
    );
    return dbVersion;
  }

  async #revertDbRestore(): Promise<boolean> {
    this.ctx.logger.info('Reverting the database restore process', { module: BACKUPS });
    const dbFile = path.join(this.#tempDir, 'before-restore', 'data');
    if (await fs.pathExists(dbFile)) {
      try {
        await this.#dbAdapter.restore({ filePath: dbFile, schema: this.#dbAdapter.dbOpts.schema });
        return true;
      } catch (error) {
        this.ctx.logger.error('Error reverting the database restore process', { module: BACKUPS });
        return false;
      }
    }
    this.ctx.logger.error('Database backup file for revert restore process not found', { module: BACKUPS });
    return false;
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
