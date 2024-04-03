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
