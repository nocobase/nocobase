/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultipleRelationRepository, Repository } from '@nocobase/database';
import { Context } from '.';

export function normalizePageArgs(
  page: number,
  pageSize: number,
): {
  page: number;
  pageSize: number;
} {
  const coercedPage = Number(page);
  const coercedPageSize = Number(pageSize);

  const parsedPage = Number.isFinite(coercedPage) ? Math.floor(coercedPage) : NaN;
  const parsedPageSize = Number.isFinite(coercedPageSize) ? Math.floor(coercedPageSize) : NaN;

  const safePageSize = parsedPageSize > 0 ? parsedPageSize : 1;
  const safePage = parsedPage > 0 ? parsedPage : 1;

  return {
    page: safePage,
    pageSize: safePageSize,
  };
}

export function pageArgsToLimitArgs(
  page: number,
  pageSize: number,
): {
  offset: number;
  limit: number;
} {
  const { page: safePage, pageSize: safePageSize } = normalizePageArgs(page, pageSize);

  return {
    offset: (safePage - 1) * safePageSize,
    limit: safePageSize,
  };
}

export function getRepositoryFromParams(ctx: Context) {
  const { resourceName, sourceId, actionName } = ctx.action;

  if (sourceId === '_' && ['get', 'list'].includes(actionName)) {
    const collection = ctx.db.getCollection(resourceName);
    return ctx.db.getRepository<Repository>(collection.name);
  }

  if (sourceId) {
    return ctx.db.getRepository<MultipleRelationRepository>(resourceName, sourceId);
  }

  return ctx.db.getRepository<Repository>(resourceName);
}

export function RelationRepositoryActionBuilder(method: 'remove' | 'set') {
  return async function (ctx: Context, next) {
    const repository = getRepositoryFromParams(ctx);

    const filterByTk = ctx.action.params.filterByTk || ctx.action.params.filterByTks || ctx.action.params.values;

    await repository[method](filterByTk);

    ctx.status = 200;
    await next();
  };
}
