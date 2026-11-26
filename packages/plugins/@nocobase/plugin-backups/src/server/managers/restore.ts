/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Cache } from '@nocobase/cache';
import { ResourcerContext } from '@nocobase/resourcer';
import * as crypto from 'crypto';
import fs from 'fs-extra';
import fsPromises from 'fs/promises';
import path from 'path';
import { storagePathJoin } from '@nocobase/utils';
import semver from 'semver';
import { Readable } from 'stream';
import { promisify } from 'util';
import { DBAdapter, DBBackupToolchain, DBRestoreOptions, getDBAdapter } from '../adapters/database';
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

interface PreparedRestore {
  directory: string;
  metadata: Metadata;
  uploadsExist: boolean;
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
    const backup = await this.#prepareRestore(filePath, password, tolerentMode, options);
    await this.#restoreData(backup, options, tolerentMode, skipRevertOnError);
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
    const cache = await this.getStatusCache();
    const backup = await this.#prepareRestore(filePath, password, tolerentMode, options);
    this.#restoreData(backup, options, tolerentMode, skipRevertOnError, { id: taskId, cache }).catch((error) => {
      this.ctx.logger.error(`Error restoring backup: ${error.message}`, { module: BACKUPS });
    });
  }

  async #prepareRestore(
    filePath: string,
    password: string | undefined,
    tolerentMode: boolean | undefined,
    options?: RestoreOptions,
  ): Promise<PreparedRestore> {
    await this.#dbAdapter.check('restore');
    await fsPromises.mkdir(this.#tempDir, { recursive: true });
    const directory = await fsPromises.mkdtemp(path.join(this.#tempDir, 'restore-'));
    const extractedDir = path.join(directory, 'archive');
    try {
      await this.#decompressFiles(filePath, extractedDir, password);
      const files = await fsPromises.readdir(extractedDir);
      if (!files.includes('data') || !files.includes('_metadata.json')) {
        throw new Error(this.#t('Not a valid backup file'));
      }
      const metadata = await this.#parseMetadataFile(path.join(extractedDir, '_metadata.json'), tolerentMode, options);
      return { directory, metadata, uploadsExist: files.includes('uploads') };
    } catch (error) {
      await fs.remove(directory);
      throw error;
    }
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
    await this.#assertRestoreClientVersion(metadata);
    return metadata;
  }

  async #assertRestoreClientVersion(metadata: Metadata): Promise<void> {
    if (this.#dbAdapter.dbOpts.dialect !== 'postgres') {
      return;
    }

    const backupClientVersion = metadata.database.backupClientVersion;
    const restoreClientVersion = await this.#dbAdapter.clientVersion('restore');
    const backupMajorVersion =
      typeof backupClientVersion === 'string'
        ? backupClientVersion.trim().match(/^pg_dump \(PostgreSQL\) (\d+)(?:\.\d+)*(?=\s|$)/)?.[1]
        : undefined;
    const restoreMajorVersion =
      typeof restoreClientVersion === 'string'
        ? restoreClientVersion.trim().match(/^pg_restore \(PostgreSQL\) (\d+)(?:\.\d+)*(?=\s|$)/)?.[1]
        : undefined;

    if (!backupMajorVersion || !restoreMajorVersion) {
      throw new Error(this.#t('ERROR_PG_RESTORE_VERSION_UNKNOWN'));
    }
    if (Number(backupMajorVersion) > Number(restoreMajorVersion)) {
      throw new Error(
        this.#t('ERROR_PG_RESTORE_VERSION_MISMATCH', {
          backupClientVersion: backupMajorVersion,
          restoreClientVersion: restoreMajorVersion,
        }),
      );
    }

    const localDumpVersion = await this.#dbAdapter.clientVersion('backup');
    const localDumpMajor =
      typeof localDumpVersion === 'string' &&
      localDumpVersion.trim().match(/^pg_dump \(PostgreSQL\) (\d+)(?:\.\d+)*(?=\s|$)/)?.[1];
    const serverVersion = await this.#dbAdapter.serverVersion?.();
    const serverMajor = serverVersion?.trim().match(/^(\d+)(?:\.|\s|$)/)?.[1];
    if (!localDumpMajor || !serverMajor) {
      throw new Error(this.#t('ERROR_PG_SAFETY_BACKUP_VERSION_UNKNOWN'));
    }
    if (Number(localDumpMajor) < Number(serverMajor)) {
      throw new Error(this.#t('ERROR_PG_SAFETY_BACKUP_VERSION', { localDumpMajor, serverMajor }));
    }
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

  async #decompressFiles(filePath: string, outputDir: string, password?: string): Promise<void> {
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

  async #validateRestore(options: DBRestoreOptions) {
    const file = await fsPromises.stat(options.filePath);
    if (!file.isFile() || !file.size) {
      throw new Error(this.#t('Not a valid backup file'));
    }
    await this.#dbAdapter.validateRestore?.(options);
  }

  async #restoreData(
    { directory, metadata, uploadsExist }: PreparedRestore,
    options?: RestoreOptions,
    tolerentMode?: boolean,
    skipRevertOnError?: boolean,
    task?: { id: string; cache: Cache },
  ): Promise<void> {
    const extractedDir = path.join(directory, 'archive');
    const rollbackDir = path.join(directory, 'before-restore');
    const rollback = { filePath: path.join(rollbackDir, 'data'), schema: this.#dbAdapter.dbOpts.schema };
    const incoming = {
      filePath: path.join(extractedDir, 'data'),
      schema: metadata.database.schema,
      skipDropAllTables: options?.skipDropAllTables === true,
      restoreMode: options?.restoreMode,
      toolchain: this.#resolveRestoreToolchain(metadata),
    };
    let restoreStarted = false;
    let keepRollbackFile = false;
    try {
      if (task) {
        this.#notify(RESTORE_STEPS.BEGIN);
        this.#notify(RESTORE_STEPS.DATABASE);
      }
      await this.#validateRestore(incoming);
      await fsPromises.mkdir(rollbackDir);
      await this.#dbAdapter.backup({ dir: rollbackDir });
      await this.#validateRestore(rollback);
      await this.ctx.app.emitAsync('beforeStop');
      await this.ctx.app.emitAsync('afterStop');

      restoreStarted = true;
      await this.#dbAdapter.restore(incoming);
      this.ctx.logger.info('Database restored successfully', { module: BACKUPS });
      if (task && uploadsExist) {
        this.#notify(RESTORE_STEPS.UPLOADS);
      }
      await this.#restoreFiles(uploadsExist, extractedDir);
      if (task) {
        await task.cache.set(task.id, { inProgress: false });
        await this.ctx.app.runCommand('upgrade');
      }
    } catch (error) {
      if (task) {
        await task.cache.set(task.id, { inProgress: false, message: error.message }).catch((cacheError) => {
          this.ctx.logger.warn(`Failed to publish restore status: ${cacheError.message}`, { module: BACKUPS });
        });
      }
      if (!restoreStarted) {
        throw error;
      }

      this.ctx.logger.error(`Error restoring backup: ${error.message}`, { module: BACKUPS });
      if (tolerentMode && error.message.includes('ignored')) {
        await this.#restoreFiles(uploadsExist, extractedDir);
        if (task) {
          await this.ctx.app.runCommand('upgrade');
        } else {
          await this.ctx.app.upgrade();
        }
        return;
      }

      if (skipRevertOnError) {
        keepRollbackFile = true;
        this.ctx.logger.info(`Rollback backup retained at ${rollback.filePath}`, { module: BACKUPS });
      } else {
        try {
          await this.#validateRestore(rollback);
          await this.#dbAdapter.restore(rollback);
        } catch (rollbackError) {
          keepRollbackFile = true;
          this.ctx.logger.error(`Could not revert the database from ${rollback.filePath}: ${rollbackError.message}`, {
            module: BACKUPS,
          });
          throw error;
        }
      }
      if (task) {
        if (!tolerentMode && this.#isPostgresLikeDialect(this.#dbAdapter.dbOpts.dialect)) {
          const backupMajor = Number(toMajorVersion(metadata.database.backupClientVersion));
          const serverMajor = Number(toMajorVersion(await getDBVersion(this.ctx.app.db)));
          if (backupMajor > 16 && serverMajor <= 16) {
            await task.cache.set(task.id, { inProgress: false, message: this.#t('ERROR_PG_DUMP_LT_17') });
          }
        }
        await this.ctx.app.runCommand('upgrade');
      }
      throw error;
    } finally {
      if (task) {
        this.#notify(RESTORE_STEPS.END);
      }
      await fs.remove(keepRollbackFile ? extractedDir : directory).catch((cleanupError) => {
        this.ctx.logger.warn(`Failed to clean up restore directory ${directory}: ${cleanupError.message}`, {
          module: BACKUPS,
        });
      });
    }
  }

  async #restoreFiles(restoreUploads: boolean, extractedDir: string) {
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
