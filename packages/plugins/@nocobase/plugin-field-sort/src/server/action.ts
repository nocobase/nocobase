/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { pick } from 'lodash';
import { BelongsToManyRepository, Collection, HasManyRepository, TargetKey, Model, Op } from '@nocobase/database';
import { Context } from '@nocobase/actions';

import { SortField } from './sort-field';

export async function move(ctx: Context, next) {
  const repository = ctx.getCurrentRepository();

  if (repository.move) {
    ctx.body = await repository.move(ctx.action.params);
    return next();
  }

  if (!repository.database) {
    return ctx.throw(new Error(`Repository can not handle action move for ${ctx.action.resourceName}`));
  }

  const { sourceId, targetId, targetScope, sticky, method } = ctx.action.params;

  let sortField = ctx.action.params.sortField;

  if (repository instanceof BelongsToManyRepository) {
    throw new Error("Sorting association as 'belongs-to-many' type is not supported.");
  }

  if (repository instanceof HasManyRepository && !sortField) {
    sortField = `${repository.association.foreignKey}Sort`;
  }

  const sortableCollection = new SortableCollection(repository.collection, sortField);

  if (sourceId && targetId) {
    await sortableCollection.move(sourceId, targetId, {
      insertAfter: method === 'insertAfter',
    });
  }

  // change scope
  if (sourceId && targetScope) {
    await sortableCollection.changeScope(sourceId, targetScope, method);
  }

  if (sourceId && sticky) {
    await sortableCollection.sticky(sourceId);
  }

  ctx.body = 'ok';
  await next();
}

interface SortPosition {
  scope?: string;
  id: TargetKey;
}

interface MoveOptions {
  insertAfter?: boolean;
}

export class SortableCollection {
  collection: Collection;
  field: SortField;
  scopeKey: string;

  constructor(collection: Collection, fieldName = 'sort') {
    this.collection = collection;
    this.field = collection.getField(fieldName);

    if (!(this.field instanceof SortField)) {
      throw new Error(`${fieldName} is not a sort field`);
    }

    this.scopeKey = this.field.get('scopeKey');
  }

  // insert source position to target position
  async move(sourceInstanceId: TargetKey, targetInstanceId: TargetKey, options: MoveOptions = {}) {
    let sourceInstance = await this.collection.repository.findByTargetKey(sourceInstanceId);
    const targetInstance = await this.collection.repository.findByTargetKey(targetInstanceId);

    if (this.scopeKey && sourceInstance.get(this.scopeKey) !== targetInstance.get(this.scopeKey)) {
      [sourceInstance] = await this.collection.repository.update({
        filterByTk: sourceInstanceId,
        values: {
          [this.scopeKey]: targetInstance.get(this.scopeKey),
        },
      });
    }

    await this.sameScopeMove(sourceInstance, targetInstance, options);
  }

  async changeScope(sourceInstanceId: TargetKey, targetScope: any, method?: string) {
    let sourceInstance = await this.collection.repository.findByTargetKey(sourceInstanceId);
    const targetScopeValue = targetScope[this.scopeKey];

    if (targetScopeValue && sourceInstance.get(this.scopeKey) !== targetScopeValue) {
      [sourceInstance] = await this.collection.repository.update({
        filterByTk: sourceInstanceId,
        values: {
          [this.scopeKey]: targetScopeValue,
        },
        silent: false,
      });

      if (method === 'prepend') {
        await this.sticky(sourceInstanceId);
      }
    }
  }

  async sticky(sourceInstanceId: TargetKey) {
    await this.collection.repository.update({
      filterByTk: sourceInstanceId,
      values: {
        [this.field.get('name')]: 0,
      },
      silent: true,
    });
  }

  async sameScopeMove(sourceInstance: Model, targetInstance: Model, options: MoveOptions) {
    const fieldName = this.field.get('name');

    const sourceSort = BigInt(sourceInstance.get(fieldName));
    let targetSort = BigInt(targetInstance.get(fieldName));

    if (options.insertAfter) {
      targetSort++;
    }

    const scopeValue = this.scopeKey ? sourceInstance.get(this.scopeKey) : null;
    let updateCondition;
    let change;

    if (targetSort > sourceSort) {
      updateCondition = {
        [Op.gt]: sourceSort,
        [Op.lte]: targetSort,
      };
      change = -1;
    } else {
      updateCondition = {
        [Op.lt]: sourceSort,
        [Op.gte]: targetSort,
      };
      change = 1;
    }

    const where = {
      [fieldName]: updateCondition,
    };

    if (scopeValue) {
      where[this.scopeKey] = {
        [Op.eq]: scopeValue,
      };
    }

    await this.collection.model.increment(fieldName, {
      where,
      by: change,
      silent: true,
    });

    await this.collection.repository.update({
      filterByTk: (this.collection.isMultiFilterTargetKey()
        ? pick(sourceInstance, this.collection.filterTargetKey)
        : sourceInstance.get(<string>this.collection.filterTargetKey)) as TargetKey,
      values: {
        [fieldName]: targetSort,
      },
      silent: true,
    });
  }
}
