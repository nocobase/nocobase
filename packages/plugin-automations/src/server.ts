import Database, { registerFields } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import path from 'path';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });
}
