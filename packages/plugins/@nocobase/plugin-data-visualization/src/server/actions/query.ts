/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import compose from 'koa-compose';
import { Cache } from '@nocobase/cache';
import { NoPermissionError } from '@nocobase/acl';
import { applyQueryPermission } from '@nocobase/plugin-acl';
import { middlewares } from '@nocobase/server';
import { QueryParams } from '../types';
import PluginFlowEngineServer from '@nocobase/plugin-flow-engine';

const getQueryDatabase = (ctx: Context, dataSource: string) => {
  const ds = ctx.app.dataSourceManager.dataSources.get(dataSource);
  return ds?.collectionManager?.db || ctx.db;
};

const getTimezone = (ctx: Context) =>
  ctx?.request?.get?.('x-timezone') ?? ctx?.request?.header?.['x-timezone'] ?? ctx?.req?.headers?.['x-timezone'];

export const checkPermission = async (ctx: Context, next: Next) => {
  const values = ctx.action.params.values || {};
  const acl = ctx.app.dataSourceManager.get(values.dataSource)?.acl || ctx.app.acl;
  const currentRoles = ctx.state?.currentRoles || (ctx.state?.currentRole ? [ctx.state.currentRole] : []);

  if (currentRoles.includes('root')) {
    await next();
    return;
  }

  try {
    const result = await applyQueryPermission({
      acl,
      db: getQueryDatabase(ctx, values.dataSource),
      resourceName: values.collection,
      query: values,
      currentUser: ctx.state?.currentUser,
      currentRole: ctx.state?.currentRole,
      currentRoles,
      timezone: getTimezone(ctx) as string,
      state: ctx.state,
    });
    ctx.action.params.values = result.query;
  } catch (err) {
    if (!(err instanceof NoPermissionError)) {
      throw err;
    }
    ctx.throw(403, 'No permissions');
  }

  await next();
};

export const queryData = async (ctx: Context, next: Next) => {
  const { dataSource, collection, ...queryOptions } = ctx.action.params.values;
  const repository = getQueryDatabase(ctx, dataSource).getRepository(collection);
  ctx.body = await repository.query({
    context: ctx,
    ...queryOptions,
    timezone: ctx.get?.('x-timezone'),
  });
  await next();
};

export const parseVariables = async (ctx: Context, next: Next) => {
  const { mode, contextParams, rd, variableResolution, ...values } = ctx.action.params.values as QueryParams;
  if (mode !== 'sql') {
    const flowEngine = ctx.app.pm.get('flow-engine') as PluginFlowEngineServer;
    const isLegacyLane = mode === 'builder' && variableResolution === 'legacy-schema' && typeof rd === 'undefined';
    if (isLegacyLane) {
      const hasEmptyContextParams =
        typeof contextParams === 'undefined' ||
        (contextParams !== null &&
          typeof contextParams === 'object' &&
          !Array.isArray(contextParams) &&
          Object.keys(contextParams).length === 0);
      if (!hasEmptyContextParams || !flowEngine.isLegacyVariableTemplateSafe(values)) {
        ctx.body = [];
        return;
      }
      ctx.action.params.values = { mode, ...values };
    } else {
      const resolvedValues = await flowEngine.resolveFlowModelVariablesTemplate(ctx, {
        contextParams,
        rd,
        template: values,
      });
      if (!resolvedValues) {
        ctx.body = [];
        return;
      }
      ctx.action.params.values = {
        mode,
        ...values,
        ...(resolvedValues as Record<string, unknown>),
      };
    }
  } else {
    ctx.action.params.values = { mode, ...values };
  }

  const { filter } = ctx.action.params.values;
  ctx.action.params.filter = filter;
  await middlewares.parseVariables(ctx, async () => {
    ctx.action.params.values.filter = ctx.action.params.filter;
    await next();
  });
};

export const cacheMiddleware = async (ctx: Context, next: Next) => {
  const { uid, cache: cacheConfig, refresh, ...query } = ctx.action.params.values as QueryParams;
  const useCache = cacheConfig?.enabled && uid;
  if (!useCache) {
    await next();
    return;
  }
  const cache = ctx.app.cacheManager.getCache('data-visualization') as Cache;
  const cacheKey = JSON.stringify([uid, query]);

  if (!refresh) {
    const data = await cache.get(cacheKey);
    if (data) {
      ctx.body = data;
      return;
    }
  }
  await next();
  await cache.set(cacheKey, ctx.body, cacheConfig?.ttl * 1000);
};

export const queryDataAction = async (ctx: Context, next: Next) => {
  try {
    await compose([checkPermission, parseVariables, cacheMiddleware, queryData])(ctx, next);
  } catch (err) {
    ctx.throw(500, err);
  }
};
