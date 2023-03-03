import { Model, Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { AppDbCreator, AppOptionsFactory } from '../server';

export interface registerAppOptions extends Transactionable {
  skipInstall?: boolean;
  dbCreator: AppDbCreator;
  appOptionsFactory: AppOptionsFactory;
}

export class ApplicationModel extends Model {
  static async handleAppStart(mainApp: Application, app: Application, options: registerAppOptions) {
    await mainApp.emitAsync('beforeSubAppLoad', {
      mainApp,
      subApp: app,
    });

    await app.load();

    if (!(await app.isInstalled())) {
      await app.db.sync();
      await app.install();

      // emit an event on mainApp
      // current if you add listener on subApp through `subApp.on('afterInstall')` , it will be clear after subApp installed
      await mainApp.emitAsync('afterSubAppInstalled', {
        mainApp,
        subApp: app,
      });
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
      name: appName,
    });

    const isInstalled = await (async () => {
      try {
        return await app.isInstalled();
      } catch (e) {
        if (e.message.includes('does not exist') || e.message.includes('Unknown database')) {
          return false;
        }
        throw e;
      }
    })();

    if (!isInstalled) {
      await options.dbCreator(app);
    }

    await AppModel.handleAppStart(mainApp, app, options);

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
