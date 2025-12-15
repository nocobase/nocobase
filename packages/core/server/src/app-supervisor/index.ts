/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import { EventEmitter } from 'events';
import Application, { ApplicationOptions, MaintainingCommandStatus } from '../application';
import { MainOnlyAdapter } from './main-only-adapter';
import type {
  AppDiscoveryAdapter,
  AppProcessAdapter,
  AppStatus,
  EnvironmentInfo,
  GetAppOptions,
  ProcessCommand,
  AppDbCreator,
  AppOptionsFactory,
  AppDbCreatorOptions,
} from './types';
import { getErrorLevel } from '../errors/handler';
import { ConditionalRegistry, Predicate } from './condition-registry';
import {
  createConnection,
  createConnectionCondition,
  createDatabase,
  createDatabaseCondition,
  createSchema,
  createSchemaCondition,
} from './db-creator';
import { appOptionsFactory } from './app-options-factory';
import { PubSubManagerPublishOptions } from '../pub-sub-manager';
import { Transaction, Transactionable } from '@nocobase/database';

export type AppDiscoveryAdapterFactory = (context: { supervisor: AppSupervisor }) => AppDiscoveryAdapter;
export type AppProcessAdapterFactory = (context: { supervisor: AppSupervisor }) => AppProcessAdapter;
type CommandOptions = Partial<Omit<ProcessCommand, 'appName' | 'action'>>;

export class AppSupervisor extends EventEmitter implements AsyncEmitter {
  private static instance: AppSupervisor;
  private static discoveryAdapterFactories: Map<string, AppDiscoveryAdapterFactory> = new Map();
  private static processAdapterFactories: Map<string, AppProcessAdapterFactory> = new Map();
  private static defaultDiscoveryAdapterName: string | null = 'main-only';
  private static defaultProcessAdapterName: string | null = 'main-only';

  public runningMode: 'single' | 'multiple' = 'multiple';
  public singleAppName: string | null = null;

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  private discoveryAdapter: AppDiscoveryAdapter;
  private processAdapter: AppProcessAdapter;
  private discoveryAdapterName: string;
  private processAdapterName: string;
  private appDbCreator = new ConditionalRegistry<AppDbCreatorOptions, void>();
  private appOptionsFactory: AppOptionsFactory = appOptionsFactory;

  private constructor() {
    super();

    if (process.env.STARTUP_SUBAPP) {
      this.runningMode = 'single';
      this.singleAppName = process.env.STARTUP_SUBAPP;
    }

    this.discoveryAdapterName = this.resolveDiscoveryAdapterName();
    this.processAdapterName = this.resolveProcessAdapterName();
    this.discoveryAdapter = this.createDiscoveryAdapter();
    this.processAdapter = this.createProcessAdapter();

    this.registerAppDbCreator(createDatabaseCondition, createDatabase);
    this.registerAppDbCreator(createConnectionCondition, createConnection);
    this.registerAppDbCreator(createSchemaCondition, createSchema);
  }

  private resolveDiscoveryAdapterName() {
    return process.env.APP_DISCOVERY_ADAPTER || AppSupervisor.defaultDiscoveryAdapterName;
  }

  private resolveProcessAdapterName() {
    return process.env.APP_PROCESS_ADAPTER || AppSupervisor.defaultProcessAdapterName;
  }

  private createDiscoveryAdapter(): AppDiscoveryAdapter {
    const adapterName = this.discoveryAdapterName;
    let factory = adapterName ? AppSupervisor.discoveryAdapterFactories.get(adapterName) : null;

    if (
      !factory &&
      AppSupervisor.defaultDiscoveryAdapterName &&
      adapterName !== AppSupervisor.defaultDiscoveryAdapterName
    ) {
      factory = AppSupervisor.discoveryAdapterFactories.get(AppSupervisor.defaultDiscoveryAdapterName);
    }

    if (!factory) {
      throw new Error('No AppDiscovery adapter available');
    }

    return factory({ supervisor: this });
  }

