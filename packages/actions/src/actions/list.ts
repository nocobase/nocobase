import { Context } from '..';
import { getRepositoryFromParams } from './utils';
import lodash from 'lodash';

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

interface ListActionBuilderOptions {
  defaultAssociatedKey?: string;
}

export function listActionBuilder(options?: ListActionBuilderOptions) {
  return async function list(ctx: Context, next) {
    if (lodash.get(options, 'defaultAssociatedKey')) {
      ctx.action.params.associatedKey = options.defaultAssociatedKey;
    }

    const {
      page = DEFAULT_PAGE,
      perPage = DEFAULT_PER_PAGE,
      fields,
      filter,
      appends,
      except,
      sort,
    } = ctx.action.params;

    const repository = getRepositoryFromParams(ctx);

    const findOptions = {
      filter,
      fields,
      appends,
      except,
      sort,
      ...pageArgsToLimitArgs(page, perPage),
    };

    const [rows, count] = await repository.findAndCount(findOptions);

    ctx.body = {
      count,
      rows,
      page,
      perPage,
      totalPage: totalPage(count, perPage),
    };

    await next();
  };
}

export const list = listActionBuilder();
