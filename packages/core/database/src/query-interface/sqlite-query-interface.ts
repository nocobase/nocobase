import QueryInterface from './query-interface';
import { Collection } from '../collection';

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
      SELECT name as viewname, sql as definition
      FROM sqlite_master
      WHERE type = 'view'
      ORDER BY name;
    `;

    return await this.db.sequelize.query(sql, {
      type: 'SELECT',
    });
  }

  viewColumnUsage(options: { viewName: string; schema?: string }) {
    throw new Error('Method not implemented.');
  }
}
