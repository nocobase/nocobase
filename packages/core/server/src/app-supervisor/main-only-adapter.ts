/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '../application';
import type { AppDiscoveryAdapter, AppProcessAdapter, AppStatus, GetAppOptions } from './types';
import type { AppSupervisor } from './index';

/** Minimal single-process adapter only for booting the main application. */
export class MainOnlyAdapter implements AppDiscoveryAdapter, AppProcessAdapter {
  readonly name: string;
  apps: Record<string, Application> = {};
  status: AppStatus;
  appErrors: Record<string, Error> = {};
  private readonly appManifests = new Map<string, Map<string, unknown>>();

  constructor(protected readonly supervisor: AppSupervisor) {
    this.name = 'main-only';
  }

  async getApp(appName: string, options: GetAppOptions = {}) {
    if (appName !== 'main') {
      this.supervisor.logger.warn(`only main app is supported`, { method: 'getApp', appName });
      return;
    }
    if (!options.withOutBootStrap) {
      await this.bootstrapApp(appName);
    }
    return this.apps[appName];
  }

  async bootstrapApp(appName: string) {
    if (appName !== 'main' || !this.apps[appName]) {
      this.setAppStatus(appName, 'not_found');
      return;
    }
    const status = this.getAppStatus('main');
    if (this.hasApp(appName) && status && status !== 'preparing') {
      return;
    }
    this.setAppStatus('main', 'initializing');
    this.setAppStatus('main', 'initialized');
  }

  addApp(app: Application) {
    if (app.name !== 'main') {
      this.supervisor.logger.warn(`only main app is supported`, { method: 'addApp' });
      return;
    }
    if (this.apps[app.name]) {
      throw new Error(`app ${app.name} already exists`);
    }
    this.apps[app.name] = app;
    if (!this.status || this.status === 'not_found') {
      this.setAppStatus(app.name, 'preparing');
    }
    return app;
  }

  getApps() {
    return Object.values(this.apps);
  }

  async listAppModels() {
    return [];
  }

  async setAppManifestItem(appName: string, namespace: string, itemKey: string, item: unknown) {
    const manifest = this.getOrCreateAppManifest(appName, namespace);
    manifest.set(itemKey, item);
  }

  async removeAppManifestItem(appName: string, namespace: string, itemKey: string) {
    this.appManifests.get(this.getAppManifestKey(appName, namespace))?.delete(itemKey);
  }

  async removeAppManifest(appName: string, namespace: string) {
    this.appManifests.delete(this.getAppManifestKey(appName, namespace));
  }

  async getAppManifestItems<T = unknown>(appName: string, namespace: string) {
    return Array.from(this.appManifests.get(this.getAppManifestKey(appName, namespace))?.values() || []) as T[];
  }

  async getAppManifests<T = unknown>(namespace: string, appNames: string[]) {
    const result: Record<string, T[]> = {};
    for (const appName of appNames) {
      const data = await this.getAppManifestItems<T>(appName, namespace);
      if (data.length > 0) {
        result[appName] = data;
      }
    }
    return result;
  }

  hasApp(appName: string) {
    if (appName !== 'main') {
      return false;
    }
    return !!this.apps[appName];
  }

  async startApp(appName: string) {
    if (appName !== 'main') {
      this.supervisor.logger.warn(`only main app is supported`, { method: 'startApp' });
      return;
    }
    const app = await this.getApp(appName, { withOutBootStrap: true });
    await app?.runCommand('start', '--quickstart');
  }

  async stopApp(appName: string) {
    if (appName !== 'main') {
      this.supervisor.logger.warn(`only main app is supported`, { method: 'stopApp' });
      return;
    }
    if (!this.apps[appName]) {
      return;
    }
    await this.apps[appName]?.runCommand('stop');
  }

  async removeApp(appName: string) {
    if (appName !== 'main') {
      this.supervisor.logger.warn(`only main app is supported`, { method: 'removeApp' });
      return;
    }
    if (!this.apps[appName]) {
      return;
    }
    await this.apps[appName].runCommand('destroy');
    this.apps[appName] = null;
  }

  async upgradeApp(appName: string) {
    if (appName !== 'main') {
      this.supervisor.logger.warn(`only main app is supported`, { method: 'upgrade' });
      return;
    }
    if (!this.apps[appName]) {
      return;
    }
    await this.apps[appName].runCommand('upgrade');
  }

  async dispatchAppEvent(appName: string, event: string, payload?: any, _context?: { requestId: string }) {
    const app = await this.getApp(appName, { withOutBootStrap: true });
    if (!app) {
      return;
    }
    await app.emitAsync(event, payload);
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

  hasAppError(appName: string) {
    return !!this.appErrors[appName];
  }

  setAppError(appName: string, error: Error) {
    this.appErrors[appName] = error;
    this.supervisor.emit('appError', { appName, error });
  }

  clearAppError(appName: string) {
    this.appErrors[appName] = null;
  }

  setAppLastSeenAt() {}

  getAppLastSeenAt(appName: string) {
    return null;
  }

  private getAppManifestKey(appName: string, namespace: string) {
    return `${namespace}:${appName}`;
  }

  private getOrCreateAppManifest(appName: string, namespace: string) {
    const key = this.getAppManifestKey(appName, namespace);
    const manifest = this.appManifests.get(key);
    if (manifest) {
      return manifest;
    }
    const nextManifest = new Map<string, unknown>();
    this.appManifests.set(key, nextManifest);
    return nextManifest;
  }
}
