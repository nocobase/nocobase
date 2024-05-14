/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, sqlParser, SQLParserTypes } from '@nocobase/database';
import { selectQuery } from './query-generator';

export class SQLModel extends Model {
  static sql: string;

  static get queryInterface() {
    const queryInterface = this.sequelize.getQueryInterface();
    const queryGenerator = queryInterface.queryGenerator as any;
    const sqlGenerator = new Proxy(queryGenerator, {
      get(target, prop) {
        if (prop === 'selectQuery') {
          return selectQuery.bind(target);
        }
        return Reflect.get(target, prop);
      },
    });
    return new Proxy(queryInterface, {
      get(target, prop) {
        if (prop === 'queryGenerator') {
          return sqlGenerator;
        }
        return Reflect.get(target, prop);
      },
    });
  }

  static async sync(): Promise<any> {}

  static inferFields(): {
    [field: string]: {
      type: string;
      source: string;
      collection: string;
      interface: string;
    };
  } {
    const tables = this.parseTablesAndColumns();
    console.log(tables);
    return tables.reduce((fields, { table, columns }) => {
      const tableName = this.getTableNameWithSchema(table);
      const collection = this.database.tableNameCollectionMap.get(tableName);
      if (!collection) {
        return fields;
      }
      const attributes = collection.model.getAttributes();
      const sourceFields = {};
      if (columns === '*') {
        Object.values(attributes).forEach((attribute) => {
          const field = collection.getField((attribute as any).fieldName);
          if (!field?.options.interface) {
            return;
          }
          sourceFields[field.name] = {
            collection: field.collection.name,
            type: field.type,
            source: `${field.collection.name}.${field.name}`,
            interface: field.options.interface,
            uiSchema: field.options.uiSchema,
          };
        });
      } else {
        (columns as { name: string; as: string }[]).forEach((column) => {
          const modelField = Object.values(attributes).find((attribute) => attribute.field === column.name);
          if (!modelField) {
            return;
          }
          const field = collection.getField((modelField as any).fieldName);
          if (!field?.options.interface) {
            return;
          }
          sourceFields[column.as || column.name] = {
            collection: field.collection.name,
            type: field.type,
            source: `${field.collection.name}.${field.name}`,
            interface: field.options.interface,
            uiSchema: field.options.uiSchema,
          };
        });
      }
      return { ...fields, ...sourceFields };
    }, {});
  }

  private static parseTablesAndColumns(): {
    table: string;
    columns: string | { name: string; as: string }[];
  }[] {
    let { ast: _ast } = sqlParser.parse(this.sql);
    console.log(JSON.stringify(_ast, null, 2));
    if (Array.isArray(_ast)) {
      _ast = _ast[0];
    }
    const ast = _ast as SQLParserTypes.Select;
    ast.from = ast.from || [];
    ast.columns = ast.columns || [];
    if (ast.with) {
      ast.with.forEach((withItem) => {
        const as = withItem.name.value;
        const withAst = withItem.stmt.ast;
        ast.from.push(...withAst.from.map((f: any) => ({ ...f, as })));
        ast.columns.push(
          ...withAst.columns.map((c: any) => ({
            ...c,
            expr: {
              ...c.expr,
              table: as,
            },
          })),
        );
      });
    }
    const tableAliases = {};
    ast.from.forEach((fromItem: SQLParserTypes.BaseFrom) => {
      if (!fromItem.as) {
        return;
      }
      tableAliases[fromItem.as] = fromItem.table;
    });
    const columns: { [table: string]: { name: string; as: string }[] | '*' } = {};
    ast.columns.forEach((column) => {
      const expr = column.expr as SQLParserTypes.ColumnRef;
      if (expr.type !== 'column_ref') {
        return;
      }
      const table = expr.table;
      const defaultTable = (ast.from[0] as SQLParserTypes.BaseFrom)?.table;
      const name = tableAliases[table] || table || defaultTable;
      if (expr.column === '*') {
        columns[name] = '*';
        return;
      }
      const columnAttr = { name: expr.column as string, as: column.as };
      if (!columns[name]) {
        columns[name] = [columnAttr];
      } else if (columns[name] !== '*') {
        (columns[name] as any[]).push(columnAttr);
      }
    });
    return Object.entries(columns)
      .filter(([_, columns]) => columns)
      .map(([table, columns]) => ({ table, columns }));
  }

  private static getTableNameWithSchema(table: string) {
    if (this.database.inDialect('postgres') && !table.includes('.')) {
      const schema = process.env.DB_SCHEMA || 'public';
      return `${schema}.${table}`;
    }
    return table;
  }
}
