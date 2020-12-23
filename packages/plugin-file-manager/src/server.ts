import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

import {
  action as uploadAction,
  middleware as uploadMiddleware,
} from './actions/upload';
import {
  middleware as localMiddleware,
} from './storages/local';

export default async function () {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  // 暂时中间件只能通过 use 加进来
  resourcer.use(uploadMiddleware);
  resourcer.registerActionHandler('upload', uploadAction);
  localMiddleware(this);
}
