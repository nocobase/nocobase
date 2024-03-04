import { Context } from '@nocobase/actions';
import { DataSource, IRepository } from '../';

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

export function getRepositoryFromParams(ctx: Context): IRepository {
  const { resourceName, resourceOf } = ctx.action;

  const dataSource: DataSource = ctx.dataSource;

  if (resourceOf) {
    return dataSource.collectionManager.getRepository(resourceName, resourceOf);
  }

  return dataSource.collectionManager.getRepository(resourceName);
}
