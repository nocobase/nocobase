import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { ApplicationModel } from './models/application';
import { AppManager } from '@nocobase/server';

export class PluginMultipleApps extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

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
      await this.app.appManager.removeApplication(model.get('name') as string);
    });

    this.app.on('beforeStart', async () => {
      const applications = (await this.app.db.getRepository('applications').find()) as ApplicationModel[];

      for (const app of applications) {
        await app.registerToMainApp(this.app, {
          skipInstall: true,
        });
      }
    });

    this.app.appManager.on(
      'beforeGetApplication',
      async function lazyLoadApplication({ appManager, name }: { appManager: AppManager; name: string }) {
        if (!appManager.applications.has(name)) {
          const existsApplication = (await this.app.db.getRepository('applications').findOne({
            filter: {
              name,
            },
          })) as ApplicationModel | null;

          if (existsApplication) {
            await existsApplication.registerToMainApp(this.app, { skipInstall: true });
          }
        }
      },
    );
  }
}
