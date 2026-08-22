/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import lodash from 'lodash';
import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

type CompoundActionName = 'firstOrCreate' | 'updateOrCreate';
type ActualActionName = 'get' | 'create' | 'update';

const findParamKeys = ['fields', 'appends', 'except', 'filter', 'targetCollection'];
const createParamKeys = ['values', 'whitelist', 'blacklist', 'updateAssociationValues', 'targetCollection'];
const updateParamKeys = [
  'values',
  'whitelist',
  'blacklist',
  'filter',
  'updateAssociationValues',
  'forceUpdate',
  'targetCollection',
];

function getTargetCollection(repository) {
  return repository.targetCollection || repository.collection;
}

async function applyActualActionPermission(ctx: Context, actionName: ActualActionName, originalParams) {
  if (ctx.permission?.deferred !== true || !['firstOrCreate', 'updateOrCreate'].includes(ctx.action.actionName)) {
    ctx.throw(403, 'No permissions');
  }

  const { resourceName } = ctx.permission;
  const can = ctx.can({
    resource: resourceName,
    action: actionName,
    rawResourceName: ctx.action.resourceName,
  });
  if (!can || typeof can !== 'object') {
    ctx.throw(403, 'No permissions');
  }

  ctx.action.params = lodash.cloneDeep(originalParams);
  await ctx.acl.applyActionParams(ctx, can, resourceName, actionName);
  ctx.permission.can = can;
  ctx.permission.actualActionName = actionName;
  ctx.permission.deferred = false;
}

export function compoundAction(actionName: CompoundActionName) {
  return async function compoundActionHandler(ctx: Context, next) {
    const repository = getRepositoryFromParams(ctx);

    // The actions package can be used without ACL middleware. In that case,
    // preserve the repository action behavior; once ACL is present, the
    // server-generated deferred marker is mandatory.
    if (!ctx.acl) {
      ctx.body = await repository[actionName]({
        ...lodash.pick(ctx.action.params, [...createParamKeys, 'filterKeys']),
        context: ctx,
      });
      ctx.status = 200;
      await next();
      return;
    }

    if (ctx.permission?.deferred !== true || ctx.action.actionName !== actionName) {
      ctx.throw(403, 'No permissions');
    }

    const originalParams = lodash.cloneDeep(ctx.action.params);
    const { filterKeys, values } = originalParams;
    const filter = Repository.valuesToFilter(values, filterKeys);
    const database = repository.database || repository.db;

    ctx.body = await database.sequelize.transaction(async (transaction) => {
      const instance = await repository.findOne({ filter, transaction, context: ctx });

      if (!instance) {
        await applyActualActionPermission(ctx, 'create', originalParams);
        return repository.create({
          ...lodash.pick(ctx.action.params, createParamKeys),
          transaction,
          context: ctx,
        });
      }

      const targetCollection = getTargetCollection(repository);
      const targetKey = targetCollection.filterTargetKey || targetCollection.model.primaryKeyAttribute;
      const filterByTk = instance.get(targetKey);

      if (actionName === 'firstOrCreate') {
        await applyActualActionPermission(ctx, 'get', originalParams);
        const result = await repository.findOne({
          ...lodash.pick(ctx.action.params, findParamKeys),
          filterByTk,
          transaction,
          context: ctx,
        });
        if (!result) {
          ctx.throw(403, 'No permissions');
        }
        return result;
      }

      await applyActualActionPermission(ctx, 'update', originalParams);
      const result = await repository.update({
        ...lodash.pick(ctx.action.params, updateParamKeys),
        filterByTk,
        transaction,
        context: ctx,
      });
      if (!result || (Array.isArray(result) && result.length === 0)) {
        ctx.throw(403, 'No permissions');
      }
      return result;
    });

    ctx.status = 200;
    await next();
  };
}
