import path from 'path';
import Database, { registerFields } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

import * as fields from './fields';
import { IStorage } from './storages';
import {
  action as uploadAction,
  middleware as uploadMiddleware,
} from './actions/upload';

export interface FileManagerOptions {
  storages: IStorage[]
}

export default async function (options: FileManagerOptions) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  registerFields(fields);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  // 暂时中间件只能通过 use 加进来
  resourcer.use(uploadMiddleware);
  resourcer.registerActionHandler('upload', uploadAction);
}
