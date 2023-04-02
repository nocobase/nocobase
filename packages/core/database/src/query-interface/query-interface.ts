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

  abstract viewColumnUsage(options: { viewName: string; schema?: string }): Promise<
    Array<{
      column_name: string;
      table_name: string;
      table_schema?: string;
    }>
  >;

  async dropAll(options) {
    if (options.drop !== true) return;

    const views = await this.listViews();

    for (const view of views) {
      let removeSql;

      if (view.schema) {
        removeSql = `DROP VIEW IF EXISTS "${view.schema}"."${view.name}"`;
      } else {
        removeSql = `DROP VIEW IF EXISTS ${view.name}`;
      }

      await this.db.sequelize.query(removeSql, { transaction: options.transaction });
    }

    await this.db.sequelize.getQueryInterface().dropAllTables(options);
  }
}
