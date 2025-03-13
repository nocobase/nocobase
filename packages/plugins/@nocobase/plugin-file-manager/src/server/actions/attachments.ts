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
import { FILE_FIELD_NAME, FILE_SIZE_LIMIT_DEFAULT, FILE_SIZE_LIMIT_MIN, LIMIT_FILES } from '../../constants';
import * as Rules from '../rules';
import { StorageClassType } from '../storages';

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

export async function getFileData(ctx: Context) {
  const { [FILE_FIELD_NAME]: file, storage } = ctx;
  if (!file) {
    return ctx.throw(400, 'file validation failed');
  }

  const plugin = ctx.app.pm.get(Plugin);
  const StorageType = plugin.storageTypes.get(storage.type) as StorageClassType;
  const { [StorageType.filenameKey || 'filename']: name } = file;
  // make compatible filename across cloud service (with path)
  const filename = Path.basename(name);
  const extname = Path.extname(filename);
  const path = (storage.path || '').replace(/^\/|\/$/g, '');

  const storageInstance = plugin.storagesCache.get(storage.id);

  const data = {
    title: Buffer.from(file.originalname, 'latin1').toString('utf8').replace(extname, ''),
    filename,
    extname,
    // TODO(feature): 暂时两者相同，后面 storage.path 模版化以后，这里只是 file 实际的 path
    path,
    size: file.size,
    mimetype: file.mimetype,
    meta: ctx.request.body,
    storageId: storage.id,
    ...(storageInstance.getFileData ? storageInstance.getFileData(file) : {}),
  };

  data.url = data.url || (await plugin.getFileURL(data));

  return data;
}

async function multipart(ctx: Context, next: Next) {
  const { storage } = ctx;
  if (!storage) {
    ctx.logger.error('[file-manager] no linked or default storage provided');
    return ctx.throw(500);
  }

  const StorageType = ctx.app.pm.get(Plugin).storageTypes.get(storage.type) as StorageClassType;
  if (!StorageType) {
    ctx.logger.error(`[file-manager] storage type "${storage.type}" is not defined`);
    return ctx.throw(500);
  }
  const storageInstance = new StorageType(storage);

  const multerOptions = {
    fileFilter: getFileFilter(storage),
    limits: {
      // 每次只允许提交一个文件
      files: LIMIT_FILES,
    },
    storage: storageInstance.make(),
  };
  multerOptions.limits['fileSize'] = Math.max(FILE_SIZE_LIMIT_MIN, storage.rules.size ?? FILE_SIZE_LIMIT_DEFAULT);

  const upload = multer(multerOptions).single(FILE_FIELD_NAME);
  try {
    // NOTE: empty next and invoke after success
    await upload(ctx, () => {});
  } catch (err) {
    if (err.name === 'MulterError') {
      return ctx.throw(400, err);
    }
    ctx.logger.error(err);
    return ctx.throw(500, err);
  }

  const values = await getFileData(ctx);

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

  const plugin = ctx.app.pm.get(Plugin);
  ctx.storage = plugin.parseStorage(storage);

  if (ctx?.request.is('multipart/*')) {
    await multipart(ctx, next);
  } else {
    await next();
  }
}
