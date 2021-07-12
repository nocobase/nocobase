import path from 'path';
import { Application } from '@nocobase/server';
import { registerModels } from '@nocobase/database';
import * as models from './models';
import getAccessible from './actions/getAccessible';

export default async function (this: Application, options = {}) {
  const database = this.database;
  registerModels(models);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  this.resourcer.registerActionHandler('routes:getAccessible', getAccessible);
}
