/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import { koaMulter as multer } from '@nocobase/utils';
import fsPromises from 'fs/promises';
import os from 'os';
import { BackupManager, BackupSettings, BackupTaskResult } from '../managers/backup';
import { BACKUP_EXTENSION, BACKUP_TASKS_CACHE_NAME, isQsTruly, RESTORE_TASKS_CACHE_NAME, SETTINGS } from '../utils';
import { RestoreManager } from '../managers/restore';
import { Cache } from '@nocobase/cache';
import crypto from 'crypto';
import { AppSupervisor } from '@nocobase/server';

async function setRestoreTaskError(statusCache: Cache, taskId: string, error: unknown) {
  await statusCache.set(taskId, {
    inProgress: false,
    message: error instanceof Error ? error.message : String(error),
  });
}

export default {
  name: 'backups',
  middleware: async (ctx, next) => {
    if (ctx.action.actionName !== 'upload') {
      return next();
    }

    const storage = multer.diskStorage({
      destination: os.tmpdir(),
      filename: function (req, file, cb) {
        const randomName = Date.now().toString() + Math.random().toString().slice(2); // 随机生成文件名
        cb(null, randomName);
      },
    });

    const upload = multer({ storage }).single('file');
    return upload(ctx, next);
  },
  actions: {
    async list(ctx, next) {
      const backupSettings: BackupSettings = await ctx.db.getRepository(SETTINGS).findOne();
      const backupManager = new BackupManager(ctx.app, ctx, backupSettings);
      const backups = await backupManager.list();
      ctx.body = backups;
      await next();
    },
    async upload(ctx, next) {
      const restoreManager = new RestoreManager(ctx);
      const taskId = crypto.randomUUID();
      const statusCache: Cache = ctx.app.cacheManager.getCache(RESTORE_TASKS_CACHE_NAME);
      const uploadedFilePath = ctx.request.file?.path;
      await statusCache.set(taskId, {
        inProgress: true,
      });
      try {
        await restoreManager.restoreFromUpload(ctx.request.file, taskId, ctx.request.body.password, true);
        ctx.body = {
          status: 'ok',
          task: taskId,
        };
        await next();
      } catch (error) {
        await setRestoreTaskError(statusCache, taskId, error);
        throw error;
      } finally {
        if (uploadedFilePath) {
          await fsPromises.unlink(uploadedFilePath).catch(() => {});
        }
      }
    },
    async create(ctx, next) {
      const backupSettings: BackupSettings = await ctx.db.getRepository(SETTINGS).findOne();
      const backupManager = new BackupManager(ctx.app, ctx, backupSettings);
      const statusCache: Cache = ctx.app.cacheManager.getCache(BACKUP_TASKS_CACHE_NAME);
      const backupName = await backupManager.createBackupName();
      const fileName = `${backupName}.${BACKUP_EXTENSION}`;
      backupManager
        .backup(backupName)
        .then(async () => {
          await statusCache.set(fileName, {
            inProgress: false,
          });
        })
        .catch(async (e) => {
          await statusCache.set(fileName, {
            inProgress: false,
            message: e.message,
          });
        });
      await statusCache.set(fileName, {
        inProgress: true,
      });
      ctx.body = {
        name: fileName,
        inProgress: true,
      };
      await next();
    },
    async taskStatus(ctx, next) {
      const statusCache: Cache = ctx.app.cacheManager.getCache(BACKUP_TASKS_CACHE_NAME);
      const backupNames: string[] = ctx.action.params.names;
      const results = (await statusCache.mget(...backupNames)) as BackupTaskResult[];
      ctx.body = backupNames.reduce(
        (acc, name, index) => {
          acc[name] = results[index];
          return acc;
        },
        {} as Record<string, BackupTaskResult>,
      );
      await next();
    },
    async download(ctx, next) {
      const backupSettings: BackupSettings = await ctx.db.getRepository(SETTINGS).findOne();
      const backupManager = new BackupManager(ctx.app, ctx, backupSettings);
      const fileName = ctx.action.params.filterByTk;
      ctx.attachment(fileName);
      ctx.body = await backupManager.createReadStream(fileName);
      await next();
    },
    async destroy(ctx, next) {
      const backupSettings: BackupSettings = await ctx.db.getRepository(SETTINGS).findOne();
      const backupManager = new BackupManager(ctx.app, ctx, backupSettings);
      await backupManager.destroy(ctx.action.params.filterByTk);
      ctx.body = {
        status: 'ok',
      };
      await next();
    },
    async restore(ctx, next) {
      const restoreManager = new RestoreManager(ctx);
      const taskId = crypto.randomUUID();
      const statusCache: Cache = ctx.app.cacheManager.getCache(RESTORE_TASKS_CACHE_NAME);
      await statusCache.set(taskId, {
        inProgress: true,
      });
      try {
        await restoreManager.restoreFromBackup(ctx.request.body.name, taskId, ctx.request.body.password, true);
        ctx.body = {
          status: 'ok',
          task: taskId,
        };
        await next();
      } catch (error) {
        await setRestoreTaskError(statusCache, taskId, error);
        throw error;
      }
    },
    async restoreStatus(ctx, next) {
      const statusCache: Cache = ctx.app.cacheManager.getCache(RESTORE_TASKS_CACHE_NAME);
      ctx.body = await statusCache.get(ctx.action.params.task);
      await next();
    },
    async appInfo(ctx, next) {
      const { dialect, schema } = ctx.app.db.options;
      ctx.body = {
        database: { dialect, schema },
      };
      await next();
    },
  },
} satisfies ResourceOptions;
