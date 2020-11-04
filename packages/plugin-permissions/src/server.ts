import path from 'path';
import Database from '@nocobase/database';

export default async function (options = {}) {
  const database: Database = this.database;

  const tables = database.import({
    directory: path.resolve(__dirname, 'tables'),
  });

  await database.sync({
    tables,
  });
}
