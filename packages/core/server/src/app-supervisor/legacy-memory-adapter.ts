/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { E_ALREADY_LOCKED, Mutex, tryAcquire } from 'async-mutex';
import PQueue from 'p-queue';
import Application, { MaintainingCommandStatus } from '../application';
import { getErrorLevel } from '../errors/handler';
import type { AppSupervisor } from './index';
import type { AppBootstrapper, AppDiscoveryAdapter, AppProcessAdapter, AppStatus, GetAppOptions } from './types';

export class LegacyMemoryAdapter implements AppDiscoveryAdapter, AppProcessAdapter {
  public readonly name = 'legacy-memory';
  public apps: Record<string, Application> = {};
  public lastSeenAt: Map<string, number> = new Map();
  public appErrors: Record<string, Error> = {};
  public appStatus: Record<string, AppStatus> = {};
  public lastMaintainingMessage: Record<string, string> = {};
  public statusBeforeCommanding: Record<string, AppStatus> = {};

  private appMutexes: Record<string, Mutex> = {};
  private appBootstrapper: AppBootstrapper = null;
  private bootstrapQueue: PQueue;

  constructor(private readonly supervisor: AppSupervisor) {
    this.bootstrapQueue = new PQueue({
      concurrency: process.env.SUBAPP_BOOTSTRAP_CONCURRENCY
        ? parseInt(process.env.SUBAPP_BOOTSTRAP_CONCURRENCY)
        : Infinity,
      intervalCap: process.env.SUBAPP_BOOTSTRAP_INTERVAL_CAP
        ? parseInt(process.env.SUBAPP_BOOTSTRAP_INTERVAL_CAP)
        : Infinity,
      interval: process.env.SUBAPP_BOOTSTRAP_INTERVAL ? parseInt(process.env.SUBAPP_BOOTSTRAP_INTERVAL) : 0,
      timeout: 1 * 60 * 1000,
    });
  }

  async reset() {
    const appNames = Object.keys(this.apps);
    for (const appName of appNames) {
      await this.removeApp(appName);
    }

    this.appBootstrapper = null;
  }

  setAppBootstrapper(appBootstrapper: AppBootstrapper) {
    this.appBootstrapper = appBootstrapper;
  }

  setAppError(appName: string, error: Error) {
    this.appErrors[appName] = error;

    this.supervisor.emit('appError', {
      appName,
      error,
    });
  }

  hasAppError(appName: string) {
    return !!this.appErrors[appName];
  }

  clearAppError(appName: string) {
    delete this.appErrors[appName];
  }

  async setAppStatus(appName: string, status: AppStatus, options = {}) {
    if (this.appStatus[appName] === status) {
      return;
    }

    this.appStatus[appName] = status;

    this.supervisor.emit('appStatusChanged', {
      appName,
      status,
      options,
    });
  }

  getMutexOfApp(appName: string) {
    if (!this.appMutexes[appName]) {
      this.appMutexes[appName] = new Mutex();
    }

    return this.appMutexes[appName];
  }

  private async _bootStrapApp(appName: string, options = {}) {
    await this.setAppStatus(appName, 'initializing');

    if (this.appBootstrapper) {
      await this.appBootstrapper({
        appSupervisor: this.supervisor,
        appName,
        options,
      });
    }

    if (!this.hasApp(appName)) {
      await this.setAppStatus(appName, 'not_found');
    } else {
      const appStatus = await this.getAppStatus(appName);
      if (!appStatus || appStatus === 'initializing') {
        await this.setAppStatus(appName, 'initialized');
      }
    }
  }

  async bootStrapApp(appName: string, options = {}) {
    const mutex = this.getMutexOfApp(appName);
    try {
      await tryAcquire(mutex).runExclusive(async () => {
        const appStatus = await this.getAppStatus(appName);
        if (this.hasApp(appName) && appStatus !== 'preparing') {
          return;
        }
        if (appName === 'main') {
          return this._bootStrapApp(appName, options);
        }
        this.setAppStatus(appName, 'preparing');
        await this.bootstrapQueue.add(async () => {
          await this._bootStrapApp(appName, options);
        });
      });
    } catch (e) {
      console.log(e);
      if (e === E_ALREADY_LOCKED) {
        return;
      }
    }
  }

  async getApp(appName: string, options: GetAppOptions = {}) {
    if (!options.withOutBootStrap) {
      await this.bootStrapApp(appName, options);
    }

    return this.apps[appName];
  }

  hasApp(appName: string) {
    return !!this.apps[appName];
  }

  touchApp(appName: string) {
    if (!this.hasApp(appName)) {
      return;
    }

    this.lastSeenAt.set(appName, Math.floor(Date.now() / 1000));
  }

