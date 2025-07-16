/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '..';
import { getRepositoryFromParams, pageArgsToLimitArgs } from '../utils';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '../constants';
import _ from 'lodash';

const DEFAULT_PAGE_LIMIT = 50000;

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

function findArgs(ctx: Context) {
  const params = ctx.action.params;

  const { fields, filter, appends, except, sort } = params;
  let { tree } = params;
  if (tree === true || tree === 'true') {
    tree = true;
  } else {
    tree = false;
  }
  return { tree, filter, fields, appends, except, sort };
}

async function listWithPagination(ctx: Context) {
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE } = ctx.action.params;

  const repository = getRepositoryFromParams(ctx);

  let { simplePaginate } = repository.collection?.options || {};

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

  if (!simplePaginate && _.isFunction(repository['getEstimatedRowCount'])) {
    const count = await repository['getEstimatedRowCount']();
    if (count > DEFAULT_PAGE_LIMIT) {
      const resourceName = ctx.action.resourceName;
      const [collectionName] = resourceName.split('.');

      await ctx.app.db.getRepository('collections').update({
        filter: { name: collectionName },
        values: {
          options: {
            ...repository.collection?.options,
            simplePaginate: true,
          },
        },
      });
      simplePaginate = true;
    }
  }

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
  const repository = getRepositoryFromParams(ctx);

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
