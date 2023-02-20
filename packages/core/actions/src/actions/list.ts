import { ActionParams } from '@nocobase/resourcer';
import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;

function pageArgsToLimitArgs(
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

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

function findArgs(params: ActionParams) {
  const { tree, fields, filter, appends, except, sort } = params;
  return { tree, filter, fields, appends, except, sort };
}

async function listWithPagination(ctx: Context) {
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE } = ctx.action.params;

  const repository = getRepositoryFromParams(ctx);

  const [rows, count] = await repository.findAndCount({
    context: ctx,
    ...findArgs(ctx.action.params),
    ...pageArgsToLimitArgs(parseInt(String(page)), parseInt(String(pageSize))),
  });

  ctx.body = {
    count,
    rows,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPage: totalPage(count, pageSize),
  };
}

async function listWithNonPaged(ctx: Context) {
  const repository = getRepositoryFromParams(ctx);

  const rows = await repository.find({ context: ctx, ...findArgs(ctx.action.params) });

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
