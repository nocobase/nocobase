import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import getCollection from './actions/getCollection';
import getView from './actions/getView';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  resourcer.registerHandler('getCollection', getCollection);
  resourcer.registerHandler('getView', getView);

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });
}
