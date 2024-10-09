/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { assign, isValidFilter } from '@nocobase/utils';
import { pageArgsToLimitArgs } from './utils';

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

function findArgs(ctx: Context) {
  const resourceName = ctx.action.resourceName;
  const params = ctx.action.params;

  if (params.tree) {
    if (isValidFilter(params.filter)) {
      params.tree = false;
    } else {
      const [collectionName, associationName] = resourceName.split('.');
      const collection = ctx.dataSource.collectionManager.getCollection(resourceName);
      if (collection.options.tree && !(associationName && collectionName === collection.name)) {
        const foreignKey = collection.treeParentField?.foreignKey || 'parentId';
        assign(params, { filter: { [foreignKey]: null } }, { filter: 'andMerge' });
      }
    }
  }

  const { tree, fields, filter, appends, except, sort } = params;

  return { tree, filter, fields, appends, except, sort };
}

async function listWithPagination(ctx: Context) {
  const { page = 1, pageSize = 50 } = ctx.action.params;

  const repository = ctx.getCurrentRepository();

  const { simplePaginate } = repository.collection?.options || {};

  const options = {
    context: ctx,
    ...findArgs(ctx),
    ...pageArgsToLimitArgs(parseInt(String(page)), parseInt(String(pageSize))),
  };

  Object.keys(options).forEach((key) => {
    if (options[key] === undefined) {
      delete options[key];
    }
  });

  if (simplePaginate) {
    options.limit = options.limit + 1;

    const rows = await repository.find(options);
    ctx.body = {
      rows: rows.slice(0, pageSize),
      hasNext: rows.length > pageSize,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  } else {
    const [rows, count] = await repository.findAndCount(options);

    ctx.body = {
      count,
      rows,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPage: totalPage(count, pageSize),
    };
  }
}

async function listWithNonPaged(ctx: Context) {
  const repository = ctx.getCurrentRepository();

  const rows = await repository.find({ context: ctx, ...findArgs(ctx) });

  ctx.body = rows;
}

export async function list(ctx: Context, next) {
  const { paginate } = ctx.action.params;

  if (paginate === false || paginate === 'false') {
    await listWithNonPaged(ctx);
    ctx.paginate = false;
  } else {
    await listWithPagination(ctx);
    ctx.paginate = true;
  }

  await next();
}
