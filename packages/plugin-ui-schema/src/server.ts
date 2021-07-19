import path from 'path';
import { Application } from '@nocobase/server';
import { registerModels, Table } from '@nocobase/database';
import * as models from './models';
import { create, update, getTree } from './actions';

export default async function (this: Application, options = {}) {
  const database = this.database;
  registerModels(models);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  this.resourcer.registerActionHandler('ui_schemas:create', create);
  this.resourcer.registerActionHandler('ui_schemas:update', update);
  this.resourcer.registerActionHandler('ui_schemas:getTree', getTree);
}
