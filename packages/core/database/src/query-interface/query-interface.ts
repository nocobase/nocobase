import { QueryInterface as SequelizeQueryInterface, Transaction, Transactionable } from 'sequelize';
import { Collection } from '../collection';
import Database from '../database';

export type TableInfo = {
  tableName: string;
  schema?: string;
};

export default abstract class QueryInterface {
  sequelizeQueryInterface: SequelizeQueryInterface;

  protected constructor(public db: Database) {
    this.sequelizeQueryInterface = db.sequelize.getQueryInterface();
  }

  abstract collectionTableExists(collection: Collection, options?: Transactionable): Promise<boolean>;

  abstract listViews();

  abstract viewDef(viewName: string): Promise<string>;

  abstract viewColumnUsage(options: { viewName: string; schema?: string }): Promise<{
    [view_column_name: string]: {
      column_name: string;
      table_name: string;
      table_schema?: string;
    };
  }>;

  abstract parseSQL(sql: string): any;

  abstract showTableDefinition(tableInfo: TableInfo): Promise<any>;

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

  abstract getAutoIncrementInfo(options: {
    tableInfo: TableInfo;
    fieldName: string;
  }): Promise<{ seqName?: string; currentVal: number }>;

  abstract setAutoIncrementVal(options: {
    tableInfo: TableInfo;
    columnName: string;
    seqName?: string;
    currentVal: number;
    transaction?: Transaction;
  }): Promise<void>;
}
