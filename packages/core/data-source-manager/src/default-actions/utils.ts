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
  const { resourceName, sourceId, actionName } = ctx.action;

  const dataSource: DataSource = ctx.dataSource;

  if (sourceId === '_' && ['get', 'list'].includes(actionName)) {
    const collection = dataSource.collectionManager.getCollection(resourceName);
    return dataSource.collectionManager.getRepository(collection.name);
  }

  if (sourceId) {
    return dataSource.collectionManager.getRepository(resourceName, sourceId);
  }

  return dataSource.collectionManager.getRepository(resourceName);
}