  private isProcessCapableAdapter(adapter: any): adapter is AppProcessAdapter {
    return adapter && typeof adapter.addApp === 'function' && typeof adapter.startApp === 'function';
  }

  private createProcessAdapter(): AppProcessAdapter {
    const adapterName = this.processAdapterName;
    if (
      adapterName &&
      adapterName === this.discoveryAdapterName &&
      this.isProcessCapableAdapter(this.discoveryAdapter)
    ) {
      return this.discoveryAdapter;
    }

    let factory = adapterName ? AppSupervisor.processAdapterFactories.get(adapterName) : null;

    if (
      !factory &&
      AppSupervisor.defaultProcessAdapterName &&
      adapterName !== AppSupervisor.defaultProcessAdapterName
    ) {
      factory = AppSupervisor.processAdapterFactories.get(AppSupervisor.defaultProcessAdapterName);
    }

    if (!factory) {
      throw new Error('No AppProcess adapter available');
    }

    return factory({ supervisor: this });
  }

  public static registerDiscoveryAdapter(name: string, factory: AppDiscoveryAdapterFactory) {
    AppSupervisor.discoveryAdapterFactories.set(name, factory);
  }

  public static registerProcessAdapter(name: string, factory: AppProcessAdapterFactory) {
    AppSupervisor.processAdapterFactories.set(name, factory);
  }

  public static setDefaultDiscoveryAdapter(name: string) {
    AppSupervisor.defaultDiscoveryAdapterName = name;
  }

  public static setDefaultProcessAdapter(name: string) {
    AppSupervisor.defaultProcessAdapterName = name;
  }

  public static getInstance() {
    if (!AppSupervisor.instance) {
      AppSupervisor.instance = new AppSupervisor();
    }

    return AppSupervisor.instance;
  }

  get apps(): Record<string, Application> {
    return this.processAdapter.apps ?? Object.create(null);
  }

  get appStatus(): Record<string, AppStatus> {
    return this.discoveryAdapter.appStatus ?? Object.create(null);
  }

  get appErrors(): Record<string, Error> {
    return this.processAdapter.appErrors ?? Object.create(null);
  }

  get lastSeenAt(): Map<string, number> {
    return this.discoveryAdapter.lastSeenAt ?? new Map<string, number>();
  }

  get lastMaintainingMessage(): Record<string, string> {
    return this.processAdapter.lastMaintainingMessage ?? Object.create(null);
  }

  get statusBeforeCommanding(): Record<string, AppStatus> {
    return this.processAdapter.statusBeforeCommanding ?? Object.create(null);
  }

  getProcessAdapter() {
    return this.processAdapter;
  }

  getDiscoveryAdapter() {
    return this.discoveryAdapter;
  }

  registerAppDbCreator(condition: Predicate<AppDbCreatorOptions>, creator: AppDbCreator) {
    this.appDbCreator.register(condition, creator);
  }

  async createDatabase(options: AppDbCreatorOptions) {
    return this.appDbCreator.run(options);
  }

  setAppOptionsFactory(factory: AppOptionsFactory) {
    this.appOptionsFactory = factory ?? (() => ({}));
  }

  getAppOptionsFactory() {
    return this.appOptionsFactory;
  }

  async bootstrapApp({ appName, options }: { appName: string; options?: { upgrading?: boolean } }) {
    const loadButNotStart = options?.upgrading;

    const mainApp = await this.getApp('main');
    if (!mainApp) {
      return;
    }
    const appOptions = await this.getAppOptions(appName);
    if (!appOptions) {
      return;
    }
    if (appOptions?.standaloneDeployment && this.runningMode !== 'single') {
      return;
    }

    if (this.hasApp(appName)) {
      return;
    }
    const app = this.registerApp({ appName, appOptions, mainApp });

    // must skip load on upgrade
    if (!loadButNotStart) {
      await app.runCommand('start', '--quickstart');
    }
  }

  setAppError(appName: string, error: Error) {
    this.processAdapter.setAppError(appName, error);
  }

