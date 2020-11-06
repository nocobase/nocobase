import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  const tables = database.import({
    directory: path.resolve(__dirname, 'tables'),
  });

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });

  await database.sync({
    tables,
  });
}
