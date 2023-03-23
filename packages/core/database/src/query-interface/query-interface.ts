import Database from '../database';
import { Collection } from '../collection';
import { QueryInterface as SequelizeQueryInterface, Transactionable } from 'sequelize';

export default abstract class QueryInterface {
  sequelizeQueryInterface: SequelizeQueryInterface;

  protected constructor(public db: Database) {
    this.sequelizeQueryInterface = db.sequelize.getQueryInterface();
  }

  abstract collectionTableExists(collection: Collection, options?: Transactionable): Promise<boolean>;

  abstract listViews();

  abstract viewColumnUsage(options: { viewName: string; schema?: string });
}
