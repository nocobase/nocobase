import QueryInterface from './query-interface';
import { Collection } from '../collection';

export default class PostgresQueryInterface extends QueryInterface {
  constructor(db) {
    super(db);
  }

  async collectionTableExists(collection: Collection, options?) {
    const transaction = options?.transaction;

    const tableName = collection.model.tableName;
    const schema = collection.collectionSchema() || 'public';

    const sql = `SELECT EXISTS(SELECT 1
                               FROM information_schema.tables
                               WHERE table_schema = '${schema}'
                                 AND table_name = '${tableName}')`;

    const results = await this.db.sequelize.query(sql, { type: 'SELECT', transaction });
    return results[0]['exists'];
  }

  async listViews() {
    const sql = `
      SELECT viewname as name, definition, schemaname as schema
      FROM pg_views
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY viewname;
    `;

    return await this.db.sequelize.query(sql, { type: 'SELECT' });
  }

  async viewColumnUsage(options) {
    const { viewName, schema = 'public' } = options;
    const sql = `
      SELECT *
      FROM information_schema.view_column_usage
      WHERE view_schema = '${schema}'
        AND view_name = '${viewName}';
    `;

    return (await this.db.sequelize.query(sql, { type: 'SELECT' })) as any;
  }
}
