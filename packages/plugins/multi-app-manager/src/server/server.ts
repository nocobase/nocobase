import { Database, IDatabaseOptions, Transactionable } from '@nocobase/database';
import Application, { AppSupervisor, Gateway, Plugin } from '@nocobase/server';
import lodash from 'lodash';
import { Mutex } from 'async-mutex';
import path, { resolve } from 'path';
import { ApplicationModel } from '../server';

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
    } catch (e) {
      console.log(e);
    }

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

  static getDatabaseConfig(app: Application): IDatabaseOptions {
    const oldConfig =
      app.options.database instanceof Database
        ? (app.options.database as Database).options
        : (app.options.database as IDatabaseOptions);

    return lodash.cloneDeep(lodash.omit(oldConfig, ['migrator']));
  }

  setAppOptionsFactory(factory: AppOptionsFactory) {
    this.appOptionsFactory = factory;
  }

  setAppDbCreator(appDbCreator: AppDbCreator) {
    this.appDbCreator = appDbCreator;
  }

  beforeLoad() {
    this.db.registerModels({
      ApplicationModel,
    });
  }

  async load() {
    Gateway.getInstance().setAppSelector(async (req) => {
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

      const subApp = model.registerToSupervisor(this.app, {
        appOptionsFactory: this.appOptionsFactory,
      });

      // create database
      await this.appDbCreator(subApp, transaction);
      await subApp.reload();
      await subApp.db.sync();
      await subApp.install();
      await subApp.reload();

      await subApp.start();
    });

    this.db.on('applications.afterDestroy', async (model: ApplicationModel) => {
      await AppSupervisor.getInstance().removeApp(model.get('name') as string);
    });

    const self = this;

    async function LazyLoadApplication({
      appSupervisor,
      appName,
      options,
    }: {
      appSupervisor: AppSupervisor;
      appName: string;
      options: any;
    }) {
      const name = appName;
      await self.beforeGetApplicationMutex.runExclusive(async () => {
        if (appSupervisor.hasApp(name)) {
          return;
        }

        const applicationRecord = (await self.app.db.getRepository('applications').findOne({
          filter: {
            name,
          },
        })) as ApplicationModel | null;

        if (!applicationRecord) {
          return;
        }

        const instanceOptions = applicationRecord.get('options');

        // skip standalone deployment application
        if (instanceOptions?.standaloneDeployment && appSupervisor.runningMode !== 'single') {
          return;
        }

        if (!applicationRecord) {
          return;
        }

        const subApp = applicationRecord.registerToSupervisor(self.app, {
          appOptionsFactory: self.appOptionsFactory,
        });

        // must skip load on upgrade
        if (!options?.upgrading) {
          await subApp.load();

          // start sub app
          await subApp.start();
        }
      });
    }

    AppSupervisor.getInstance().setAppBootstrapper(LazyLoadApplication);

    this.app.on('afterStart', async (app) => {
      const repository = this.db.getRepository('applications');
      const appSupervisor = AppSupervisor.getInstance();

      if (appSupervisor.runningMode == 'single') {
        // If the sub application is running in single mode, register the application automatically
        try {
          const subApp = await repository.findOne({
            filter: {
              name: appSupervisor.singleAppName,
            },
          });
          const registeredApp = await subApp.registerToSupervisor(this.app, {
            appOptionsFactory: this.appOptionsFactory,
          });
          await registeredApp.load();
        } catch (err) {
          console.error('Auto register sub application in single mode failed: ', appSupervisor.singleAppName, err);
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
          const registeredApp = await subApp.registerToSupervisor(this.app, {
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

      const appSupervisor = AppSupervisor.getInstance();

      if (appSupervisor.runningMode == 'single') {
        findOptions['filter'] = {
          name: appSupervisor.singleAppName,
        };
      }

      const instances = await repository.find(findOptions);

      for (const instance of instances) {
        const instanceOptions = instance.get('options');

        // skip standalone deployment application
        if (instanceOptions?.standaloneDeployment && appSupervisor.runningMode !== 'single') {
          continue;
        }

        const subApp = await appSupervisor.getApp(instance.name, {
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

    this.app.resourcer.use(async (ctx, next) => {
      await next();
      const { actionName, resourceName, params } = ctx.action;
      if (actionName === 'list' && resourceName === 'applications') {
        const applications = ctx.body.rows;
        for (const application of applications) {
          const app = await AppSupervisor.getInstance().getApp(application.name, {
            withOutBootStrap: true,
          });
          if (app) {
            application.status = 'running';
          } else {
            application.status = 'stopped';
          }
        }
      }
    });
  }
}
