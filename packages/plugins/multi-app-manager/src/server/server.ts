import Database, { IDatabaseOptions, Transactionable } from '@nocobase/database';
import Application, { AppManager, Plugin } from '@nocobase/server';
import lodash from 'lodash';
import * as path from 'path';
import { resolve } from 'path';
import { ApplicationModel } from './models/application';
import { Mutex } from 'async-mutex';

export type AppDbCreator = (app: Application, transaction?: Transactionable) => Promise<void>;
export type AppOptionsFactory = (appName: string, mainApp: Application) => any;

const defaultDbCreator = async (app: Application) => {
  const databaseOptions = app.options.database as any;
  const { host, port, username, password, dialect, database } = databaseOptions;

  if (dialect === 'mysql') {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({ host, port, user: username, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.close();
  }

  if (dialect === 'postgres') {
    const { Client } = require('pg');

    const client = new Client({
      host,
      port,
      user: username,
      password,
      database: 'postgres',
    });

    await client.connect();

    try {
      await client.query(`CREATE DATABASE "${database}"`);
    } catch (e) {}

    await client.end();
  }
};

const defaultAppOptionsFactory = (appName: string, mainApp: Application) => {
  const rawDatabaseOptions = PluginMultiAppManager.getDatabaseConfig(mainApp);

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
};

export class PluginMultiAppManager extends Plugin {
  appDbCreator: AppDbCreator = defaultDbCreator;
  appOptionsFactory: AppOptionsFactory = defaultAppOptionsFactory;

  private beforeGetApplicationMutex = new Mutex();

  setAppOptionsFactory(factory: AppOptionsFactory) {
    this.appOptionsFactory = factory;
  }

  setAppDbCreator(appDbCreator: AppDbCreator) {
    this.appDbCreator = appDbCreator;
  }

  static getDatabaseConfig(app: Application): IDatabaseOptions {
    const oldConfig =
      app.options.database instanceof Database
        ? (app.options.database as Database).options
        : (app.options.database as IDatabaseOptions);

    return lodash.cloneDeep(lodash.omit(oldConfig, ['migrator']));
  }

  beforeLoad() {
    this.db.registerModels({
      ApplicationModel,
    });
  }

  async load() {
    this.app.appManager.setAppSelector(async (req) => {
      if (req.headers['x-app']) {
        return req.headers['x-app'];
      }
      if (req.headers['x-hostname']) {
        const repository = this.db.getRepository('applications');
        if (!repository) {
          return null;
        }
        const appInstance = await repository.findOne({
          filter: {
            cname: req.headers['x-hostname'],
          },
        });
        if (appInstance) {
          return appInstance.name;
        }
      }
      return null;
    });

    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    // after application created
    this.db.on('applications.afterCreateWithAssociations', async (model: ApplicationModel, options) => {
      const { transaction } = options;

      const subApp = model.registerToMainApp(this.app, {
        appOptionsFactory: this.appOptionsFactory,
      });

      // create database
      await this.appDbCreator(subApp, transaction);

      // reload subApp plugin
      await subApp.reload();

      // sync subApp collections
      await subApp.db.sync();

      // install subApp
      await subApp.install();

      await subApp.reload();
    });

    this.db.on('applications.afterDestroy', async (model: ApplicationModel) => {
      await this.app.appManager.removeApplication(model.get('name') as string);
    });

    // lazy load application
    // if application not in appManager, load it from database
    this.app.on(
      'beforeGetApplication',
      async ({ appManager, name, options }: { appManager: AppManager; name: string; options: any }) => {
        await this.beforeGetApplicationMutex.runExclusive(async () => {
          if (appManager.applications.has(name)) {
            return;
          }

          const applicationRecord = (await this.app.db.getRepository('applications').findOne({
            filter: {
              name,
            },
          })) as ApplicationModel | null;

          const instanceOptions = applicationRecord.get('options');

          // skip standalone deployment application
          if (instanceOptions?.standaloneDeployment && appManager.runningMode !== 'single') {
            return;
          }

          if (!applicationRecord) {
            return;
          }

          const subApp = await applicationRecord.registerToMainApp(this.app, {
            appOptionsFactory: this.appOptionsFactory,
          });

          // must skip load on upgrade
          if (!options?.upgrading) {
            await subApp.load();
          }
        });
      },
    );

    this.app.on('afterStart', async (app) => {
      const repository = this.db.getRepository('applications');
      const appManager = this.app.appManager;
      if (appManager.runningMode == 'single') {
        // If the sub application is running in single mode, register the application automatically
        try {
          const subApp = await repository.findOne({
            filter: {
              name: appManager.singleAppName,
            },
          });
          const registeredApp = await subApp.registerToMainApp(this.app, {
            appOptionsFactory: this.appOptionsFactory,
          });
          await registeredApp.load();
        } catch (err) {
          console.error('Auto register sub application in single mode failed: ', appManager.singleAppName, err);
        }
        return;
      }
      try {
        const subApps = await repository.find({
          filter: {
            'options.autoStart': true,
          },
        });
        for (const subApp of subApps) {
          const registeredApp = await subApp.registerToMainApp(this.app, {
            appOptionsFactory: this.appOptionsFactory,
          });
          await registeredApp.load();
        }
      } catch (err) {
        console.error('Auto register sub applications failed: ', err);
      }
    });

    this.app.on('afterUpgrade', async (app, options) => {
      const cliArgs = options?.cliArgs;

      const repository = this.db.getRepository('applications');
      const findOptions = {};

      const appManager = this.app.appManager;

      if (appManager.runningMode == 'single') {
        findOptions['filter'] = {
          name: appManager.singleAppName,
        };
      }

      const instances = await repository.find(findOptions);

      for (const instance of instances) {
        const instanceOptions = instance.get('options');

        // skip standalone deployment application
        if (instanceOptions?.standaloneDeployment && appManager.runningMode !== 'single') {
          continue;
        }

        const subApp = await appManager.getApplication(instance.name, {
          upgrading: true,
        });

        try {
          console.log(`${instance.name}: upgrading...`);

          await subApp.upgrade({
            cliArgs,
          });

          await subApp.stop({
            cliArgs,
          });
        } catch (error) {
          console.log(`${instance.name}: upgrade failed`);
          this.app.logger.error(error);
          console.error(error);
        }
      }
    });

    this.app.resourcer.registerActionHandlers({
      'applications:listPinned': async (ctx, next) => {
        const items = await this.db.getRepository('applications').find({
          filter: {
            pinned: true,
          },
        });
        ctx.body = items;
      },
    });

    this.app.acl.allow('applications', 'listPinned', 'loggedIn');

    this.app.acl.registerSnippet({
      name: `
        pm.$;
        {
          this.name;
        }
      .
        applications`,
      actions: ['applications:*'],
    });
  }
}
