import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { ApplicationModel } from './models/application';

export class PluginMultipleApps extends Plugin {
  async load() {
    await this.db.registerModels({
      ApplicationModel,
    });
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.db.on('applications.afterCreate', async (model) => {
      console.log(model);
    });
  }
}
