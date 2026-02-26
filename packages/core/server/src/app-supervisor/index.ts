/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { IncomingMessage, ServerResponse } from 'http';
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
  AppCommandAdapter,
  AppModel,
  BootstrapLock,
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
import { createSystemLogger, getLoggerFilePath, getLoggerLevel, SystemLogger } from '@nocobase/logger';
import AesEncryptor from '../aes-encryptor';
import _ from 'lodash';

export type AppDiscoveryAdapterFactory = (context: { supervisor: AppSupervisor }) => AppDiscoveryAdapter;
export type AppProcessAdapterFactory = (context: { supervisor: AppSupervisor }) => AppProcessAdapter;
export type AppCommandAdapterFactory = (context: { supervisor: AppSupervisor }) => AppCommandAdapter;

export class AppSupervisor extends EventEmitter implements AsyncEmitter {
  private static instance: AppSupervisor;
  private static discoveryAdapterFactories: Map<string, AppDiscoveryAdapterFactory> = new Map();
  private static processAdapterFactories: Map<string, AppProcessAdapterFactory> = new Map();
  private static commandAdapterFactories: Map<string, AppCommandAdapterFactory> = new Map();
  private static defaultDiscoveryAdapterName: string | null = 'main-only';
  private static defaultProcessAdapterName: string | null = 'main-only';
  private static defaultCommandAdapterName: string;

  public runningMode: 'single' | 'multiple' = 'multiple';
  public singleAppName: string | null = null;
  public logger: SystemLogger;
  public aesEncryptor?: AesEncryptor;

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  private discoveryAdapter: AppDiscoveryAdapter;
  private processAdapter: AppProcessAdapter;
  private commandAdapter: AppCommandAdapter;
  private discoveryAdapterName: string;
  private processAdapterName: string;
  private commandAdapterName: string;
  private appDbCreator = new ConditionalRegistry<AppDbCreatorOptions, void>();
  public appOptionsFactory: AppOptionsFactory = appOptionsFactory;

  private environmentHeartbeatInterval = 2 * 60 * 1000;
  private environmentHeartbeatTimer = null;

  private constructor() {
    super();

    if (process.env.STARTUP_SUBAPP) {
      this.runningMode = 'single';
      this.singleAppName = process.env.STARTUP_SUBAPP;
    }

    this.logger = createSystemLogger({
      dirname: getLoggerFilePath('main'),
      filename: 'system',
      level: getLoggerLevel(),
      seperateError: true,
      defaultMeta: {
        app: 'main',
        module: 'app-supervisor',
      },
    });

    this.discoveryAdapterName = this.resolveDiscoveryAdapterName();
    this.processAdapterName = this.resolveProcessAdapterName();
    this.commandAdapterName = this.resolveCommandAdapterName();
    this.logger.info(`App supervisor initialized`, {
      discoveryAdapter: this.discoveryAdapterName,
      processAdapter: this.processAdapterName,
      commandAdapter: this.commandAdapterName || '',
    });
    this.discoveryAdapter = this.createDiscoveryAdapter();
    this.processAdapter = this.createProcessAdapter();
    this.commandAdapter = this.createCommandAdapter();

    this.registerAppDbCreator(createDatabaseCondition, createDatabase);
    this.registerAppDbCreator(createConnectionCondition, createConnection);
    this.registerAppDbCreator(createSchemaCondition, createSchema);

    if (process.env.APP_SUPERVISOR_AES_SECRET_KEY) {
      try {
        const key = Buffer.from(process.env.APP_SUPERVISOR_AES_SECRET_KEY, 'hex');
        this.aesEncryptor = new AesEncryptor(key);
      } catch (error) {
        this.logger.warn('Failed to initialize APP_SUPERVISOR_AES_SECRET_KEY encryptor', {
          error: error.message,
        });
      }
    }
  }

  private resolveDiscoveryAdapterName() {
    return process.env.APP_DISCOVERY_ADAPTER || AppSupervisor.defaultDiscoveryAdapterName;
  }

  private resolveProcessAdapterName() {
    return process.env.APP_PROCESS_ADAPTER || AppSupervisor.defaultProcessAdapterName;
  }

