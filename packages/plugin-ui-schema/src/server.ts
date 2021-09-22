import path from 'path';
import { PluginOptions } from '@nocobase/server';
import { registerModels } from '@nocobase/database';
import * as models from './models';
import * as actions from './actions';

registerModels(models);

export default {
  name: 'ui-schema',
  async load() {
    const database = this.app.db;
  
    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  
    for (const [name, action] of Object.entries(actions)) {
      this.app.resourcer.registerActionHandler(`ui_schemas:${name}`, action);
    }
  }
} as PluginOptions;
