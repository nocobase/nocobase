/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import { LockAcquireError, Releaser } from '@nocobase/lock-manager';
import { Application, InstallOptions, Plugin } from '@nocobase/server';
import parser from 'cron-parser';
import _ from 'lodash';
import path from 'path';
import { BackupManager, BackupSettings } from './managers/backup';
import { RestoreManager } from './managers/restore';
import backupCliResource from './resourcers/backup-cli';
import backupsResource from './resourcers/backups';
import {
  BACKUP_EXTENSION,
  BACKUP_TASKS_CACHE_NAME,
  RESTORE_TASKS_CACHE_NAME,
  RESTORE_TASKS_CACHE_TTL,
  SETTINGS,
} from './utils';

const MAX_TIMEOUT_VALUE = 2147483647;

const DEFAULT_SETTINGS = {
  values: {
    scheduled: false,
    cron: '0 0 * * *',
    keep: 100,
    enableFilesBackup: true,
    storageId: null,
    encryptionPassword: '',
  } satisfies BackupSettings,
};

export class PluginBackupsServer extends Plugin {
  #autoBackupTimer: NodeJS.Timeout | null = null;

  async afterAdd() {}

  async beforeLoad() {
    this.db.on(`${SETTINGS}.afterUpdate`, async (model: BackupSettings) => {
      this.#autoBackupTimer = await this.#createBackupTimer(model);
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.settings`,
      actions: [`${SETTINGS}:get`, `${SETTINGS}:update`],
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['backups:*', 'backup:*'],
    });
  }

  async load() {
    await this.app.cacheManager.createCache({
      name: BACKUP_TASKS_CACHE_NAME,
      store: 'memory',
      ttl: 24 * 60 * 60 * 1000,
    });

    await this.app.cacheManager.createCache({
      name: RESTORE_TASKS_CACHE_NAME,
      store: 'memory',
      ttl: RESTORE_TASKS_CACHE_TTL,
      max: 10,
    });

    this.app.acl.addFixedParams(SETTINGS, 'destroy', () => {
      return {
        'id.$ne': 1,
      };
    });
    this.app.resourceManager.define(backupsResource);
    this.app.resourceManager.define(backupCliResource);

    this.app.on('beforeStart', async () => {
      await this.#makeSureSettingsExist();
      this.#autoBackupTimer = await this.#createBackupTimer();
    });

    this.app.on('beforeStop', () => {
      this.#cancelBackupTimer();
    });
  }

  async install(options?: InstallOptions) {
    await this.#makeSureSettingsExist();
  }

  async #makeSureSettingsExist() {
    const hasSettings = await this.db.getRepository(SETTINGS).findOne();
    if (!hasSettings) {
      await this.db.getRepository(SETTINGS).create(DEFAULT_SETTINGS);
    }
  }

  // Use TypeScript-level `private` (not `#`) so tests can call it via
  // `(plugin as any).runAutoBackupTask()`.
  private async runAutoBackupTask() {
    // Acquire a distributed lock so only one cluster node executes the
    // scheduled backup at a time.  In a single-node deployment the
    // LocalLockAdapter is used; in a clustered deployment the registered
    // Redis (or other) adapter provides true cross-process exclusion.
    let release: Releaser | undefined;
    try {
      const lock = await this.app.lockManager.tryAcquire(`backup:auto-task:${this.app.name}`);
      // TTL of 1 h acts as a crash-safety net: the lock is auto-released
      // even if the process dies before the finally block runs.
      release = await lock.acquire(60 * 60 * 1000);
    } catch (e) {
      if (e instanceof LockAcquireError) {
        this.log.info('Auto backup skipped: already running on another instance');
        return;
      }
      throw e;
    }

    // the settings might have been changed, hence we need to fetch it again
    const settings: BackupSettings = await this.db.getRepository(SETTINGS).findOne();
    const backupManager = new BackupManager(this.app, null, settings);
    // Defensively obtain (or lazily create) the cache. In some environments
    // (e.g. MySQL cluster where a peer node's install -f drops and recreates
    // tables before this node's load() completes), plugin.load() may be
    // skipped, leaving the cache unregistered.
    let statusCache: Cache;
    try {
      statusCache = this.app.cacheManager.getCache(BACKUP_TASKS_CACHE_NAME);
    } catch {
      statusCache = await this.app.cacheManager.createCache({
        name: BACKUP_TASKS_CACHE_NAME,
        store: 'memory',
        ttl: 24 * 60 * 60 * 1000,
      });
    }
    const backupName = await backupManager.createBackupName();
    const fileName = `${backupName}.${BACKUP_EXTENSION}`;
    try {
      await statusCache.set(fileName, {
        inProgress: true,
      });
      await backupManager.backup(backupName);
    } catch (e) {
      this.log.error(e);
    } finally {
      await statusCache.set(fileName, {
        inProgress: false,
      });
      await release?.();
    }
  }

  async #createBackupTimer(model?: BackupSettings): Promise<NodeJS.Timeout | null> {
    this.#cancelBackupTimer();
    const backupSettings: BackupSettings = model || (await this.db.getRepository(SETTINGS).findOne());
    if (backupSettings.scheduled && backupSettings.cron) {
      const interval = parser.parseExpression(backupSettings.cron, { currentDate: new Date() });
      const next = interval.next();
      const nextTime = next.getTime();
      const timeout = nextTime - Date.now();
      if (timeout < 0) {
        return; // the next time is in the past, just skip this round
      }
      if (timeout > MAX_TIMEOUT_VALUE) {
        return setTimeout(async () => {
          // the next time is too far in the future, we need to re-calculate it
          this.#autoBackupTimer = await this.#createBackupTimer();
        }, MAX_TIMEOUT_VALUE);
      }

      this.log.info(`Next backup scheduled at ${next}`);
      return setTimeout(async () => {
        await this.runAutoBackupTask();
        this.#autoBackupTimer = await this.#createBackupTimer();
      }, timeout);
    }
    return null;
  }

  #cancelBackupTimer() {
    if (this.#autoBackupTimer) {
      clearTimeout(this.#autoBackupTimer);
      this.#autoBackupTimer = null;
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async backup() {
    const backupManager = new BackupManager(this.app, null, {
      scheduled: false,
      cron: null,
      encryptionPassword: null,
      enableFilesBackup: false,
      keep: 0,
    });
    const fileBaseName = await backupManager.createBackupName();
    const backupFilePath = await backupManager.backup(fileBaseName);
    return backupFilePath;
  }

  async restore(backupFilePath: string, options?: { skipRevertOnError?: boolean }) {
    const ctx = {
      app: this.app,
      i18n: this.app.i18n,
      logger: this.app.logger,
    };
    const restoreManager = new RestoreManager(ctx, this.app.db.options);
    await restoreManager.restoreCLI(backupFilePath, null, true);
  }

  static async staticImport() {
    Application.addCommand((app: Application) => {
      app
        .command('restore')
        // .preload()
        .argument('<filepath>')
        .option('--underscored')
        .option('--database [database]')
        .option('--schema [schema]')
        .action(async (filepath, opts) => {
          const ctx = {
            app,
            i18n: app.i18n,
            logger: app.logger,
          };
          const dbOptions = {
            ...app.db.options,
          };
          if (opts.underscored) {
            dbOptions.underscored = true;
          }
          if (opts.database) {
            dbOptions.database = opts.database;
          }
          if (opts.schema) {
            _.set(ctx, 'request.body.dbSchema', opts.schema);
            dbOptions['schema'] = opts.schema;
            await app.db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${opts.schema}"`);
          }
          const restoreManager = new RestoreManager(ctx, dbOptions);
          const backupFilePath = path.isAbsolute(filepath) ? filepath : path.resolve(process.cwd(), filepath);
          const password = null;
          const tolerentMode = true;
          await restoreManager.restoreCLI(backupFilePath, password, tolerentMode);
        });
    });
  }
}

export default PluginBackupsServer;
