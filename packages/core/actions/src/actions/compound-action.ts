/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateOptions, FirstOrCreateOptions, Repository, Transaction } from '@nocobase/database';
import lodash from 'lodash';
import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

type CompoundActionName = 'firstOrCreate' | 'updateOrCreate';
type ActualActionName = 'get' | 'create' | 'update';
type CompoundRepositoryOptions = FirstOrCreateOptions &
  Pick<CreateOptions, 'whitelist' | 'blacklist'> & { targetCollection?: string };

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

function getTargetCollection(repository: Repository & { targetCollection?: Repository['collection'] }) {
  return repository.targetCollection || repository.collection;
}

function getCompoundActionRepository(ctx: Context): Repository {
  return ctx.getCurrentRepository ? ctx.getCurrentRepository() : getRepositoryFromParams(ctx);
}

async function withCurrentTransaction<T>(
  ctx: Context,
  callback: (transaction?: Transaction) => Promise<T>,
): Promise<T> {
  const database = ctx.database ?? ctx.db;
  if (!database?.sequelize) {
    return callback();
  }
  return database.sequelize.transaction(callback);
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

  const resolved = await ctx.acl.resolveActionParams(ctx, {
    actionName,
    params: originalParams,
    resourceName: ctx.action.resourceName,
    useCurrentRepository: true,
  });
  ctx.action.params = resolved.mergedParams;
  ctx.permission.can = can;
  ctx.permission.parsedParams = resolved.parsedParams;
  ctx.permission.rawParams = resolved.rawParams;
  ctx.permission.mergedParams = lodash.cloneDeep(resolved.mergedParams);
  ctx.permission.actualActionName = actionName;
  ctx.permission.deferred = false;
}

export function compoundAction(actionName: CompoundActionName) {
  return async function compoundActionHandler(ctx: Context, next) {
    const repository = getCompoundActionRepository(ctx);

    // The actions package can be used without ACL middleware. In that case,
    // preserve the repository action behavior; once ACL is present, the
    // server-generated deferred marker is mandatory.
    if (!ctx.acl) {
      const compoundParams: CompoundRepositoryOptions = {
        filterKeys: ctx.action.params.filterKeys,
        values: ctx.action.params.values,
        whitelist: ctx.action.params.whitelist,
        blacklist: ctx.action.params.blacklist,
        updateAssociationValues: ctx.action.params.updateAssociationValues,
        targetCollection: ctx.action.params.targetCollection,
        context: ctx,
      };
      ctx.body =
        actionName === 'firstOrCreate'
          ? await repository.firstOrCreate(compoundParams)
          : await repository.updateOrCreate(compoundParams);
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
    ctx.body = await withCurrentTransaction(ctx, async (transaction) => {
      const instance = await repository.findOne({ filter, transaction, context: ctx });

      if (!instance) {
        await applyActualActionPermission(ctx, 'create', originalParams);
        return repository.create({
          values: ctx.action.params.values,
          ...lodash.pick(
            ctx.action.params,
            createParamKeys.filter((key) => key !== 'values'),
          ),
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
        values: ctx.action.params.values,
        ...lodash.pick(
          ctx.action.params,
          updateParamKeys.filter((key) => key !== 'values'),
        ),
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
