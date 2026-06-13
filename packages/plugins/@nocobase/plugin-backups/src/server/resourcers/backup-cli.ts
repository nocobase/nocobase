/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import { ResourceOptions } from '@nocobase/resourcer';
import { koaMulter as multer, storagePathJoin } from '@nocobase/utils';
import crypto from 'crypto';
import fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';
import { BackupManager, BackupSettings, BackupTaskResult } from '../managers/backup';
import { RestoreManager } from '../managers/restore';
import { BACKUP_EXTENSION, BACKUP_TASKS_CACHE_NAME, isQsTruly, RESTORE_TASKS_CACHE_NAME, SETTINGS } from '../utils';

async function setRestoreTaskError(statusCache: Cache, taskId: string, error: unknown) {
  await statusCache.set(taskId, {
    inProgress: false,
    message: error instanceof Error ? error.message : String(error),
  });
}

function getBackupName(ctx) {
  return ctx.action.params.name || ctx.request.body?.name;
}

function getPassword(ctx) {
  return ctx.action.params.password || ctx.request.body?.password;
}

function getSkipRevertOnError(ctx) {
  return isQsTruly(ctx.action.params.skipRevertOnError || ctx.request.body?.skipRevertOnError);
}

function getForceSchemaRestore(ctx) {
  return isQsTruly(ctx.action.params.force || ctx.request.body?.force);
}

function getBackupDir(ctx) {
  return storagePathJoin('backups', ctx.app.name);
}

function getBackupFilePath(ctx, name: string) {
  const backupDir = getBackupDir(ctx);
  const filePath = path.resolve(backupDir, name);
  if (
    path.basename(name) !== name ||
    !name.endsWith(`.${BACKUP_EXTENSION}`) ||
    !filePath.startsWith(backupDir + path.sep)
  ) {
    ctx.throw(400, 'Invalid backup name');
  }

  return filePath;
}

export default {
  name: 'backup',
  middleware: async (ctx, next) => {
    if (ctx.action.actionName !== 'restoreUpload') {
      return next();
    }

    const storage = multer.diskStorage({
      destination: os.tmpdir(),
      filename: function (req, file, cb) {
        const randomName = Date.now().toString() + Math.random().toString().slice(2);
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
      ctx.body = await backupManager.list();
      await next();
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

    async status(ctx, next) {
      const name = getBackupName(ctx);
      if (!name) {
        ctx.throw(400, 'Backup name is required');
        return;
      }

      const statusCache: Cache = ctx.app.cacheManager.getCache(BACKUP_TASKS_CACHE_NAME);
      const results = (await statusCache.mget(name)) as BackupTaskResult[];
      ctx.body = {
        [name]: results[0],
      };
      await next();
    },

    async download(ctx, next) {
      const name = getBackupName(ctx);
      if (!name) {
        ctx.throw(400, 'Backup name is required');
        return;
      }

      const backupSettings: BackupSettings = await ctx.db.getRepository(SETTINGS).findOne();
      const backupManager = new BackupManager(ctx.app, ctx, backupSettings);
      ctx.attachment(name);
      ctx.body = await backupManager.createReadStream(name);
      await next();
    },

    async remove(ctx, next) {
      const name = getBackupName(ctx);
      if (!name) {
        ctx.throw(400, 'Backup name is required');
        return;
      }

      const backupSettings: BackupSettings = await ctx.db.getRepository(SETTINGS).findOne();
      const backupManager = new BackupManager(ctx.app, ctx, backupSettings);
      await backupManager.destroy(name);
      ctx.body = {
        status: 'ok',
      };
      await next();
    },

    async restore(ctx, next) {
      const name = getBackupName(ctx);
      if (!name) {
        ctx.throw(400, 'Backup name is required');
        return;
      }

      const restoreManager = new RestoreManager(ctx);
      const taskId = crypto.randomUUID();
      const statusCache: Cache = ctx.app.cacheManager.getCache(RESTORE_TASKS_CACHE_NAME);
      await statusCache.set(taskId, {
        inProgress: true,
      });
      try {
        await restoreManager.restore(
          getBackupFilePath(ctx, name),
          taskId,
          getPassword(ctx),
          true,
          getSkipRevertOnError(ctx),
          {
            forceSchemaRestore: getForceSchemaRestore(ctx),
          },
        );
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

    async restoreUpload(ctx, next) {
      const restoreManager = new RestoreManager(ctx);
      const taskId = crypto.randomUUID();
      const statusCache: Cache = ctx.app.cacheManager.getCache(RESTORE_TASKS_CACHE_NAME);
      const uploadedFilePath = ctx.request.file?.path;
      await statusCache.set(taskId, {
        inProgress: true,
      });
      try {
        await restoreManager.restore(ctx.request.file.path, taskId, getPassword(ctx), true, getSkipRevertOnError(ctx), {
          forceSchemaRestore: getForceSchemaRestore(ctx),
        });
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

    async restoreStatus(ctx, next) {
      const statusCache: Cache = ctx.app.cacheManager.getCache(RESTORE_TASKS_CACHE_NAME);
      ctx.body = await statusCache.get(ctx.action.params.task);
      await next();
    },
  },
} satisfies ResourceOptions;
