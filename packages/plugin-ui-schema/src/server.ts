import path from 'path';
import { Application } from '@nocobase/server';
import { registerModels } from '@nocobase/database';
import * as models from './models';
import * as actions from './actions';

export default async function (this: Application, options = {}) {
  const database = this.database;
  registerModels(models);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  for (const [name, action] of Object.entries(actions)) {
    this.resourcer.registerActionHandler(`ui_schemas:${name}`, action);
  }
}
