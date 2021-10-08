import path from 'path';
import Database, { registerModels } from '@nocobase/database';
import { PluginOptions } from '@nocobase/server';
import * as models from './models';

registerModels(models);

export default {
  name: 'notifications',
  async load() {
    this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
} as PluginOptions
