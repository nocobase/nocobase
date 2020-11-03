import path from 'path';
import Database, { ModelCtor } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import CollectionModel from './models/collection';

export default async function (this: any, options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;
  const uiResourcer: Resourcer = this.uiResourcer;

  const tables = database.import({
    directory: path.resolve(__dirname, 'tables'),
  });

  await database.sync({
    tables,
  });

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });

  uiResourcer.import({
    directory: path.resolve(__dirname, 'ui.resources'),
  });
}
