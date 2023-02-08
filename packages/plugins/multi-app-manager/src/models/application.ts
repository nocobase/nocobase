import { Model, Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { AppDbCreator, AppOptionsFactory } from '../server';

export interface registerAppOptions extends Transactionable {
  skipInstall?: boolean;
  dbCreator: AppDbCreator;
  appOptionsFactory: AppOptionsFactory;
}

export class ApplicationModel extends Model {
  static async handleAppStart(app: Application, options: registerAppOptions) {
    await app.load();

    if (!(await app.isInstalled())) {
      await app.db.sync({
        force: false,
        alter: {
          drop: false,
        },
      });

      await app.install();
    }

    await app.start();
  }

  async registerToMainApp(mainApp: Application, options: registerAppOptions) {
    const appName = this.get('name') as string;
    const appOptions = (this.get('options') as any) || {};

    const AppModel = this.constructor as typeof ApplicationModel;

    const app = mainApp.appManager.createApplication(appName, {
      ...options.appOptionsFactory(appName, mainApp),
      ...appOptions,
    });

    const isInstalled = await (async () => {
      try {
        return await app.isInstalled();
      } catch (e) {
        if (e.message.includes('does not exist')) {
          return false;
        }
        throw e;
      }
    })();

    if (!isInstalled) {
      await options.dbCreator(app);
    }

    await AppModel.handleAppStart(app, options);

    await AppModel.update(
      {
        status: 'running',
      },
      {
        transaction: options.transaction,
        where: {
          [AppModel.primaryKeyAttribute]: this.get(AppModel.primaryKeyAttribute),
        },
        hooks: false,
      },
    );
  }
}
