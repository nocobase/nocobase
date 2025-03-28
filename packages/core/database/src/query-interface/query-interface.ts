/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ColumnDescription,
  ModelStatic,
  QueryInterface as SequelizeQueryInterface,
  Transaction,
  Transactionable,
} from 'sequelize';
import { Collection } from '../collection';
import Database from '../database';

export type TableInfo = {
  tableName: string;
  schema?: string;
};

export interface ChangeColumnOptions {
  tableName: string;
  schema?: string;
  columnName: string;
  columnDescription: ColumnDescription;
  model: ModelStatic<any>;
  options?: Transactionable;
  actions: ChangeColumnAction[];
}

export const ChangeColumnAction = {
  ADD: 'add',
  DROP: 'drop',
  MODIFY: 'modify',
  SET_DEFAULT_VALUE: 'setDefaultValue',
  RENAME_TABLE: 'renameTable',
  ADD_PRIMARY_KEY: 'addPrimaryKey',
  DROP_PRIMARY_KEY: 'dropPrimaryKey',
  ADD_CONSTRAINT: 'addConstraint',
  DROP_CONSTRAINT: 'dropConstraint',
} as const;

export type ChangeColumnAction = (typeof ChangeColumnAction)[keyof typeof ChangeColumnAction];

type QueryInterfaceConfig = {
  changeColumnMode?: 'default' | 'sequelize';
};
export default abstract class QueryInterface {
  sequelizeQueryInterface: SequelizeQueryInterface;

  private config: QueryInterfaceConfig;

  protected constructor(
    public db: Database,
    config?: QueryInterfaceConfig,
  ) {
    this.sequelizeQueryInterface = db.sequelize.getQueryInterface();
    this.config = config || { changeColumnMode: 'default' };
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

  abstract changeColumnDefaultValueSQL(options: ChangeColumnOptions): Promise<string>;

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

  public async changeColumn(options: ChangeColumnOptions) {
    if (!options.actions.length) {
      throw new Error('Actions invalid');
    }
    const { columnName, columnDescription, tableName, options: sequelizeOptions } = options;

    const transaction = sequelizeOptions?.transaction || (await this.db.sequelize.transaction());
    const needCommit = !sequelizeOptions?.transaction;

    const handler = async () => {
      if (this.config.changeColumnMode === 'sequelize') {
        await this.sequelizeQueryInterface.changeColumn(tableName, columnName, columnDescription, {
          ...sequelizeOptions,
          transaction,
        });
      } else {
        const actions = [...new Set(options.actions)];
        let sql = '';
        if (actions.includes(ChangeColumnAction.SET_DEFAULT_VALUE)) {
          sql += (await this.changeColumnDefaultValueSQL(options)) || '';
        }
        if (sql) {
          await this.db.sequelize.query(sql, { transaction });
        }
      }
    };

    try {
      await handler();
      needCommit && (await transaction.commit());
    } catch (error) {
      needCommit && (await transaction.rollback());
      throw error;
    }
  }
}
