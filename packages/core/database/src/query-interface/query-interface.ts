/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

  abstract listViews(options?: { schema?: string });

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

      try {
        await this.db.sequelize.query(removeSql, { transaction: options.transaction });
      } catch (e) {
        console.log(`can not drop view ${view.name}, ${e.message}`);
      }
    }

    await this.db.sequelize.getQueryInterface().dropAllTables(options);
  }

  abstract getAutoIncrementInfo(options: {
    tableInfo: TableInfo;
    fieldName: string;
    transaction?: Transaction;
  }): Promise<{ seqName?: string; currentVal: number }>;

  abstract setAutoIncrementVal(options: {
    tableInfo: TableInfo;
    columnName: string;
    seqName?: string;
    currentVal: number;
    transaction?: Transaction;
  }): Promise<void>;

  public quoteIdentifier(identifier: string) {
    // @ts-ignore
    return this.db.sequelize.getQueryInterface().queryGenerator.quoteIdentifier(identifier);
  }

  public generateJoinOnForJSONArray(left: string, right: string) {
    const dialect = this.db.sequelize.getDialect();
    throw new Error(`Filtering by many to many (array) associations is not supported on ${dialect}`);
  }
}
