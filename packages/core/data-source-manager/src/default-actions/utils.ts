import { Context } from '@nocobase/actions';

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

  if (resourceOf) {
    return ctx.dataSource.collectionManager.getRepository(resourceName, resourceOf);
  }

  return ctx.dataSource.collectionManager.getRepository(resourceName);
}
