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

export function pageArgsToLimitArgs(
  page: number,
  pageSize: number,
): {
  offset: number;
  limit: number;
} {
  return {
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

export function getRepositoryFromParams(ctx: Context) {
  const { resourceName, sourceId, actionName } = ctx.action;

  let repository: Repository | MultipleRelationRepository | undefined;

  if (sourceId === '_' && ['get', 'list'].includes(actionName)) {
    const collection = ctx.db.getCollection(resourceName);
    repository = collection ? ctx.db.getRepository<Repository>(collection.name) : undefined;
  } else if (sourceId) {
    repository = ctx.db.getRepository<MultipleRelationRepository>(resourceName, sourceId);
  } else {
    repository = ctx.db.getRepository<Repository>(resourceName);
  }

  // A collection that was destroyed moments ago leaves its resourcer route
  // behind: the request still reaches the action, and getRepository returns
  // undefined. Answer 404 here — the same answer this API gives for a
  // collection that never existed — instead of letting the action crash
  // with a TypeError ("Cannot read properties of undefined (reading
  // 'collection')") and surface as a 500 (#10397).
  if (!repository) {
    ctx.throw(404, `collection ${resourceName} does not exist`);
  }

  return repository;
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
