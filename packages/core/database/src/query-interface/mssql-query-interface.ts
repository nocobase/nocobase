/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Transaction, Transactionable } from 'sequelize';
import { Collection } from '../collection';
import sqlParser from '../sql-parser';
import QueryInterface, { TableInfo } from './query-interface';

export default class MssqlQueryInterface extends QueryInterface {
  constructor(db) {
    super(db);
  }

  async collectionTableExists(collection: Collection, options?: Transactionable) {
    const transaction = options?.transaction;

    const tableName = collection.model.tableName;
    const schema = this.db.options.schema || 'dbo';
    const sql = `SELECT TABLE_NAME
                 FROM INFORMATION_SCHEMA.TABLES
                 WHERE TABLE_SCHEMA = '${schema}'
                   AND TABLE_NAME = '${tableName}'`;

    const results = await this.db.sequelize.query(sql, { type: 'SELECT', transaction });
    return results.length > 0;
  }

  async listViews() {
    const schema = this.db.options.schema || 'dbo';
    const sql = `SELECT TABLE_NAME as name, VIEW_DEFINITION as definition
                 FROM INFORMATION_SCHEMA.VIEWS
                 WHERE TABLE_SCHEMA = '${schema}'
                 ORDER BY TABLE_NAME;`;

    return await this.db.sequelize.query(sql, { type: 'SELECT' });
  }

  async viewColumnUsage(options: { viewName: string; schema?: string }): Promise<{
    [view_column_name: string]: {
      column_name: string;
      table_name: string;
      table_schema?: string;
    };
  }> {
    try {
      const { ast } = this.parseSQL(await this.viewDef(options.viewName));

      const columns = ast.columns;

      const results = [];
      for (const column of columns) {
        if (column.expr.type === 'column_ref') {
          results.push([
            column.as || column.expr.column,
            {
              column_name: column.expr.column,
              table_name: column.expr.table,
              table_schema: options.schema || this.db.options.schema || 'dbo',
            },
          ]);
        }
      }

      return Object.fromEntries(results);
    } catch (e) {
      this.db.logger.warn(e);

      return {};
    }
  }

  parseSQL(sql: string): any {
    return sqlParser.parse(sql);
  }

  async viewDef(viewName: string): Promise<string> {
    const schema = this.db.options.schema || 'dbo';
    const viewDefinition = await this.db.sequelize.query(
      `SELECT VIEW_DEFINITION FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = '${viewName}' AND TABLE_SCHEMA = '${schema}'`,
      { type: 'SELECT' },
    );

    if (!viewDefinition.length || !viewDefinition[0]['VIEW_DEFINITION']) {
      throw new Error(`View ${viewName} not found`);
    }

    return viewDefinition[0]['VIEW_DEFINITION'];
  }

  async showTableDefinition(tableInfo: TableInfo): Promise<any> {
    const { tableName } = tableInfo;
    const schema = this.db.options.schema || 'dbo';

    const columnSql = `
      SELECT 
        c.name AS column_name,
        CASE 
          WHEN t.name = 'nvarchar' AND c.max_length = -1 THEN 'JSON' 
          ELSE t.name 
        END AS data_type,
        c.max_length,
        c.precision,
        c.scale,
        c.is_nullable,
        c.is_identity,
        OBJECT_DEFINITION(c.default_object_id) AS default_definition,
        cc.definition AS check_constraint
      FROM 
        sys.columns c
      INNER JOIN 
        sys.types t ON c.user_type_id = t.user_type_id
      LEFT JOIN 
        sys.check_constraints cc ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
      WHERE 
        OBJECT_SCHEMA_NAME(c.object_id) = @schema
        AND OBJECT_NAME(c.object_id) = @tableName
      ORDER BY 
        c.column_id;
    `;

    const indexesSql = `
      SELECT 
        i.name AS index_name,
        COL_NAME(ic.object_id, ic.column_id) AS column_name,
        i.is_unique,
        i.type_desc
      FROM 
        sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      WHERE 
        OBJECT_SCHEMA_NAME(i.object_id) = @schema
        AND OBJECT_NAME(i.object_id) = @tableName
    `;

    const [columns, indexes] = await Promise.all([
      this.db.sequelize.query(columnSql, {
        replacements: { schema, tableName },
        type: 'SELECT',
      }),
      this.db.sequelize.query(indexesSql, {
        replacements: { schema, tableName },
        type: 'SELECT',
      }),
    ]);

    return { columns, indexes };
  }

  async getAutoIncrementInfo(options: { tableInfo: TableInfo; fieldName: string; transaction: Transaction }): Promise<{
    seqName?: string;
    currentVal: number;
  }> {
    const { tableInfo, fieldName, transaction } = options;
    const schema = this.db.options.schema || 'dbo';

    // Get the current identity value
    const sql = `
      SELECT 
        IDENT_CURRENT('[${schema}].[${tableInfo.tableName}]') AS currentVal
    `;

    const results = await this.db.sequelize.query(sql, { type: 'SELECT', transaction });
    let currentVal = results[0]['currentVal'] as number;

    if (currentVal === null) {
      // Use max value of field instead
      const maxSql = `SELECT MAX([${fieldName}]) as currentVal FROM [${schema}].[${tableInfo.tableName}]`;
      const maxResults = await this.db.sequelize.query(maxSql, { type: 'SELECT', transaction });
      currentVal = maxResults[0]['currentVal'] as number;
    }

    return {
      currentVal,
    };
  }

  async setAutoIncrementVal(options: {
    tableInfo: TableInfo;
    columnName: string;
    seqName?: string;
    currentVal: number;
    transaction?: Transaction;
  }): Promise<void> {
    const { tableInfo, columnName, currentVal, transaction } = options;
    const schema = this.db.options.schema || 'dbo';

    if (currentVal) {
      // In MSSQL, we need to use DBCC CHECKIDENT to reset identity values
      const sql = `DBCC CHECKIDENT ('[${schema}].[${tableInfo.tableName}]', RESEED, ${currentVal});`;
      await this.db.sequelize.query(sql, { transaction });
    }
  }
}
