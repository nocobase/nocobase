import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class PluginMultipleApps extends Plugin {
  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.db.on('applications.create', async (model) => {});
  }
}
