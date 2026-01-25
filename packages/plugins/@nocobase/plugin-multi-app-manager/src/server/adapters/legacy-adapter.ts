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
import Application, { AppSupervisor } from '@nocobase/server';
import type { AppDiscoveryAdapter, AppProcessAdapter, AppStatus, GetAppOptions } from '@nocobase/server';

export class LegacyAdapter implements AppDiscoveryAdapter, AppProcessAdapter {
  public readonly name = 'legacy';
  public apps: Record<string, Application> = {};
  public lastSeenAt: Map<string, number> = new Map();
  public appErrors: Record<string, Error> = {};
  public appStatus: Record<string, AppStatus> = {};
  public lastMaintainingMessage: Record<string, string> = {};
  public statusBeforeCommanding: Record<string, AppStatus> = {};

  private appMutexes: Record<string, Mutex> = {};
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

  async removeAllApps() {
    const appNames = Object.keys(this.apps);
    for (const appName of appNames) {
      await this.removeApp(appName);
    }
  }

  setAppError(appName: string, error: Error) {
    this.appErrors[appName] = error;
    this.supervisor.emit('appError', { appName, error });
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
    this.supervisor.emit('appStatusChanged', { appName, status, options });
  }

  getMutexOfApp(appName: string) {
    if (!this.appMutexes[appName]) {
      this.appMutexes[appName] = new Mutex();
    }
    return this.appMutexes[appName];
  }

  private async _bootStrapApp(appName: string, options = {}) {
    await this.setAppStatus(appName, 'initializing');
    await this.supervisor.initApp({ appName, options });

    if (!this.hasApp(appName)) {
      await this.setAppStatus(appName, 'not_found');
      return;
    }

    const appStatus = await this.getAppStatus(appName);
    if (!appStatus || appStatus === 'initializing') {
      await this.setAppStatus(appName, 'initialized');
    }
  }

  async bootstrapApp(appName: string, options = {}) {
    const mutex = this.getMutexOfApp(appName);
    try {
      await tryAcquire(mutex).runExclusive(async () => {
        const status = await this.getAppStatus(appName);
        if (this.hasApp(appName) && status !== 'preparing') {
          return;
        }
        if (appName === 'main') {
          return this._bootStrapApp(appName, options);
        }
        void this.setAppStatus(appName, 'preparing');
        await this.bootstrapQueue.add(async () => {
          await this._bootStrapApp(appName, options);
        });
      });
    } catch (e) {
      if (e !== E_ALREADY_LOCKED) {
        console.error(e);
      }
    }
  }

  async getApp(appName: string, options: GetAppOptions = {}) {
    if (!options.withOutBootStrap) {
      await this.bootstrapApp(appName, options);
    }

    return this.apps[appName];
  }

  hasApp(appName: string) {
    return !!this.apps[appName];
  }

  setAppLastSeenAt(appName: string) {
    if (!this.hasApp(appName)) {
      return;
    }
    this.lastSeenAt.set(appName, Math.floor(Date.now() / 1000));
  }

  getAppLastSeenAt(appName: string): number | null {
    return this.lastSeenAt.get(appName);
  }

  addApp(app: Application) {
    if (this.apps[app.name]) {
      throw new Error(`app ${app.name} already exists`);
    }
    this.apps[app.name] = app;
    if (!this.appStatus[app.name] || this.appStatus[app.name] === 'not_found') {
      void this.setAppStatus(app.name, 'preparing');
    }
    return app;
  }

  getApps() {
    return Object.values(this.apps).filter((app) => app && app.name !== 'main');
  }

  async startApp(appName: string) {
    const appInstance = await this.getApp(appName);
    await appInstance?.runCommand('start', '--quickstart');
  }

  async stopApp(appName: string) {
    const app = this.apps[appName];
    if (!app) {
      return;
    }
    await app.runCommand('stop');
    this.apps[appName] = null;
  }

  async removeApp(appName: string) {
    const app = this.apps[appName];
    if (!app) {
      return;
    }
    await app.runCommand('destroy');
    this.apps[appName] = null;
  }

  async getAppStatus(appName: string, defaultStatus?: AppStatus) {
    const status = this.appStatus[appName];
    if (status === undefined && defaultStatus !== undefined) {
      return defaultStatus;
    }
    return status ?? null;
  }

  async getAppModel(appName: string) {
    const mainApp = await this.getApp('main');
    if (!mainApp) {
      return null;
    }
    const repo = mainApp.db.getRepository('applications');
    if (!repo) {
      return null;
    }
    const applicationModel = await repo.findOne({
      filter: {
        name: appName,
      },
    });
    if (!applicationModel) {
      return null;
    }
    return applicationModel;
  }
}
