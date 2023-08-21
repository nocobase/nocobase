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

  private static parseTablesAndColumns(): {
    table: string;
    columns: string | { name: string; as: string }[];
  }[] {
    let { ast } = sqlParser.parse(this.sql);
    if (Array.isArray(ast)) {
      ast = ast[0];
    }
    if (ast.with) {
      const tables = new Set<string>();
      // parse sql includes with clause is not accurate
      // the parsed columns seems to be always '*'
      // it is supposed to be improved in the future
      ast.with.forEach((withItem: { tableList: string[] }) => {
        const tableList = withItem.tableList;
        tableList.forEach((table) => {
          const name = table.split('::')[2]; // "select::null::users"
          tables.add(name);
        });
      });
      return Array.from(tables).map((table) => ({ table, columns: '*' }));
    }
    if (ast.columns === '*') {
      return ast.from.map((fromItem: { table: string; as: string }) => ({
        table: fromItem.table,
        columns: '*',
      }));
    }
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
        const columnAttr = { name: column.expr.column, as: column.as };
        if (!tableMp[table]) {
          tableMp[table] = [columnAttr];
        } else {
          tableMp[table].push(columnAttr);
        }
        return tableMp;
      },
      {},
    );
    ast.from.forEach((fromItem: { table: string; as: string }) => {
      if (columns[fromItem.as]) {
        columns[fromItem.table] = columns[fromItem.as];
        columns[fromItem.as] = undefined;
      }
    });
    return Object.entries(columns)
      .filter(([_, columns]) => columns)
      .map(([table, columns]) => ({ table, columns }));
  }

  private static getTableNameWithSchema(table: string) {
    if (this.database.inDialect('postgres') && !table.includes('.')) {
      return `public.${table}`;
    }
    return table;
  }

  static inferFields(): {
    [field: string]: {
      type: string;
      source: string;
      collection: string;
      interface: string;
    };
  } {
    const tables = this.parseTablesAndColumns();
    const fields = tables.reduce((fields, { table, columns }) => {
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
    return fields;
  }
}
