/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';
import { Collection, Model } from '@nocobase/database';
import { isPlainObject, pick } from 'lodash';

const publicStorageFields = ['id', 'title', 'name', 'type'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value);
}

// The root has already been serialized with its model's normal hidden-field and virtual-field rules.
function projectAssociations(
  value: unknown,
  collection: Collection,
  storages: Collection,
  isAssociation: boolean,
): unknown {
  if (Array.isArray(value)) {
    return value.map((record) => projectAssociations(record, collection, storages, isAssociation));
  }
  if (!isRecord(value)) {
    return value;
  }
  if (isAssociation && collection === storages) {
    return pick(value, publicStorageFields);
  }

  const result = { ...value };
  for (const [name, association] of Object.entries(collection.model.associations)) {
    if (Object.prototype.hasOwnProperty.call(value, name)) {
      const target = collection.db.getCollectionByModelName(association.target.name);
      if (target) {
        result[name] = projectAssociations(value[name], target, storages, true);
      }
    }
  }
  return result;
}

export async function projectStorageAssociations(ctx: Context, next: Next) {
  await next();
  const { actionName, resourceName } = ctx.action;
  if (!['get', 'list'].includes(actionName) || ctx.status !== 200 || !ctx.body) {
    return;
  }

  if (ctx.database !== ctx.db || !ctx.db.collections.has(resourceName.split('.')[0])) {
    return;
  }
  const collection = ctx.db.getCollection(resourceName);
  const storages = ctx.db.getCollection('storages');
  if (!collection || !storages) {
    return;
  }
  // A relation resource can itself return storage records. Only a direct storages resource is a management read.
  const relatedStorage = collection === storages && resourceName !== storages.name;
  function projectRecord(record: unknown) {
    if (!(record instanceof Model) && !isRecord(record)) return record;
    const values = record instanceof Model ? record.dataValues : record;
    if (!relatedStorage && !Object.keys(collection.model.associations).some((name) => values[name] != null)) {
      return record;
    }
    const json = record instanceof Model ? record.toJSON() : record;
    return projectAssociations(json, collection, storages, relatedStorage);
  }

  if (actionName === 'get') {
    ctx.body = projectRecord(ctx.body);
  } else if (Array.isArray(ctx.body)) {
    ctx.body = ctx.body.map(projectRecord);
  } else if (Array.isArray(ctx.body.rows)) {
    ctx.body = { ...ctx.body, rows: ctx.body.rows.map(projectRecord) };
  }
}
