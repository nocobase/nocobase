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
import { resolveVariablesTemplate } from '@nocobase/plugin-flow-engine';

const getDB = (ctx: Context, dataSource: string) => {
  const ds = ctx.app.dataSourceManager.dataSources.get(dataSource);
  return ds?.collectionManager.db;
};

const getTimezone = (ctx: Context) =>
  ctx?.request?.get?.('x-timezone') ?? ctx?.request?.header?.['x-timezone'] ?? ctx?.req?.headers?.['x-timezone'];

export const checkPermission = async (ctx: Context, next: Next) => {
  const values = ctx.action.params.values || {};
  const acl = ctx.app.dataSourceManager.get(values.dataSource)?.acl || ctx.app.acl;

  try {
    const result = await applyQueryPermission({
      acl,
      db: getDB(ctx, values.dataSource) || ctx.db,
      resourceName: values.collection,
      query: values,
      currentUser: ctx.state?.currentUser,
      currentRole: ctx.state?.currentRole,
      currentRoles: ctx.state?.currentRoles,
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
  const db = getDB(ctx, dataSource) || ctx.db;
  const repository = db.getRepository(collection);
  ctx.body = await repository.query({
    ...queryOptions,
    timezone: ctx.get?.('x-timezone'),
  });
  await next();
};

export const parseVariables = async (ctx: Context, next: Next) => {
  const { mode, contextParams, ...values } = ctx.action.params.values as QueryParams;
  if (mode !== 'sql') {
    const resolvedValues = await resolveVariablesTemplate(ctx as any, values as any, contextParams || {});
    ctx.action.params.values = {
      ...ctx.action.params.values,
      ...(resolvedValues as Record<string, any>),
    };
  }

  const { filter } = ctx.action.params.values;
  ctx.action.params.filter = filter;
  await middlewares.parseVariables(ctx, async () => {
    ctx.action.params.values.filter = ctx.action.params.filter;
    await next();
  });
};

export const cacheMiddleware = async (ctx: Context, next: Next) => {
  const { uid, cache: cacheConfig, refresh } = ctx.action.params.values as QueryParams;
  const cache = ctx.app.cacheManager.getCache('data-visualization') as Cache;
  const useCache = cacheConfig?.enabled && uid;

  if (useCache && !refresh) {
    const data = await cache.get(uid);
    if (data) {
      ctx.body = data;
      return;
    }
  }
  await next();
  if (useCache) {
    await cache.set(uid, ctx.body, cacheConfig?.ttl * 1000);
  }
};

export const queryDataAction = async (ctx: Context, next: Next) => {
  try {
    await compose([checkPermission, cacheMiddleware, parseVariables, queryData])(ctx, next);
  } catch (err) {
    ctx.throw(500, err);
  }
};
