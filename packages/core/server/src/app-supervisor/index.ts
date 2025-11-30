/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import { EventEmitter } from 'events';
import Application, { ApplicationOptions } from '../application';
import { LegacyMemoryAdapter } from './legacy-memory-adapter';
import type {
  AppBootstrapper,
  AppDiscoveryAdapter,
  AppProcessAdapter,
  AppStatus,
  EnvironmentInfo,
  GetAppOptions,
} from './types';

export type AppDiscoveryAdapterFactory = (context: { supervisor: AppSupervisor }) => AppDiscoveryAdapter;
export type AppProcessAdapterFactory = (context: { supervisor: AppSupervisor }) => AppProcessAdapter;

export class AppSupervisor extends EventEmitter implements AsyncEmitter {
  private static instance: AppSupervisor;
  private static discoveryAdapterFactories: Map<string, AppDiscoveryAdapterFactory> = new Map();
  private static processAdapterFactories: Map<string, AppProcessAdapterFactory> = new Map();
  private static defaultDiscoveryAdapterName = 'legacy-memory';
  private static defaultProcessAdapterName = 'legacy-memory';

  public runningMode: 'single' | 'multiple' = 'multiple';
  public singleAppName: string | null = null;

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  private discoveryAdapter: AppDiscoveryAdapter;
  private processAdapter: AppProcessAdapter;
  private discoveryAdapterName: string;
  private processAdapterName: string;

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
  }

  private resolveDiscoveryAdapterName() {
    return (
      process.env.APP_DISCOVER_ADAPTER || process.env.APP_DISCOVERY_ADAPTER || AppSupervisor.defaultDiscoveryAdapterName
    );
  }

  private resolveProcessAdapterName() {
    return (
      process.env.APP_PROCESS_ADAPTER || process.env.APP_PROCESS_ADPATER || AppSupervisor.defaultProcessAdapterName
    );
  }

  private createDiscoveryAdapter(): AppDiscoveryAdapter {
    const adapterName = this.discoveryAdapterName;
    let factory = AppSupervisor.discoveryAdapterFactories.get(adapterName);

    if (!factory && adapterName !== AppSupervisor.defaultDiscoveryAdapterName) {
      factory = AppSupervisor.discoveryAdapterFactories.get(AppSupervisor.defaultDiscoveryAdapterName);
    }

    if (!factory) {
      throw new Error(`No AppDiscovery adapter available for ${adapterName}`);
    }

    return factory({ supervisor: this });
  }

  private isProcessCapableAdapter(adapter: any): adapter is AppProcessAdapter {
    return (
      adapter &&
      typeof adapter.bootStrapApp === 'function' &&
      typeof adapter.addApp === 'function' &&
      typeof adapter.startApp === 'function'
    );
  }

  private createProcessAdapter(): AppProcessAdapter {
    const adapterName = this.processAdapterName;
    if (adapterName === this.discoveryAdapterName && this.isProcessCapableAdapter(this.discoveryAdapter)) {
      return this.discoveryAdapter;
    }

    let factory = AppSupervisor.processAdapterFactories.get(adapterName);

    if (!factory && adapterName !== AppSupervisor.defaultProcessAdapterName) {
      factory = AppSupervisor.processAdapterFactories.get(AppSupervisor.defaultProcessAdapterName);
    }

    if (!factory) {
      throw new Error(`No AppProcess adapter available for ${adapterName}`);
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

  get apps() {
    const adapter = this.discoveryAdapter as any;
    return adapter?.apps ?? Object.create(null);
  }

  get appStatus() {
    const adapter = this.discoveryAdapter as any;
    return adapter?.appStatus ?? Object.create(null);
  }

  get appErrors() {
    const adapter = this.discoveryAdapter as any;
    return adapter?.appErrors ?? Object.create(null);
  }

  get lastSeenAt() {
    const adapter = this.discoveryAdapter as any;
    return adapter?.lastSeenAt ?? new Map<string, number>();
  }

  get lastMaintainingMessage() {
    const adapter = this.discoveryAdapter as any;
    return adapter?.lastMaintainingMessage ?? Object.create(null);
  }

  get statusBeforeCommanding() {
    const adapter = this.discoveryAdapter as any;
    return adapter?.statusBeforeCommanding ?? Object.create(null);
  }

  setAppBootstrapper(appBootstrapper: AppBootstrapper) {
    this.processAdapter.setAppBootstrapper(appBootstrapper);
  }

  setAppError(appName: string, error: Error) {
    this.discoveryAdapter.setAppError(appName, error);
  }

  hasAppError(appName: string) {
    return this.discoveryAdapter.hasAppError(appName);
  }

  clearAppError(appName: string) {
    this.discoveryAdapter.clearAppError(appName);
  }

  async reset() {
    await this.processAdapter.reset();
    this.removeAllListeners();
  }

  async destroy() {
    await this.reset();
    AppSupervisor.instance = null;
  }

  setAppStatus(appName: string, status: AppStatus, options = {}) {
    this.discoveryAdapter.setAppStatus(appName, status, options);
  }

  async getApp(appName: string, options: GetAppOptions = {}) {
    return this.discoveryAdapter.getApp(appName, options);
  }

  getAppStatus(appName: string, defaultStatus?: AppStatus) {
    return this.discoveryAdapter.getAppStatus(appName, defaultStatus);
  }

  bootMainApp(options: ApplicationOptions) {
    return new Application(options);
  }

  hasApp(appName: string) {
    return this.discoveryAdapter.hasApp(appName);
  }

  touchApp(appName: string) {
    this.discoveryAdapter.touchApp(appName);
  }

  addApp(app: Application) {
    return this.processAdapter.addApp(app);
  }

  async getAppsNames() {
    return this.discoveryAdapter.getAppsNames();
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

  subApps() {
    return this.discoveryAdapter.subApps();
  }

  async bootStrapApp(appName: string, options = {}) {
    await this.processAdapter.bootStrapApp(appName, options);
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
}

applyMixins(AppSupervisor, [AsyncEmitter]);

AppSupervisor.registerDiscoveryAdapter('legacy-memory', ({ supervisor }) => new LegacyMemoryAdapter(supervisor));
AppSupervisor.registerProcessAdapter('legacy-memory', ({ supervisor }) => new LegacyMemoryAdapter(supervisor));

export type {
  AppBootstrapper,
  AppDiscoveryAdapter,
  AppProcessAdapter,
  AppStatus,
  EnvironmentInfo,
  GetAppOptions,
} from './types';
