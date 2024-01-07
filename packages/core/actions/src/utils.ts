import { Database, MultipleRelationRepository, Repository } from '@nocobase/database';
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
  const { resourceName, resourceOf } = ctx.action;

  const databaseName = ctx.get('x-database');
  const database = ctx.app.getDb(databaseName || 'main') as Database;

  if (resourceOf) {
    return database.getRepository<MultipleRelationRepository>(resourceName, resourceOf);
  }

  return database.getRepository<Repository>(resourceName);
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
