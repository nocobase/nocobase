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
import { LegacyAdapter } from './adapters/legacy-adapter';

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

    const beforeSubAppStatus = await AppSupervisor.getInstance().getAppStatus(instance.name);

    const subApp = await appSupervisor.getApp(instance.name, {
      upgrading: true,
    });

    try {
      mainApp.setMaintainingMessage(`upgrading sub app ${instance.name}...`);
      await subApp.runAsCLI(['upgrade'], { from: 'user' });
      if (!beforeSubAppStatus && (await AppSupervisor.getInstance().getAppStatus(instance.name)) === 'initialized') {
        await AppSupervisor.getInstance().removeApp(instance.name);
      }
    } catch (error) {
      console.log(`${instance.name}: upgrade failed`);
      mainApp.logger.error(error);
      console.error(error);
    }
  }
};

export class PluginMultiAppManagerServer extends Plugin {
  subAppUpgradeHandler: SubAppUpgradeHandler = defaultSubAppUpgradeHandle;
  meter: Meter;

  setSubAppUpgradeHandler(handler: SubAppUpgradeHandler) {
    this.subAppUpgradeHandler = handler;
  }

  protected static registerLegacyAdapter() {
    const factory = ({ supervisor }) => new LegacyAdapter(supervisor);
    AppSupervisor.registerDiscoveryAdapter('legacy', factory);
    AppSupervisor.registerProcessAdapter('legacy', factory);
    AppSupervisor.setDefaultDiscoveryAdapter('legacy');
    AppSupervisor.setDefaultProcessAdapter('legacy');
  }

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

  setAppOptionsFactory(appOptionsFactory: AppOptionsFactory) {
    AppSupervisor.getInstance().setAppOptionsFactory(appOptionsFactory);
  }

  static staticImport() {
    this.registerLegacyAdapter();
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
    const supervisor = AppSupervisor.getInstance();
    if (supervisor.getDiscoveryAdapter().name !== 'legacy') {
      return;
    }
    this.meter = this.app.telemetry.metric.getMeter();
    if (!this.meter) {
      return;
    }
    const subAppStatusGauge = this.meter.createObservableGauge('sub_app_status', {
      description: 'Number of sub applications by cached status in supervisor.appStatus',
    });
    this.meter.addBatchObservableCallback(
      (observableResult) => {
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
    const supervisor = AppSupervisor.getInstance();
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

        const subApp = supervisor.registerApp({
          appModel: model as any,
          mainApp: this.app,
        });

        const quickstart = async () => {
          // create database
          try {
            await supervisor.createDatabase({
              app: subApp,
              transaction,
              appOptions: model.get('options') || {},
            });
          } catch (error) {
            this.log.error(error, { method: 'appDbCreator' });
            await supervisor.setAppStatus(subApp.name, 'error');
            return;
          }

          await supervisor.getApp(subApp.name);
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

    this.db.on('applications.afterDestroy', async (model: ApplicationModel) => {
      await supervisor.removeApp(model.get('name') as string);
    });

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
      const appSupervisor = supervisor;

      this.app.setMaintainingMessage('starting sub applications...');

      if (appSupervisor.runningMode == 'single') {
        Gateway.getInstance().addAppSelectorMiddleware((ctx) => (ctx.resolvedAppName = appSupervisor.singleAppName));

        // If the sub application is running in single mode, register the application automatically
        try {
          await supervisor.getApp(appSupervisor.singleAppName);
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
          supervisor.getApp(subAppInstance.name);
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
        supervisor.stopApp(filterByTk);
        ctx.body = 'ok';
        await next();
      },
    });

    this.app.resourcer.registerActionHandlers({
      'applications:start': async (ctx, next) => {
        const { filterByTk } = ctx.action.params;
        supervisor.startApp(filterByTk);
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
          const appStatus = await supervisor.getAppStatus(application.name, 'stopped');
          application.status = appStatus;
        }
      }
    });
  }
}
