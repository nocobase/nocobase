import QueryInterface from './query-interface';
import { Collection } from '../collection';
import { Parser } from 'node-sql-parser';

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
      SELECT name , sql as definition
      FROM sqlite_master
      WHERE type = 'view'
      ORDER BY name;
    `;

    return await this.db.sequelize.query(sql, {
      type: 'SELECT',
    });
  }

  async viewColumnUsage(options: { viewName: string; schema?: string }): Promise<
    Array<{
      column_name: string;
      table_name: string;
      table_schema?: string;
    }>
  > {
    try {
      const viewDefinition = await this.db.sequelize.query(
        `SELECT sql FROM sqlite_master WHERE name = '${options.viewName}' AND type = 'view'`,
        {
          type: 'SELECT',
        },
      );

      const createView = viewDefinition[0]['sql'];
      const regex = /(?<=AS\s)([\s\S]*)/i;
      const match = createView.match(regex);
      const sql = match[0];

      const { Parser } = require('node-sql-parser');
      const parser = new Parser();
      const ast = parser.astify(sql);

      const columns = ast.columns;

      const results = [];
      for (const column of columns) {
        if (column.expr.type === 'column_ref') {
          results.push({
            column_name: column.expr.column,
            table_name: column.expr.table,
          });
        }
      }

      return results;
    } catch (e) {
      this.db.logger.warn(e);
      return [];
    }
  }
}
