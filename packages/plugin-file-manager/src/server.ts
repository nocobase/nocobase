import path from 'path';
import Database, { registerFields } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

import * as fields from './fields';
import {
  action as uploadAction,
  middleware as uploadMiddleware,
} from './actions';
import { FILE_FIELD_NAME } from './constants';

export interface FileManagerOptions {
  fieldName: string;
}

export default async function ({ fieldName = FILE_FIELD_NAME, ...opts }: FileManagerOptions) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  registerFields(fields);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  const options = Object.assign(opts, {
    fieldName
  });

  // 暂时中间件只能通过 use 加进来
  resourcer.use(uploadMiddleware(options));
  resourcer.registerActionHandler('upload', uploadAction(options));
}
