import path from 'path';
import { Application } from '@nocobase/server';
import { registerModels, Table } from '@nocobase/database';
import * as models from './models';
import { createOrUpdate } from './actions';

export default async function (this: Application, options = {}) {
  const database = this.database;
  registerModels(models);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  database.getModel('fields').beforeCreate((model) => {
    if (!model.get('name')) {
      model.set('name', model.get('key'));
    }
  });

  this.resourcer.registerActionHandler('collections:createOrUpdate', createOrUpdate);
}
