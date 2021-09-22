import path from 'path';
import { PluginOptions } from '@nocobase/server';

export default {
  name: 'permissions',
  async load() {
    const database = this.app.db;
    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
} as PluginOptions;
