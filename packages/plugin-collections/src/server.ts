import path from 'path';
import Database, { ModelCtor } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import CollectionModel from './models/collection';
import getCollection from './actions/getCollection';
import getView from './actions/getView';

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

  resourcer.registerHandler('getCollection', getCollection);
  resourcer.registerHandler('getView', getView);

  // console.log(resourcer.getRegisteredHandlers());

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });

  uiResourcer.import({
    directory: path.resolve(__dirname, 'ui.resources'),
  });
}
