import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { ApplicationModel } from './models/application';

export class PluginMultipleApps extends Plugin {
  async load() {
    this.db.registerModels({
      ApplicationModel,
    });

    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.db.on('applications.afterCreateWithAssociations', async (model: ApplicationModel, options) => {
      const { transaction } = options;
      await model.registerToMainApp(this.app, { transaction });
    });

    this.db.on('applications.afterDestroy', async (model: ApplicationModel) => {
      this.app.multiAppManager.removeApplication(model.get('name') as string);
    });
  }

  getName(): string {
    return '@nocobase/multiple-apps';
  }
}
