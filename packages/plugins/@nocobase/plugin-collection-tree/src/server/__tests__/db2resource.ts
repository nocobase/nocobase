/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { getNameByParams, parseRequest, ResourcerContext, ResourceType } from '@nocobase/resourcer';

export async function db2resource(ctx: ResourcerContext & { db: Database }, next: () => Promise<any>) {
  const resourcer = ctx.resourcer;
  const database = ctx.db;

  const params = parseRequest(
    {
      path: ctx.request.path,
      method: ctx.request.method,
    },
    {
      prefix: resourcer.options.prefix,
      accessors: resourcer.options.accessors,
    },
  );

  if (!params) {
    return next();
  }

  const resourceName = getNameByParams(params);

  // 如果资源名称未被定义
  if (resourcer.isDefined(resourceName)) {
    return next();
  }

  const splitResult = resourceName.split('.');

  const collectionName = splitResult[0];
  const fieldName = splitResult[1];

  // 如果经过加载后是已经定义的表
  if (!database.hasCollection(collectionName)) {
    return next();
  }

  const collection = database.getCollection(collectionName);
  let resourceType: ResourceType = 'single';
  if (fieldName && collection.hasField(fieldName)) {
    const field = collection.getField(fieldName);
    resourceType = field.type;
  }

  resourcer.define({
    type: resourceType,
    name: resourceName,
  });

  return next();
}

export default db2resource;
