import { Collection } from '../collection';
import sqlParser from '../sql-parser';
import QueryInterface, { TableInfo } from './query-interface';

export default class SqliteQueryInterface extends QueryInterface {
  constructor(db) {
    super(db);
  }

  async collectionTableExists(collection: Collection, options?) {
    const transaction = options?.transaction;

    const tableName = collection.model.tableName;

    const sql = `SELECT name
                 FROM sqlite_master
                 WHERE type = 'table'
                   AND name = '${tableName}';`;
    const results = await this.db.sequelize.query(sql, { type: 'SELECT', transaction });
    return results.length > 0;
  }

  async listViews() {
    const sql = `
      SELECT name, sql as definition
      FROM sqlite_master
      WHERE type = 'view'
      ORDER BY name;
    `;

    return await this.db.sequelize.query(sql, {
      type: 'SELECT',
    });
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
    const viewDefinition = await this.db.sequelize.query(
      `SELECT sql
       FROM sqlite_master
       WHERE name = '${viewName}' AND type = 'view'`,
      {
        type: 'SELECT',
      },
    );

    const createView = viewDefinition[0]['sql'];
    const regex = /(?<=AS\s)([\s\S]*)/i;
    const match = createView.match(regex);
    const sql = match[0];

    return sql;
  }

  showTableDefinition(tableInfo: TableInfo): Promise<any> {
    return Promise.resolve(undefined);
  }
}