  hasAppError(appName: string) {
    return this.processAdapter.hasAppError(appName);
  }

  clearAppError(appName: string) {
    this.processAdapter.clearAppError(appName);
  }

  async reset() {
    await this.processAdapter.removeAllApps();
    this.removeAllListeners();
  }

  async destroy() {
    await this.reset();
    AppSupervisor.instance = null;
  }

  async getAppStatus(appName: string, defaultStatus?: AppStatus) {
    return this.discoveryAdapter.getAppStatus(appName, defaultStatus);
  }

  async setAppStatus(appName: string, status: AppStatus, options = {}) {
    return this.discoveryAdapter.setAppStatus(appName, status, options);
  }

  registerApp({
    appName,
    appOptions,
    mainApp,
    hook,
  }: {
    appName: string;
    appOptions: ApplicationOptions;
    mainApp?: Application;
    hook?: boolean;
  }) {
    let options = appOptions;
    if (mainApp) {
      const defaultAppOptions = this.appOptionsFactory(appName, mainApp);
      options = {
        ...lodash.merge({}, defaultAppOptions, appOptions),
        name: appName,
      };
    }

    const app = new Application(options);

    if (hook !== false) {
      app.on('afterStart', async () => {
        mainApp.emit('subAppStarted', app);
        await this.sendSyncMessage(mainApp, {
          type: 'app:started',
          appName,
        });
      });

      app.on('afterStop', async () => {
        await this.sendSyncMessage(mainApp, {
          type: 'app:stopped',
          appName,
        });
      });

      app.on('afterDestroy', async () => {
        await this.sendSyncMessage(mainApp, {
          type: 'app:removed',
          appName,
        });
      });
    }

    return app;
  }

  bootMainApp(options: ApplicationOptions) {
    const app = new Application(options);
    app.on('afterLoad', async (app: Application) => {
      await app.syncMessageManager.subscribe('app-supervisor', async (message: { type: string; appName: string }) => {
        const { type } = message;

        if (type === 'app:started') {
          const { appName } = message;
          if (this.hasApp(appName)) {
            return;
          }
          const appOptions = await this.getAppOptions(appName);
          if (!appOptions) {
            return;
          }
          const newApp = this.registerApp({ appName, appOptions, mainApp: app });
          newApp.runCommand('start', '--quickstart');
        }

        if (type === 'app:stopped') {
          const { appName } = message;
          await this.stopApp(appName);
        }

        if (type === 'app:removed') {
          const { appName } = message;
          await this.removeApp(appName);
        }
      });
    });
    return app;
  }

  async touchApp(appName: string) {
    return this.discoveryAdapter.touchApp(appName);
  }

  async getAppOptions(appName: string) {
    return this.discoveryAdapter.getAppOptions(appName);
  }

  async getAutoStartApps(environmentName?: string) {
    if (typeof this.discoveryAdapter.getAutoStartApps === 'function') {
      return this.discoveryAdapter.getAutoStartApps(environmentName);
    }
    return [];
  }

  addApp(app: Application | ApplicationOptions) {
    this.processAdapter.addApp(app);
    if (app instanceof Application) {
      this.bindAppEvents(app);
      this.emit('afterAppAdded', app);
    }
    return app;
  }

  async getApp(appName: string, options: GetAppOptions = {}) {
    return this.processAdapter.getApp(appName, options);
  }

  hasApp(appName: string) {
    return this.processAdapter.hasApp(appName);
  }

  async createApp(options: {
    appName: string;
    appOptions: ApplicationOptions;
    mainApp?: Application;
    transaction?: Transaction;
  }) {
    await this.processAdapter.createApp(options);
  }

  async startApp(appName: string) {
    await this.processAdapter.startApp(appName);
  }

  async stopApp(appName: string) {
    await this.processAdapter.stopApp(appName);
  }

  async removeApp(appName: string) {
    await this.processAdapter.removeApp(appName);
  }

  async upgradeApp(appName: string) {
    await this.processAdapter.upgradeApp(appName);
  }

