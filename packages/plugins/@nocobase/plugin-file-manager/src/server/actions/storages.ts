/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Plugin from '..';

export async function getBasicInfo(context, next) {
  const { storagesCache } = context.app.pm.get(Plugin) as Plugin;
  let result;
  const { filterByTk } = context.action.params;
  if (!filterByTk) {
    result = Array.from(storagesCache.values()).find((item) => item.default);
  } else {
    const isNumber = /^[1-9]\d*$/.test(filterByTk);
    let key: string | number = filterByTk;
    if (isNumber) {
      const bigIntVal = BigInt(filterByTk);
      // 在 JS 安全整数范围内，才转成 Number
      if (bigIntVal <= BigInt(Number.MAX_SAFE_INTEGER)) {
        key = Number(filterByTk);
      }
    }
    result = isNumber
      ? storagesCache.get(key)
      : Array.from(storagesCache.values()).find((item) => item.name === filterByTk);
  }
  if (!result) {
    return context.throw(404);
  }
  context.body = {
    id: result.id,
    title: result.title,
    name: result.name,
    type: result.type,
    rules: result.rules,
    baseUrl: result.options?.baseUrl,
    public: result.options?.public,
  };

  next();
}

export async function check(context, next) {
  const { fileCollectionName, storageName: storage_name } = context.action.params;
  let storage;

  const fileCollection = context.db.getCollection(fileCollectionName || 'attachments');
  const storageName = storage_name || fileCollection?.options?.storage;
  if (storageName) {
    storage = await context.db.getRepository('storages').findOne({
      where: {
        name: storageName,
      },
    });
  } else {
    storage = await context.db.getRepository('storages').findOne({
      where: {
        default: true,
      },
    });
  }

  if (!storage) {
    context.throw(400, context.t('Storage configuration not found. Please configure a storage provider first.'));
  }

  const isSupportToUploadFiles = !!fileCollection;

  const storageInfo = {
    id: storage.id,
    title: storage.title,
    name: storage.name,
    type: storage.type,
    rules: storage.rules,
  };

  context.body = {
    isSupportToUploadFiles: !!isSupportToUploadFiles,
    storage: storageInfo,
  };

  await next();
}
