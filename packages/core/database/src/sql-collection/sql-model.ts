/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '../model';
import sqlParser from '../sql-parser';
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
    let { ast } = sqlParser.parse(this.sql);
    if (Array.isArray(ast)) {
      ast = ast[0];
    }
    ast.from = ast.from || [];
    ast.columns = ast.columns || [];
    if (ast.with) {
      ast.with.forEach((withItem: any) => {
        const as = withItem.name;
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
    if (ast.columns === '*') {
      const tables = new Set<string>();
      ast.from.forEach((fromItem: { table: string; as: string }) => {
        tables.add(fromItem.table);
      });
      return Array.from(tables).map((table) => ({ table, columns: '*' }));
    }
    const tableAliases = {};
    ast.from.forEach((fromItem: { table: string; as: string }) => {
      if (!fromItem.as) {
        return;
      }
      tableAliases[fromItem.as] = fromItem.table;
    });
    const columns: string[] = ast.columns.reduce(
      (
        tableMp: { [table: string]: { name: string; as: string }[] },
        column: {
          as: string;
          expr: {
            table: string;
            column: string;
            type: string;
          };
        },
      ) => {
        if (column.expr.type !== 'column_ref') {
          return tableMp;
        }
        const table = column.expr.table;
        const name = tableAliases[table] || table;
        const columnAttr = { name: column.expr.column, as: column.as };
        if (!tableMp[name]) {
          tableMp[name] = [columnAttr];
        } else {
          tableMp[name].push(columnAttr);
        }
        return tableMp;
      },
      {},
    );
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
