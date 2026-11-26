import type { QueryAdapter } from '../../query/types.js';
import type { Repository, RepositoryRecord } from '../../repository/types.js';
import type { DatabaseConnection } from '../connection.js';

/** The data handles supplied only to migration and seed tasks. */
interface TaskData {
  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: string,
  ): Repository<TRecord, TCreate, TUpdate>;
  query(): QueryAdapter;
}

export const databaseTaskData: WeakMap<DatabaseConnection, TaskData> =
  new WeakMap();
