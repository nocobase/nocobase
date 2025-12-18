/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '../application';
import type { AppBootstrapper, AppDiscoveryAdapter, AppProcessAdapter, AppStatus, GetAppOptions } from './types';
import type { AppSupervisor } from './index';

/** Minimal single-process adapter only for booting the main application. */
export class MainOnlyAdapter implements AppDiscoveryAdapter, AppProcessAdapter {
  readonly name: string;
  app: Application;
  status: AppStatus;
  appError: Error;

  constructor(protected readonly supervisor: AppSupervisor) {
    this.name = 'main-only';
  }

  async getApp(appName: string, options: GetAppOptions = {}) {
    if (!options.withOutBootStrap) {
      await this.bootstrapApp();
    }
    return this.app;
  }

  async bootstrapApp() {
    const status = this.getAppStatus('main');
    if (this.hasApp() && status && status !== 'preparing') {
      return;
    }
    this.setAppStatus('main', 'initializing');
    this.setAppStatus('main', 'initialized');
  }

  addApp(app: Application) {
    if (this.app) {
      throw new Error(`app ${app.name} already exists`);
    }
    this.app = app;
    if (!this.status || this.status === 'not_found') {
      this.setAppStatus(app.name, 'preparing');
    }
    return app;
  }

  getApps() {
    return [this.app];
  }

  hasApp() {
    return !!this.app;
  }

  async startApp(appName: string) {
    const app = await this.getApp(appName, { withOutBootStrap: true });
    await app?.runCommand('start', '--quickstart');
  }

  async stopApp(appName: string) {
    await this.app.runCommand('stop');
  }

  async removeApp(appName: string) {
    await this.app.runCommand('destroy');
  }

  async removeAllApps() {
    return this.removeApp('main');
  }

  setAppStatus(appName: string, status: AppStatus, options = {}) {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.supervisor.emit('appStatusChanged', { appName, status, options });
  }

  getAppStatus(appName: string, defaultStatus?: AppStatus) {
    return this.status ?? defaultStatus ?? null;
  }

  hasAppError() {
    return !!this.appError;
  }

  setAppError(appName: string, error: Error) {
    this.appError = error;
    this.supervisor.emit('appError', { appName, error });
  }

  clearAppError() {
    this.appError = null;
  }

  setAppLastSeenAt() {}
}
