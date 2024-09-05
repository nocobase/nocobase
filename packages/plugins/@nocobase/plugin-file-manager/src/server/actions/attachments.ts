/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { koaMulter as multer } from '@nocobase/utils';
import Path from 'path';

import Plugin from '..';
import {
  FILE_FIELD_NAME,
  FILE_SIZE_LIMIT_DEFAULT,
  FILE_SIZE_LIMIT_MAX,
  FILE_SIZE_LIMIT_MIN,
  LIMIT_FILES,
} from '../../constants';
import * as Rules from '../rules';

// TODO(optimize): 需要优化错误处理，计算失败后需要抛出对应错误，以便程序处理
function getFileFilter(storage) {
  return (req, file, cb) => {
    // size 交给 limits 处理
    const { size, ...rules } = storage.rules;
    const ruleKeys = Object.keys(rules);
    const result =
      !ruleKeys.length || !ruleKeys.some((key) => typeof Rules[key] !== 'function' || !Rules[key](file, rules[key]));
    cb(null, result);
  };
}

export function getFileData(ctx: Context) {
  const { [FILE_FIELD_NAME]: file, storage } = ctx;
  if (!file) {
    return ctx.throw(400, 'file validation failed');
  }

  const storageConfig = ctx.app.pm.get(Plugin).storageTypes.get(storage.type);
  const { [storageConfig.filenameKey || 'filename']: name } = file;
  // make compatible filename across cloud service (with path)
  const filename = Path.basename(name);
  const extname = Path.extname(filename);
  const path = (storage.path || '').replace(/^\/|\/$/g, '');
  const baseUrl = storage.baseUrl.replace(/\/+$/, '');
  const pathname = [path, filename].filter(Boolean).join('/');

  return {
    title: Buffer.from(file.originalname, 'latin1').toString('utf8').replace(extname, ''),
    filename,
    extname,
    // TODO(feature): 暂时两者相同，后面 storage.path 模版化以后，这里只是 file 实际的 path
    path,
    size: file.size,
    // 直接缓存起来
    url: `${baseUrl}/${pathname}`,
    mimetype: file.mimetype,
    // @ts-ignore
    meta: ctx.request.body,
    storageId: storage.id,
    ...(storageConfig.getFileData ? storageConfig.getFileData(file) : {}),
  };
}

async function multipart(ctx: Context, next: Next) {
  const { storage } = ctx;
  if (!storage) {
    ctx.logger.error('[file-manager] no linked or default storage provided');
    return ctx.throw(500);
  }

  const storageConfig = ctx.app.pm.get(Plugin).storageTypes.get(storage.type);
  if (!storageConfig) {
    ctx.logger.error(`[file-manager] storage type "${storage.type}" is not defined`);
    return ctx.throw(500);
  }

  const multerOptions = {
    fileFilter: getFileFilter(storage),
    limits: {
      // 每次只允许提交一个文件
      files: LIMIT_FILES,
    },
    storage: storageConfig.make(storage),
  };
  multerOptions.limits['fileSize'] = Math.min(
    Math.max(FILE_SIZE_LIMIT_MIN, storage.rules.size ?? FILE_SIZE_LIMIT_DEFAULT),
    FILE_SIZE_LIMIT_MAX,
  );

  const upload = multer(multerOptions).single(FILE_FIELD_NAME);
  try {
    // NOTE: empty next and invoke after success
    await upload(ctx, () => {});
  } catch (err) {
    if (err.name === 'MulterError') {
      return ctx.throw(400, err);
    }
    ctx.logger.error(err);
    return ctx.throw(500);
  }

  const values = getFileData(ctx);

  ctx.action.mergeParams({
    values,
  });

  await next();
}

export async function createMiddleware(ctx: Context, next: Next) {
  const { resourceName, actionName } = ctx.action;
  const { attachmentField } = ctx.action.params;
  const collection = ctx.db.getCollection(resourceName);

  if (collection?.options?.template !== 'file' || !['upload', 'create'].includes(actionName)) {
    return next();
  }

  const storageName = ctx.db.getFieldByPath(attachmentField)?.options?.storage || collection.options.storage;
  const StorageRepo = ctx.db.getRepository('storages');
  const storage = await StorageRepo.findOne({ filter: storageName ? { name: storageName } : { default: true } });

  ctx.storage = storage;

  await multipart(ctx, next);
}

export async function destroyMiddleware(ctx: Context, next: Next) {
  const { resourceName, actionName } = ctx.action;
  const collection = ctx.db.getCollection(resourceName);

  if (collection?.options?.template !== 'file' || actionName !== 'destroy') {
    return next();
  }

  const repository = ctx.db.getRepository(resourceName);

  const { filterByTk, filter } = ctx.action.params;

  const records = await repository.find({
    filterByTk,
    filter,
    context: ctx,
  });

  const storageIds = new Set(records.map((record) => record.storageId));
  const storageGroupedRecords = records.reduce((result, record) => {
    const storageId = record.storageId;
    if (!result[storageId]) {
      result[storageId] = [];
    }
    result[storageId].push(record);
    return result;
  }, {});

  const storages = await ctx.db.getRepository('storages').find({
    filter: {
      id: [...storageIds] as any[],
      paranoid: {
        $ne: true,
      },
    },
  });

  let count = 0;
  const undeleted = [];
  await storages.reduce(
    (promise, storage) =>
      promise.then(async () => {
        const storageConfig = ctx.app.pm.get(Plugin).storageTypes.get(storage.type);
        const result = await storageConfig.delete(storage, storageGroupedRecords[storage.id]);
        count += result[0];
        undeleted.push(...result[1]);
      }),
    Promise.resolve(),
  );

  if (undeleted.length) {
    const ids = undeleted.map((record) => record.id);
    ctx.action.mergeParams({
      filter: {
        id: {
          $notIn: ids,
        },
      },
    });

    ctx.logger.error('[file-manager] some of attachment files are not successfully deleted: ', { ids });
  }

  await next();
}
