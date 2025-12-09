/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, IDatabaseOptions, Transactionable } from '@nocobase/database';
import Application, { AppStatus, AppSupervisor, Gateway, Plugin } from '@nocobase/server';
import lodash from 'lodash';
import path from 'path';
import { ApplicationModel } from '../server';
import { Meter } from '@nocobase/telemetry';

export type AppDbCreator = (
  app: Application,
  options?: Transactionable & { context?: any; applicationModel?: ApplicationModel },
) => Promise<void>;
export type AppOptionsFactory = (appName: string, mainApp: Application) => any;
export type SubAppUpgradeHandler = (mainApp: Application) => Promise<void>;

const defaultSubAppUpgradeHandle: SubAppUpgradeHandler = async (mainApp: Application) => {
  const repository = mainApp.db.getRepository('applications');
  const findOptions = {};

  const appSupervisor = AppSupervisor.getInstance();

  if (appSupervisor.runningMode == 'single') {
    findOptions['filter'] = {
      name: appSupervisor.singleAppName,
    };
  } else {
    findOptions['filter'] = {
      'options.autoStart': true,
    };
  }

  const instances = await repository.find(findOptions);

  for (const instance of instances) {
    const instanceOptions = instance.get('options');

    // skip standalone deployment application
    if (instanceOptions?.standaloneDeployment && appSupervisor.runningMode !== 'single') {
      continue;
    }

    const beforeSubAppStatus = AppSupervisor.getInstance().getAppStatus(instance.name);

    const subApp = await appSupervisor.getApp(instance.name, {
      upgrading: true,
    });

    try {
      mainApp.setMaintainingMessage(`upgrading sub app ${instance.name}...`);
      await subApp.runAsCLI(['upgrade'], { from: 'user' });
      if (!beforeSubAppStatus && AppSupervisor.getInstance().getAppStatus(instance.name) === 'initialized') {
        await AppSupervisor.getInstance().removeApp(instance.name);
      }
    } catch (error) {
      console.log(`${instance.name}: upgrade failed`);
      mainApp.logger.error(error);
      console.error(error);
    }
  }
};

