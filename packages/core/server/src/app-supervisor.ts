/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import { Mutex } from 'async-mutex';
import { EventEmitter } from 'events';
import Application, { ApplicationOptions, MaintainingCommandStatus } from './application';
import { getErrorLevel } from './errors/handler';
import { logger } from '@nocobase/logger';

type BootOptions = {
  appName: string;
  options: any;
  appSupervisor: AppSupervisor;
};

type AppBootstrapper = (bootOptions: BootOptions) => Promise<void>;

type AppStatus = 'initializing' | 'initialized' | 'running' | 'commanding' | 'stopped' | 'error' | 'not_found';

export class AppSupervisor extends EventEmitter implements AsyncEmitter {
  private static instance: AppSupervisor;
  public runningMode: 'single' | 'multiple' = 'multiple';
  public singleAppName: string | null = null;
  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
  public apps: {
    [appName: string]: Application;
  } = {};

  public lastSeenAt: Map<string, number> = new Map();

  public appErrors: {
    [appName: string]: Error;
  } = {};

  public appStatus: {
    [appName: string]: AppStatus;
  } = {};

  public lastMaintainingMessage: {
    [appName: string]: string;
  } = {};

  public statusBeforeCommanding: {
    [appName: string]: AppStatus;
  } = {};

  private appMutexes = {};
  private appBootstrapper: AppBootstrapper = null;

  private constructor() {
    super();

    if (process.env.STARTUP_SUBAPP) {
      this.runningMode = 'single';
      this.singleAppName = process.env.STARTUP_SUBAPP;
    }
  }

  public static getInstance(): AppSupervisor {
    if (!AppSupervisor.instance) {
      AppSupervisor.instance = new AppSupervisor();
    }

    return AppSupervisor.instance;
  }

  setAppError(appName: string, error: Error) {
    this.appErrors[appName] = error;

    this.emit('appError', {
      appName: appName,
      error,
    });
  }

  hasAppError(appName: string) {
    return !!this.appErrors[appName];
  }

  clearAppError(appName: string) {
    delete this.appErrors[appName];
  }

  async reset() {
    const appNames = Object.keys(this.apps);
    for (const appName of appNames) {
      await this.removeApp(appName);
    }

    this.appBootstrapper = null;
    this.removeAllListeners();
  }

  async destroy() {
    await this.reset();
    AppSupervisor.instance = null;
  }

  setAppStatus(appName: string, status: AppStatus, options = {}) {
    if (this.appStatus[appName] === status) {
      return;
    }

    this.appStatus[appName] = status;

    this.emit('appStatusChanged', {
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

  async bootStrapApp(appName: string, options = {}) {
    await this.getMutexOfApp(appName).runExclusive(async () => {
      if (!this.hasApp(appName)) {
        this.setAppStatus(appName, 'initializing');

        if (this.appBootstrapper) {
          await this.appBootstrapper({
            appSupervisor: this,
            appName,
            options,
          });
        }

        if (!this.hasApp(appName)) {
          this.setAppStatus(appName, 'not_found');
        } else if (!this.getAppStatus(appName) || this.getAppStatus(appName) == 'initializing') {
          this.setAppStatus(appName, 'initialized');
        }
      }
    });
  }

  async getApp(
    appName: string,
    options: {
      withOutBootStrap?: boolean;
      [key: string]: any;
    } = {},
  ) {
    if (!options.withOutBootStrap) {
      await this.bootStrapApp(appName, options);
    }

    return this.apps[appName];
  }

  setAppBootstrapper(appBootstrapper: AppBootstrapper) {
    this.appBootstrapper = appBootstrapper;
  }

  getAppStatus(appName: string, defaultStatus?: AppStatus): AppStatus | null {
    const status = this.appStatus[appName];

    if (status === undefined && defaultStatus !== undefined) {
      return defaultStatus;
    }

    return status;
  }

  bootMainApp(options: ApplicationOptions) {
    return new Application(options);
  }

  hasApp(appName: string): boolean {
    return !!this.apps[appName];
  }

  touchApp(appName: string) {
    if (!this.hasApp(appName)) {
      return;
    }

    this.lastSeenAt.set(appName, Math.floor(Date.now() / 1000));
  }

  // add app into supervisor
  addApp(app: Application) {
    // if there is already an app with the same name, throw error
    if (this.apps[app.name]) {
      throw new Error(`app ${app.name} already exists`);
    }

    app.logger.info(`add app ${app.name} into supervisor`, { submodule: 'supervisor', method: 'addApp' });

    this.bindAppEvents(app);

    this.apps[app.name] = app;

    this.emit('afterAppAdded', app);

    if (!this.getAppStatus(app.name) || this.getAppStatus(app.name) == 'not_found') {
      this.setAppStatus(app.name, 'initialized');
    }

    return app;
  }

  // get registered app names
  async getAppsNames() {
    const apps = Object.values(this.apps);

    return apps.map((app) => app.name);
  }

  async removeApp(appName: string) {
    if (!this.apps[appName]) {
      logger.warn(`app ${appName} not exists`);
      return;
    }

    // call app.destroy
    await this.apps[appName].runCommand('destroy');
  }

  subApps() {
    return Object.values(this.apps).filter((app) => app.name !== 'main');
  }

  on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    const listeners = this.listeners(eventName);
    const listenerName = listener.name;

    if (listenerName !== '') {
      const exists = listeners.find((l) => l.name === listenerName);

      if (exists) {
        super.removeListener(eventName, exists as any);
      }
    }

    return super.on(eventName, listener);
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

    app.on('maintainingMessageChanged', ({ message, maintainingStatus }) => {
      if (this.lastMaintainingMessage[app.name] === message) {
        return;
      }

      this.lastMaintainingMessage[app.name] = message;

      const appStatus = this.getAppStatus(app.name);

      if (!maintainingStatus && appStatus !== 'running') {
        return;
      }

      this.emit('appMaintainingMessageChanged', {
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

    app.on('maintaining', (maintainingStatus: MaintainingCommandStatus) => {
      const { status, command } = maintainingStatus;

      switch (status) {
        case 'command_begin':
          {
            this.statusBeforeCommanding[app.name] = this.getAppStatus(app.name);
            this.setAppStatus(app.name, 'commanding');
          }
          break;

        case 'command_running':
          // emit status changed
          // this.emit('appMaintainingStatusChanged', maintainingStatus);
          break;
        case 'command_end':
          {
            const appStatus = this.getAppStatus(app.name);
            // emit status changed
            this.emit('appMaintainingStatusChanged', maintainingStatus);

            // not change
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
              this.emit('appError', {
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

applyMixins(AppSupervisor, [AsyncEmitter]);
