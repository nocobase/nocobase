import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });
}