const defaultDbCreator = async (app: Application) => {
  const databaseOptions = app.options.database as any;
  const { host, port, username, password, dialect, database, schema } = databaseOptions;

  if (dialect === 'mysql') {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({ host, port, user: username, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.close();
  }

  if (dialect === 'mariadb') {
    const mariadb = require('mariadb');
    const connection = await mariadb.createConnection({ host, port, user: username, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();
  }

  if (['postgres', 'kingbase'].includes(dialect)) {
    const { Client } = require('pg');

    const client = new Client({
      host,
      port,
      user: username,
      password,
      database: dialect,
    });

    await client.connect();

    try {
      if (process.env.USE_DB_SCHEMA_IN_SUBAPP === 'true') {
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      } else {
        await client.query(`CREATE DATABASE "${database}"`);
      }
    } catch (e) {
      console.log(e);
    }

    await client.end();
  }
};

const defaultAppOptionsFactory = (appName: string, mainApp: Application) => {
  const rawDatabaseOptions = PluginMultiAppManagerServer.getDatabaseConfig(mainApp);

  if (rawDatabaseOptions.dialect === 'sqlite') {
    const mainAppStorage = rawDatabaseOptions.storage;
    if (mainAppStorage !== ':memory:') {
      const mainStorageDir = path.dirname(mainAppStorage);
      rawDatabaseOptions.storage = path.join(mainStorageDir, `${appName}.sqlite`);
    }
  } else if (
    process.env.USE_DB_SCHEMA_IN_SUBAPP === 'true' &&
    ['postgres', 'kingbase'].includes(rawDatabaseOptions.dialect)
  ) {
    rawDatabaseOptions.schema = appName;
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
      prefix: process.env.API_BASE_PATH,
    },
    cacheManager: {
      ...mainApp.options.cacheManager,
      prefix: appName,
    },
    logger: mainApp.options.logger,
  };
};

export class PluginMultiAppManagerServer extends Plugin {
  appDbCreator: AppDbCreator = defaultDbCreator;
  appOptionsFactory: AppOptionsFactory = defaultAppOptionsFactory;
  subAppUpgradeHandler: SubAppUpgradeHandler = defaultSubAppUpgradeHandle;
  meter: Meter;

  static getDatabaseConfig(app: Application): IDatabaseOptions {
    let oldConfig =
      app.options.database instanceof Database
        ? (app.options.database as Database).options
        : (app.options.database as IDatabaseOptions);

    if (!oldConfig && app.db) {
      oldConfig = app.db.options;
    }

    return lodash.cloneDeep(lodash.omit(oldConfig, ['migrator']));
  }

  async handleSyncMessage(message) {
    const { type } = message;

    if (type === 'subAppStarted') {
      const { appName } = message;
      const model = await this.app.db.getRepository('applications').findOne({
        filter: {
          name: appName,
        },
      });

      if (!model) {
        return;
      }

      if (AppSupervisor.getInstance().hasApp(appName)) {
        return;
      }

      const subApp = model.registerToSupervisor(this.app, {
        appOptionsFactory: this.appOptionsFactory,
      });

      subApp.runCommand('start', '--quickstart');
    }

    if (type === 'subAppStopped') {
      const { appName } = message;
      await AppSupervisor.getInstance().stopApp(appName);
    }

    if (type === 'removeApp') {
      const { appName } = message;
      await AppSupervisor.getInstance().removeApp(appName);
    }
  }

  setSubAppUpgradeHandler(handler: SubAppUpgradeHandler) {
    this.subAppUpgradeHandler = handler;
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

  async beforeEnable() {
    if (this.app.name !== 'main') {
      throw new Error('@nocobase/plugin-multi-app-manager can only be enabled in the main app');
    }
  }

  setMetrics() {
    this.meter = this.app.telemetry.metric.getMeter();
    if (!this.meter) {
      return;
    }
    const subAppStatusGauge = this.meter.createObservableGauge('sub_app_status', {
      description: 'Number of sub applications by cached status in supervisor.appStatus',
    });
    this.meter.addBatchObservableCallback(
      (observableResult) => {
        const supervisor = AppSupervisor.getInstance();
        const allStatuses = { ...supervisor.appStatus };

        const createCounts = (): Record<AppStatus, number> => ({
          preparing: 0,
          initializing: 0,
          initialized: 0,
          running: 0,
          commanding: 0,
          stopped: 0,
          error: 0,
          not_found: 0,
        });

        const cachedCounts = createCounts();
        for (let status of Object.values(allStatuses)) {
          if (!status) {
            status = 'stopped';
          }
          if (cachedCounts[status as AppStatus] !== undefined) cachedCounts[status as AppStatus]++;
        }

        for (const [status, count] of Object.entries(cachedCounts)) {
          observableResult.observe(subAppStatusGauge, count, { status });
        }
      },
      [subAppStatusGauge],
    );
  }

  async load() {
    this.setMetrics();

    // after application created
    this.db.on(
      'applications.afterCreateWithAssociations',
      async (model: ApplicationModel, options: Transactionable & { context?: any }) => {
        const { transaction } = options;

        const name = model.get('name') as string;

        if (name === 'main') {
          throw new Error('Application name "main" is reserved');
        }

        const subApp = model.registerToSupervisor(this.app, {
          appOptionsFactory: this.appOptionsFactory,
        });

        subApp.on('afterStart', async () => {
          this.sendSyncMessage({
            type: 'subAppStarted',
            appName: name,
          });
        });

        subApp.on('afterStop', async () => {
          this.sendSyncMessage({
            type: 'subAppStopped',
            appName: name,
          });
        });

        const quickstart = async () => {
          // create database
          try {
            await this.appDbCreator(subApp, {
              transaction,
              applicationModel: model,
              context: options.context,
            });
          } catch (error) {
            this.log.error(error, { method: 'appDbCreator' });
            AppSupervisor.getInstance().setAppStatus(subApp.name, 'error');
            return;
          }

          await AppSupervisor.getInstance().getApp(subApp.name);
        };

        if (options?.context?.waitSubAppInstall) {
          await quickstart();
          await subApp.runCommand('start', '--quickstart');
        } else {
          quickstart().catch((err) => {
            this.log.error(err);
          });
        }
      },
    );

    this.db.on('applications.afterDestroy', async (model: ApplicationModel, options) => {
      await AppSupervisor.getInstance().removeApp(model.get('name') as string);

      this.sendSyncMessage(
        {
          type: 'removeApp',
          appName: model.get('name'),
        },
        {
          transaction: options.transaction,
        },
      );
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
      const loadButNotStart = options?.upgrading;

      const name = appName;
      if (appSupervisor.hasApp(name)) {
        return;
      }

      const mainApp = await appSupervisor.getApp('main');
      if (!mainApp) {
        return;
      }
      const applicationRecord = (await mainApp.db.getRepository('applications').findOne({
        filter: {
          name,
        },
      })) as ApplicationModel | null;

      if (!applicationRecord) {
        return;
      }

      const instanceOptions = applicationRecord.get('options');

      if (instanceOptions?.standaloneDeployment && appSupervisor.runningMode !== 'single') {
        return;
      }

      const subApp = applicationRecord.registerToSupervisor(mainApp, {
        appOptionsFactory: self.appOptionsFactory,
      });

      subApp.on('afterStart', async () => {
        this.sendSyncMessage({
          type: 'subAppStarted',
          appName: name,
        });
      });

      subApp.on('afterStop', async () => {
        this.sendSyncMessage({
          type: 'subAppStopped',
          appName: name,
        });
      });

      // must skip load on upgrade
      if (!loadButNotStart) {
        await subApp.runCommand('start', '--quickstart');
      }
    }

    AppSupervisor.getInstance().setAppBootstrapper(LazyLoadApplication.bind(this));

    Gateway.getInstance().addAppSelectorMiddleware(async (ctx, next) => {
      const { req } = ctx;

      if (!ctx.resolvedAppName && req.headers['x-hostname']) {
        const repository = this.db.getRepository('applications');
        if (!repository) {
          await next();
          return;
        }

        const appInstance = await repository.findOne({
          filter: {
            cname: req.headers['x-hostname'],
          },
        });

        if (appInstance) {
          ctx.resolvedAppName = appInstance.name;
        }
      }

      await next();
    });

    this.app.on('afterStart', async (app) => {
      const repository = this.db.getRepository('applications');
      const appSupervisor = AppSupervisor.getInstance();

      this.app.setMaintainingMessage('starting sub applications...');

      if (appSupervisor.runningMode == 'single') {
        Gateway.getInstance().addAppSelectorMiddleware((ctx) => (ctx.resolvedAppName = appSupervisor.singleAppName));

        // If the sub application is running in single mode, register the application automatically
        try {
          await AppSupervisor.getInstance().getApp(appSupervisor.singleAppName);
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

        for (const subAppInstance of subApps) {
          AppSupervisor.getInstance().getApp(subAppInstance.name);
        }
      } catch (err) {
        this.log.error('Auto register sub applications failed: ', err);
      }
    });

    this.app.on('afterUpgrade', async (app, options) => {
      await this.subAppUpgradeHandler(app);
    });

    this.app.resourcer.registerActionHandlers({
      'applications:listPinned': async (ctx, next) => {
        const items = await this.db.getRepository('applications').find({
          filter: {
            pinned: true,
          },
        });
        ctx.body = items;
        await next();
      },
    });

    this.app.resourcer.registerActionHandlers({
      'applications:stop': async (ctx, next) => {
        const { filterByTk } = ctx.action.params;
        AppSupervisor.getInstance().stopApp(filterByTk);
        ctx.body = 'ok';
        await next();
      },
    });

    this.app.resourcer.registerActionHandlers({
      'applications:start': async (ctx, next) => {
        const { filterByTk } = ctx.action.params;
        AppSupervisor.getInstance().startApp(filterByTk);
        ctx.body = 'ok';
        await next();
      },
    });

    this.app.resourcer.registerActionHandlers({
      'applications:memoryUsage': async (ctx, next) => {
        ctx.body = process.memoryUsage();
        await next();
      },
    });

    this.app.acl.allow('applications', 'listPinned', 'loggedIn');

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.applications`,
      actions: ['applications:*'],
    });

    this.app.resourcer.use(async (ctx, next) => {
      await next();
      const { actionName, resourceName, params } = ctx.action;
      if (actionName === 'list' && resourceName === 'applications') {
        const applications = ctx.body.rows;
        for (const application of applications) {
          const appStatus = AppSupervisor.getInstance().getAppStatus(application.name, 'stopped');
          application.status = appStatus;
        }
      }
    });
  }
}
