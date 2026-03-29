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
import { middlewares } from '@nocobase/server';
import { QueryParams } from '../types';
import { assign } from '@nocobase/utils';
import { checkFilterParams, NoPermissionError } from '@nocobase/acl';

const getDB = (ctx: Context, dataSource: string) => {
  const ds = ctx.app.dataSourceManager.dataSources.get(dataSource);
  return ds?.collectionManager.db;
};

const getChartQueryPermission = async (ctx: Context, collection: string, acl: any) => {
  const actionCtx: any = {
    app: ctx.app,
    db: ctx.db,
    database: ctx.database ?? ctx.db,
    getCurrentRepository: ctx.getCurrentRepository,
    request: ctx.request,
    req: ctx.req,
    action: {
      actionName: 'list',
      name: 'list',
      params: {},
      resourceName: collection,
      mergeParams() {},
    },
    state: {
      ...ctx.state,
      currentRole: ctx.state.currentRole,
      currentRoles: ctx.state.currentRoles,
      currentUser: ctx.state.currentUser?.toJSON ? ctx.state.currentUser.toJSON() : ctx.state.currentUser,
    },
    permission: {},
    throw(...args) {
      ctx.throw(...args);
    },
  };

  await acl.getActionParams(actionCtx);

  return actionCtx.permission;
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

export const checkPermission = async (ctx: Context, next: Next) => {
  const { collection, dataSource } = ctx.action.params.values as QueryParams;
  const acl = ctx.app.dataSourceManager.get(dataSource)?.acl || ctx.app.acl;
  const permission = await getChartQueryPermission(ctx, collection, acl);
  const filterParams = permission?.parsedParams?.filter;

  if (filterParams) {
    try {
      checkFilterParams(ctx.database.getCollection(collection), filterParams);
    } catch (e) {
      if (e instanceof NoPermissionError) {
        ctx.throw(403, 'No permissions');
      }
    }
    const filter = ctx.action.params.values.filter || {};
    ctx.action.params.values = {
      ...ctx.action.params.values,
      filter: assign(filter, filterParams, {
        filter: 'andMerge',
      }),
    };
  }
  return next();
};

export const query = async (ctx: Context, next: Next) => {
  try {
    await compose([checkPermission, cacheMiddleware, parseVariables, queryData])(ctx, next);
  } catch (err) {
    ctx.throw(500, err);
  }
};
