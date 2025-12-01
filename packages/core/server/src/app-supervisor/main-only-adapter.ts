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
  readonly name = 'main-only';
  apps: Record<string, Application> = {};
  statuses: Record<string, AppStatus> = {};

  constructor(private readonly supervisor: AppSupervisor) {}

  async getApp(appName: string, options: GetAppOptions = {}) {
    return this.apps[appName];
  }

  async bootStrapApp() {
    this.setAppStatus('main', 'initialized');
  }

  addApp(app: Application) {
    this.apps[app.name] = app;
    return app;
  }

  subApps() {
    return Object.values(this.apps);
  }

  hasApp(appName: string) {
    return !!this.apps[appName];
  }

  async startApp(appName: string) {
    const app = await this.getApp(appName, { withOutBootStrap: true });
    await app?.runCommand('start', '--quickstart');
  }

  async stopApp(appName: string) {
    await this.apps[appName]?.runCommand('stop');
    delete this.apps[appName];
  }

  async removeApp(appName: string) {
    await this.apps[appName]?.runCommand('destroy');
    delete this.apps[appName];
  }

  reset() {
    this.apps = {};
    this.statuses = {};
    return Promise.resolve();
  }

  setAppStatus(appName: string, status: AppStatus) {
    this.statuses[appName] = status;
  }

  getAppStatus(appName: string, defaultStatus?: AppStatus) {
    return this.statuses[appName] ?? defaultStatus ?? null;
  }

  hasAppError() {
    return false;
  }

  setAppError() {}
  clearAppError() {}
  touchApp() {}
}
