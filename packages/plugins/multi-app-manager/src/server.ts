import Application, { AppManager, InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { ApplicationModel } from './models/application';

export type AppDbCreator = (app: Application) => Promise<void>;
export class PluginMultiAppManager extends Plugin {
  appDbCreator: AppDbCreator;

  registerAppDbCreator(appDbCreator: AppDbCreator) {
    this.appDbCreator = appDbCreator;
  }

  async install(options?: InstallOptions) {
    const repo = this.db.getRepository<any>('collections');
    if (repo) {
      await repo.db2cm('applications');
    }
  }

  beforeLoad(): void {
    this.app.appManager.setAppSelector((req) => {
      return (req.headers['x-app'] || null) as any;
    });
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

      await model.registerToMainApp(this.app, { transaction, dbCreator: this.appDbCreator });
    });

    this.db.on('applications.afterDestroy', async (model: ApplicationModel) => {
      await this.app.appManager.removeApplication(model.get('name') as string);
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
            await existsApplication.registerToMainApp(this.app, {
              skipInstall: true,
            });
          }
        }
      },
    );

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.applications`,
      actions: ['applications:*'],
    });
  }
}
