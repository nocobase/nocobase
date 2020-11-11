import path from 'path';
import Database, { ModelCtor } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

export default async function (this: any, options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });
}
