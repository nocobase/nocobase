import Database, { IDatabaseOptions, Model, Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import lodash from 'lodash';
import * as path from 'path';
import { AppDbCreator } from '../server';

export interface registerAppOptions extends Transactionable {
  skipInstall?: boolean;
  dbCreator: AppDbCreator;
}

export class ApplicationModel extends Model {
  static getDatabaseConfig(app: Application): IDatabaseOptions {
    const oldConfig =
      app.options.database instanceof Database
        ? (app.options.database as Database).options
        : (app.options.database as IDatabaseOptions);

    return lodash.cloneDeep(lodash.omit(oldConfig, ['migrator']));
  }

  static async handleAppStart(app: Application, options: registerAppOptions) {
    await app.load();

    if (!app.isInstalled()) {
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
      ...AppModel.initOptions(appName, mainApp),
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

  static initOptions(appName: string, mainApp: Application) {
    const rawDatabaseOptions = this.getDatabaseConfig(mainApp);

    if (rawDatabaseOptions.dialect === 'sqlite') {
      const mainAppStorage = rawDatabaseOptions.storage;
      if (mainAppStorage !== ':memory:') {
        const mainStorageDir = path.dirname(mainAppStorage);
        rawDatabaseOptions.storage = path.join(mainStorageDir, `${appName}.sqlite`);
      }
    } else {
      rawDatabaseOptions.database = appName;
    }

    return {
      database: {
        ...rawDatabaseOptions,
        tablePrefix: '',
      },
      plugins: ['nocobase'],
      resourcer: {
        prefix: '/api',
      },
    };
  }
}