  addApp(app: Application) {
    if (this.apps[app.name]) {
      throw new Error(`app ${app.name} already exists`);
    }

    app.logger.info(`add app ${app.name} into supervisor`, { submodule: 'legacy-memory-adapter', method: 'addApp' });

    this.bindAppEvents(app);

    this.apps[app.name] = app;

    this.supervisor.emit('afterAppAdded', app);

    this.getAppStatus(app.name)
      .catch((err) => {
        app.log.error(err, { submodule: 'legacy-memory-adapter', method: 'addApp' });
        return undefined;
      })
      .then((status) => {
        if (!status || status === 'not_found') {
          return this.setAppStatus(app.name, 'preparing');
        }
      })
      .catch((err) => {
        app.log.error(err, { submodule: 'legacy-memory-adapter', method: 'addApp' });
      });

    return app;
  }

  async getAppsNames() {
    return Object.values(this.apps).map((app) => app.name);
  }

  async startApp(appName: string) {
    const appInstance = await this.getApp(appName);
    await appInstance?.runCommand('start', '--quickstart');
  }

  async stopApp(appName: string) {
    if (!this.apps[appName]) {
      console.log(`app ${appName} not exists`);
      return;
    }

    await this.apps[appName].runCommand('stop');
    this.apps[appName] = null;
  }

  async removeApp(appName: string) {
    if (!this.apps[appName]) {
      console.log(`app ${appName} not exists`);
      return;
    }

    await this.apps[appName].runCommand('destroy');
    this.apps[appName] = null;
  }

  subApps() {
    return Object.values(this.apps).filter((app) => app && app.name !== 'main');
  }

  async getAppStatus(appName: string, defaultStatus?: AppStatus) {
    const status = this.appStatus[appName];

    if (status === undefined && defaultStatus !== undefined) {
      return defaultStatus;
    }

    return status ?? null;
  }

  private bindAppEvents(app: Application) {
    app.on('afterDestroy', () => {
      delete this.apps[app.name];
      delete this.appStatus[app.name];
      delete this.appErrors[app.name];
      delete this.lastMaintainingMessage[app.name];
      delete this.statusBeforeCommanding[app.name];
      this.lastSeenAt.delete(app.name);
    });

    app.on('maintainingMessageChanged', async ({ message, maintainingStatus }) => {
      if (this.lastMaintainingMessage[app.name] === message) {
        return;
      }

      this.lastMaintainingMessage[app.name] = message;

      const appStatus = await this.getAppStatus(app.name);

      if (!maintainingStatus && appStatus !== 'running') {
        return;
      }

      this.supervisor.emit('appMaintainingMessageChanged', {
        appName: app.name,
        message,
        status: appStatus,
        command: appStatus == 'running' ? null : maintainingStatus.command,
      });
    });

    app.on('__started', async (_app, options) => {
      const { maintainingStatus, options: startOptions } = options;

      if (
        maintainingStatus &&
        [
          'install',
          'upgrade',
          'refresh',
          'restore',
          'pm.add',
          'pm.update',
          'pm.enable',
          'pm.disable',
          'pm.remove',
        ].includes(maintainingStatus.command.name) &&
        !startOptions.recover
      ) {
        this.setAppStatus(app.name, 'running', {
          refresh: true,
        });
      } else {
        this.setAppStatus(app.name, 'running');
      }
    });

    app.on('__stopped', async () => {
      this.setAppStatus(app.name, 'stopped');
    });

    app.on('maintaining', async (maintainingStatus: MaintainingCommandStatus) => {
      const { status, command } = maintainingStatus;

      switch (status) {
        case 'command_begin':
          this.statusBeforeCommanding[app.name] = await this.getAppStatus(app.name);
          this.setAppStatus(app.name, 'commanding');
          break;
        case 'command_running':
          break;
        case 'command_end':
          {
            const appStatus = await this.getAppStatus(app.name);
            this.supervisor.emit('appMaintainingStatusChanged', maintainingStatus);

            if (appStatus == 'commanding') {
              this.setAppStatus(app.name, this.statusBeforeCommanding[app.name]);
            }
          }
          break;
        case 'command_error':
          {
            const errorLevel = getErrorLevel(maintainingStatus.error);

            if (errorLevel === 'fatal') {
              this.setAppError(app.name, maintainingStatus.error);
              this.setAppStatus(app.name, 'error');
              break;
            }

            if (errorLevel === 'warn') {
              this.supervisor.emit('appError', {
                appName: app.name,
                error: maintainingStatus.error,
              });
            }

            this.setAppStatus(app.name, this.statusBeforeCommanding[app.name]);
          }
          break;
      }
    });
  }
}
