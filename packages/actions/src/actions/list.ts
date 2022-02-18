import { Context } from '..';
import { getRepositoryFromParams } from './utils';

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

export async function list(ctx: Context, next) {
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE, fields, filter, appends, except, sort } = ctx.action.params;

  const repository = getRepositoryFromParams(ctx);

  const [rows, count] = await repository.findAndCount({
    filter,
    fields,
    appends,
    except,
    sort,
    ...pageArgsToLimitArgs(parseInt(String(page)), parseInt(String(pageSize))),
  });

  ctx.body = {
    count,
    rows,
    page,
    pageSize,
    totalPage: totalPage(count, pageSize),
  };

  await next();
}
