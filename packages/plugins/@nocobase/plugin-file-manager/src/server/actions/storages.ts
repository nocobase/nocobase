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
    result = isNumber
      ? storagesCache.get(Number.parseInt(filterByTk, 10))
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

export async function getStorageByCollectionName(context, next) {
  const { storagesCache } = context.app.pm.get(Plugin) as Plugin;
  const { collectionName } = context.action.params;

  if (!collectionName) {
    return context.throw(400, 'Collection name is required');
  }

  const collection = context.db.getCollection(collectionName);
  if (!collection) {
    return context.throw(404, `Collection "${collectionName}" not found`);
  }

  const storageName = collection.options.storage;

  let storage;
  if (storageName) {
    storage = Array.from(storagesCache.values()).find((item) => item.name === storageName);
    context.body = {
      id: storage.id,
      title: storage.title,
      name: storage.name,
      type: storage.type,
      rules: storage.rules,
      baseUrl: storage.options?.baseUrl,
      public: storage.options?.public,
    };
  } else {
    context.body = null;
  }

  await next();
}
