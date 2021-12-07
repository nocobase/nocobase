import path from 'path';
import { PluginOptions } from '@nocobase/server';

export default {
  name: 'notifications',
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
} as PluginOptions