  private resolveCommandAdapterName() {
    return process.env.APP_COMMAND_ADAPTER || AppSupervisor.defaultCommandAdapterName;
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

  private createCommandAdapter(): AppCommandAdapter {
    const adapterName = this.commandAdapterName;
    let factory = adapterName ? AppSupervisor.commandAdapterFactories.get(adapterName) : null;

    if (
      !factory &&
      AppSupervisor.defaultCommandAdapterName &&
      adapterName !== AppSupervisor.defaultCommandAdapterName
    ) {
      factory = AppSupervisor.commandAdapterFactories.get(AppSupervisor.defaultCommandAdapterName);
    }

    if (!factory) {
      return;
    }

    return factory({ supervisor: this });
  }

  public static registerDiscoveryAdapter(name: string, factory: AppDiscoveryAdapterFactory) {
    AppSupervisor.discoveryAdapterFactories.set(name, factory);
  }

  public static registerProcessAdapter(name: string, factory: AppProcessAdapterFactory) {
    AppSupervisor.processAdapterFactories.set(name, factory);
  }

  public static registerCommandAdapter(name: string, factory: AppCommandAdapterFactory) {
    AppSupervisor.commandAdapterFactories.set(name, factory);
  }

  public static setDefaultDiscoveryAdapter(name: string) {
    AppSupervisor.defaultDiscoveryAdapterName = name;
  }

  public static setDefaultProcessAdapter(name: string) {
    AppSupervisor.defaultProcessAdapterName = name;
  }

  public static setDefaultCommandAdapter(name: string) {
    AppSupervisor.defaultCommandAdapterName = name;
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

  get environmentName() {
    return this.discoveryAdapter.environmentName;
  }

  get environmentUrl() {
    return this.discoveryAdapter.environmentUrl;
  }

  get environmentProxyUrl() {
    return this.discoveryAdapter.environmentProxyUrl;
  }

  getProcessAdapter() {
    return this.processAdapter;
  }

  getDiscoveryAdapter() {
    return this.discoveryAdapter;
  }

  registerAppDbCreator(condition: Predicate<AppDbCreatorOptions>, creator: AppDbCreator, priority?: number) {
    this.appDbCreator.register(condition, creator, priority);
  }

  async createDatabase(options: AppDbCreatorOptions) {
    return this.appDbCreator.run(options);
  }

  setAppOptionsFactory(factory: AppOptionsFactory) {
    this.appOptionsFactory = factory ?? appOptionsFactory;
  }

  async bootstrapApp(appName: string) {
    return this.processAdapter.bootstrapApp(appName);
  }

  async initApp({ appName, options }: { appName: string; options?: { upgrading?: boolean } }) {
    const loadButNotStart = options?.upgrading;

    const mainApp = await this.getApp('main');
    if (!mainApp) {
      return;
    }
    const appModel = await this.getAppModel(appName);
    if (!appModel) {
      this.logger.error(`App model ${appName} not found`);
      return;
    }
    if (appModel.environments && !appModel.environments.includes(this.environmentName)) {
      this.logger.error(`App model ${appName} is not available in environment ${this.environmentName}`);
      return;
    }
    const appOptions = appModel.options;
    if (!appOptions) {
      this.logger.error(`App options ${appName} not found`);
      return;
    }
    if (appOptions?.standaloneDeployment && this.runningMode !== 'single') {
      return;
    }

    if (this.hasApp(appName)) {
      return;
    }
    this.registerApp({ appModel, mainApp });

    // must skip load on upgrade
    if (!loadButNotStart) {
      await this.startApp(appName);
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
    await this.discoveryAdapter.dispose?.();
    await this.commandAdapter?.dispose?.();
    if (this.environmentHeartbeatTimer) {
      this.environmentHeartbeatTimer = null;
    }
    this.removeAllListeners();
    this.logger.close();
  }

  async destroy() {
    await this.reset();
    AppSupervisor.instance = null;
  }

  async getAppStatus(appName: string, defaultStatus?: AppStatus) {
    return this.discoveryAdapter.getAppStatus(appName, defaultStatus);
  }

  async setAppStatus(appName: string, status: AppStatus, options = {}) {
    this.logger.debug('Setting app status', { appName, status });
    return this.discoveryAdapter.setAppStatus(appName, status, options);
  }

  async clearAppStatus(appName: string) {
    if (typeof this.discoveryAdapter.clearAppStatus !== 'function') {
      return;
    }
    return this.discoveryAdapter.clearAppStatus(appName);
  }

  async getAppsStatuses(appNames?: string[]) {
    return this.discoveryAdapter.getAppsStatuses?.(appNames) ?? {};
  }

  async getBootstrapLock(appName: string): Promise<BootstrapLock | null> {
    if (typeof this.discoveryAdapter.getBootstrapLock !== 'function') {
      return null;
    }
    return this.discoveryAdapter.getBootstrapLock(appName);
  }

  registerApp({ appModel, mainApp, hook }: { appModel: AppModel; mainApp?: Application; hook?: boolean }) {
    const appName = appModel.name;
    const appOptions = lodash.cloneDeep(appModel.options || {});
    if (this.aesEncryptor && appOptions?.encryptedDbPassword) {
      try {
        _.set(appOptions, 'database.password', this.aesEncryptor.decryptSync(appOptions.database.password));
      } catch (error) {
        this.logger.warn('Failed to decrypt database password for app registration', {
          appName,
          error: error.message,
        });
      }
    }
    let options = appOptions;
    if (mainApp) {
      const defaultAppOptions = this.appOptionsFactory(appName, mainApp, appOptions);
      // Some legacy app options factories do not accept options parameter
      // Thus, we need to merge manually here again
      options = {
        ...lodash.merge({}, defaultAppOptions, appOptions),
        name: appName,
      };
    }

    const app = new Application(options);

    if (hook !== false) {
      app.on('afterStart', async () => {
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
    this.registerCommandHandler(app);
    app.on('afterStart', async (app: Application) => {
      await app.syncMessageManager.subscribe(
        'app_supervisor:sync',
        async (message: { type: string; appName: string }) => {
          const { type } = message;

          if (type === 'app:started') {
            const { appName } = message;
            if (this.hasApp(appName)) {
              return;
            }
            const appModel = await this.getAppModel(appName);
            const appOptions = appModel?.options;
            if (!appOptions) {
              return;
            }
            const newApp = this.registerApp({ appModel, mainApp: app });
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
        },
      );
      await this.registerEnvironment(app);
      if (process.env.APP_MODE === 'supervisor') {
        this.logger.info('Loading app models...');
        this.discoveryAdapter.loadAppModels?.(app);
      }
    });
    app.on('afterDestroy', async (app: Application) => {
      await this.unregisterEnvironment();
    });
    return app;
  }

  async setAppLastSeenAt(appName: string) {
    return this.discoveryAdapter.setAppLastSeenAt(appName);
  }

  async getAppLastSeenAt(appName: string) {
    return this.discoveryAdapter.getAppLastSeenAt(appName);
  }

  async addAppModel(appModel: AppModel) {
    if (typeof this.discoveryAdapter.addAppModel !== 'function') {
      return;
    }
    return this.discoveryAdapter.addAppModel(appModel);
  }

  async getAppModel(appName: string) {
    return this.discoveryAdapter.getAppModel(appName);
  }

  async removeAppModel(appName: string) {
    if (typeof this.discoveryAdapter.removeAppModel !== 'function') {
      return;
    }
    return this.discoveryAdapter.removeAppModel(appName);
  }

  async getAppNameByCName(cname: string) {
    if (typeof this.discoveryAdapter.getAppNameByCName !== 'function') {
      return null;
    }
    return this.discoveryAdapter.getAppNameByCName(cname);
  }

  async addAutoStartApps(environmentName: string, appNames: string[]) {
    if (typeof this.discoveryAdapter.addAutoStartApps !== 'function') {
      return;
    }
    return this.discoveryAdapter.addAutoStartApps(environmentName, appNames);
  }

  async getAutoStartApps() {
    if (typeof this.discoveryAdapter.getAutoStartApps === 'function') {
      return this.discoveryAdapter.getAutoStartApps(this.environmentName);
    }
    return [];
  }

  async removeAutoStartApps(environmentName: string, appNames: string[]) {
    if (typeof this.discoveryAdapter.addAutoStartApps !== 'function') {
      return;
    }
    return this.discoveryAdapter.removeAutoStartApps(environmentName, appNames);
  }

  addApp(app: Application) {
    this.processAdapter.addApp(app);
    this.bindAppEvents(app);
    this.emit('afterAppAdded', app);
    return app;
  }

  async getApp(appName: string, options: GetAppOptions = {}) {
    return this.processAdapter.getApp(appName, options);
  }

  hasApp(appName: string) {
    return this.processAdapter.hasApp(appName);
  }

  async createApp(
    options: {
      appModel: AppModel;
      mainApp?: Application;
      transaction?: Transaction;
    },
    context?: { requestId: string },
  ) {
    await this.processAdapter.createApp(options, context);
  }

  async startApp(appName: string, context?: { requestId: string }) {
    await this.processAdapter.startApp(appName, context);
  }

  async stopApp(appName: string, context?: { requestId: string }) {
    await this.processAdapter.stopApp(appName, context);
  }

  async removeApp(appName: string, context?: { requestId: string }) {
    await this.processAdapter.removeApp(appName, context);
  }

  async upgradeApp(appName: string, context?: { requestId: string }) {
    await this.processAdapter.upgradeApp(appName, context);
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

  async proxyWeb(appName: string, req: IncomingMessage, res: ServerResponse) {
    if (process.env.APP_MODE !== 'supervisor') {
      return false;
    }
    if (typeof this.discoveryAdapter.proxyWeb !== 'function') {
      return false;
    }
    return this.discoveryAdapter.proxyWeb(appName, req, res);
  }

  async proxyWs(req: IncomingMessage, socket: any, head: Buffer) {
    if (process.env.APP_MODE !== 'supervisor') {
      return false;
    }
    if (typeof this.discoveryAdapter.proxyWs !== 'function') {
      return false;
    }
    return this.discoveryAdapter.proxyWs(req, socket, head);
  }

  async registerEnvironment(mainApp: Application) {
    if (!this.environmentName || typeof this.discoveryAdapter.registerEnvironment !== 'function') {
      return;
    }
    const registered = await this.discoveryAdapter.registerEnvironment({
      name: this.environmentName,
      url: this.environmentUrl || '',
      proxyUrl: this.environmentProxyUrl || this.environmentUrl || '',
      appVersion: mainApp.getPackageVersion(),
      lastHeartbeatAt: Date.now(),
    });
    if (registered) {
      this.heartbeatEnvironment();
    }
  }

  async unregisterEnvironment() {
    if (this.environmentName && typeof this.discoveryAdapter.unregisterEnvironment === 'function') {
      await this.discoveryAdapter.unregisterEnvironment();
    }
    if (this.environmentHeartbeatTimer) {
      this.environmentHeartbeatTimer = null;
    }
  }

  private normalizeEnvInfo(environment: EnvironmentInfo): EnvironmentInfo {
    if (typeof environment.available === 'boolean') {
      return environment;
    }
    const lastHeartbeatAt = environment.lastHeartbeatAt;
    if (!Number.isFinite(lastHeartbeatAt) || lastHeartbeatAt <= 0) {
      return {
        ...environment,
        available: false,
      };
    }
    const available = Date.now() - lastHeartbeatAt <= this.environmentHeartbeatInterval;
    return {
      ...environment,
      available,
    };
  }

  async listEnvironments() {
    if (typeof this.discoveryAdapter.listEnvironments !== 'function') {
      return [] as EnvironmentInfo[];
    }

    const environments = await this.discoveryAdapter.listEnvironments();
    return environments.map((env) => this.normalizeEnvInfo(env));
  }

  async getEnvironment(environmentName: string) {
    if (typeof this.discoveryAdapter.getEnvironment !== 'function') {
      return null;
    }

    const environment = await this.discoveryAdapter.getEnvironment(environmentName);
    if (!environment) {
      return null;
    }
    return this.normalizeEnvInfo(environment);
  }

  async heartbeatEnvironment() {
    if (typeof this.discoveryAdapter.heartbeatEnvironment !== 'function') {
      return;
    }
    if (this.environmentHeartbeatTimer) {
      return;
    }
    this.environmentHeartbeatTimer = setInterval(
      () => this.discoveryAdapter.heartbeatEnvironment(),
      this.environmentHeartbeatInterval,
    );
  }

  async dispatchCommand(command: ProcessCommand) {
    return this.commandAdapter?.dispatchCommand(command);
  }

  registerCommandHandler(mainApp: Application) {
    this.commandAdapter?.registerCommandHandler(mainApp);
  }

  async sendSyncMessage(
    mainApp: Application,
    message: { type: string; appName: string },
    options?: PubSubManagerPublishOptions & Transactionable,
  ) {
    await mainApp.syncMessageManager.publish('app_supervisor:sync', message, options);
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
    app.on('afterDestroy', async () => {
      delete this.apps[app.name];
      delete this.appStatus[app.name];
      delete this.appErrors[app.name];
      delete this.lastMaintainingMessage[app.name];
      delete this.statusBeforeCommanding[app.name];
      this.lastSeenAt.delete(app.name);
      await this.clearAppStatus(app.name);
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
  AppCommandAdapter,
  AppStatus,
  ProcessCommand,
  EnvironmentInfo,
  GetAppOptions,
  AppDbCreator,
  AppOptionsFactory,
  AppModel,
  AppModelOptions,
  BootstrapLock,
} from './types';
export { MainOnlyAdapter } from './main-only-adapter';
