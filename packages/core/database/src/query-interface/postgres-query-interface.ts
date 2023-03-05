import QueryInterface from './query-interface';
import { Collection } from '@nocobase/database';

export default class PostgresQueryInterface extends QueryInterface {
  constructor(db) {
    super(db);
  }

  async collectionTableExists(collection: Collection, options?) {
    const transaction = options?.transaction;

    const tableName = collection.model.tableName;
    const schema = collection.collectionSchema() || 'public';

    const sql = `SELECT FROM information_schema.tables
                 WHERE  table_schema = '${schema}'
                 AND    table_name   = '${tableName}'`;

    const results = await this.db.sequelize.query(sql, { type: 'SELECT', transaction });
    console.log({ results });
    return results.length > 0;
  }
}
