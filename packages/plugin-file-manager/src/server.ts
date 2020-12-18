import path from 'path';
import Database, { registerFields } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

import * as fields from './fields';
import { IStorage } from './storages';

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

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });
}