  /**
   * @deprecated
   * use {#getApps} instead
   */
  subApps() {
    return this.processAdapter.getApps();
  }

  getApps() {
    return this.processAdapter.getApps();
  }

  async registerEnvironment(environment: EnvironmentInfo) {
    if (typeof this.discoveryAdapter.registerEnvironment === 'function') {
      await this.discoveryAdapter.registerEnvironment(environment);
    }
  }

  async unregisterEnvironment(environmentName: string) {
    if (typeof this.discoveryAdapter.unregisterEnvironment === 'function') {
      await this.discoveryAdapter.unregisterEnvironment(environmentName);
    }
  }

  async listEnvironments() {
    if (typeof this.discoveryAdapter.listEnvironments === 'function') {
      return this.discoveryAdapter.listEnvironments();
    }

    return [] as EnvironmentInfo[];
  }

  async getEnvironment(environmentName: string) {
    if (typeof this.discoveryAdapter.getEnvironment === 'function') {
      return this.discoveryAdapter.getEnvironment(environmentName);
    }

    return null;
  }

  async heartbeatEnvironment(environmentName: string, payload?: Record<string, any>) {
    if (typeof this.discoveryAdapter.heartbeatEnvironment === 'function') {
      await this.discoveryAdapter.heartbeatEnvironment(environmentName, payload);
    }
  }

  async sendSyncMessage(
    mainApp: Application,
    message: { type: string; appName: string },
    options?: PubSubManagerPublishOptions & Transactionable,
  ) {
    await mainApp.syncMessageManager.publish('app-supervisor', message, options);
  }

  override on(eventName: string | symbol, listener: (...args: any[]) => void): this {
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

    app.on('maintainingMessageChanged', async ({ message, maintainingStatus }) => {
      if (this.lastMaintainingMessage[app.name] === message) {
        return;
      }
      this.lastMaintainingMessage[app.name] = message;
      const appStatus = await this.getAppStatus(app.name);
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
        void this.setAppStatus(app.name, 'running', { refresh: true });
      } else {
        void this.setAppStatus(app.name, 'running');
      }
    });

    app.on('__stopped', async () => {
      await this.setAppStatus(app.name, 'stopped');
    });

    app.on('maintaining', async (maintainingStatus: MaintainingCommandStatus) => {
      const { status } = maintainingStatus;
      switch (status) {
        case 'command_begin':
          this.statusBeforeCommanding[app.name] = await this.getAppStatus(app.name);
          await this.setAppStatus(app.name, 'commanding');
          break;
        case 'command_running':
          break;
        case 'command_end':
          {
            const appStatus = await this.getAppStatus(app.name);
            this.emit('appMaintainingStatusChanged', maintainingStatus);
            if (appStatus == 'commanding') {
              await this.setAppStatus(app.name, this.statusBeforeCommanding[app.name]);
            }
          }
          break;
        case 'command_error':
          {
            const errorLevel = getErrorLevel(maintainingStatus.error);
            if (errorLevel === 'fatal') {
              this.setAppError(app.name, maintainingStatus.error);
              await this.setAppStatus(app.name, 'error');
              break;
            }
            if (errorLevel === 'warn') {
              this.emit('appError', {
                appName: app.name,
                error: maintainingStatus.error,
              });
            }
            await this.setAppStatus(app.name, this.statusBeforeCommanding[app.name]);
          }
          break;
      }
    });
  }
}

applyMixins(AppSupervisor, [AsyncEmitter]);

AppSupervisor.registerDiscoveryAdapter('main-only', ({ supervisor }) => new MainOnlyAdapter(supervisor));
AppSupervisor.registerProcessAdapter('main-only', ({ supervisor }) => new MainOnlyAdapter(supervisor));

export type {
  AppDiscoveryAdapter,
  AppProcessAdapter,
  AppStatus,
  ProcessCommand,
  EnvironmentInfo,
  GetAppOptions,
  AppDbCreator,
  AppOptionsFactory,
} from './types';
