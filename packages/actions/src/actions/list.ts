import { Context } from '..';
import { getRepositoryFromParams } from './utils';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;

function pageArgsToLimitArgs(
  page: number,
  perPage: number,
): {
  offset: number;
  limit: number;
} {
  return {
    offset: (page - 1) * perPage,
    limit: perPage,
  };
}

function totalPage(total, perPage): number {
  return Math.ceil(total / perPage);
}

export async function list(ctx: Context, next) {
  const { page = DEFAULT_PAGE, perPage = DEFAULT_PER_PAGE, fields, filter, appends, except, sort } = ctx.action.params;

  const repository = getRepositoryFromParams(ctx);

  const [rows, count] = await repository.findAndCount({
    filter,
    fields,
    appends,
    except,
    sort,
    ...pageArgsToLimitArgs(page, perPage),
  });

  ctx.body = {
    count,
    rows,
    page,
    perPage,
    totalPage: totalPage(count, perPage),
  };

  await next();
}
