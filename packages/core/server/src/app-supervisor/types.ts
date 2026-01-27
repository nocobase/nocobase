/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IDatabaseOptions, Transaction, Transactionable } from '@nocobase/database';
import type Application from '../application';
import type { AppSupervisor } from './index';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Options accepted by discovery adapter when loading an application.
 */
export type GetAppOptions = {
  withOutBootStrap?: boolean;
  [key: string]: any;
};

/**
 * Parameters supplied to a bootstrapper when a sub-application is being started.
 */
export type BootOptions = {
  appName: string;
  options: Record<string, any>;
  appSupervisor: AppSupervisor;
};

/**
 * Callback used by process adapters to lazily initialize applications.
 */
export type AppBootstrapper = (bootOptions: BootOptions) => Promise<void>;

/**
 * All supported lifecycle states of a managed application.
 */
export type AppStatus =
  | 'preparing'
  | 'initializing'
  | 'initialized'
  | 'running'
  | 'commanding'
  | 'stopped'
  | 'error'
  | 'not_found';

/**
 * Metadata representing a deployable environment (container, pod, VM, etc.).
 */
export type EnvironmentInfo = {
  name: string;
  url?: string;
  proxyUrl?: string;
  available?: boolean;
  appVersion?: string;
  lastHeartbeatAt?: number;
};

export type BootstrapLock = {
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
};

export type AppModelOptions = {
  dbConnType?: 'new_database' | 'new_connection' | 'new_schema' | string;
  database?: IDatabaseOptions;
  [key: string]: any;
};

export type AppModel = {
  name: string;
  cname?: string;
  environment?: string;
  environments?: string[];
  options: AppModelOptions;
};

export type ProcessCommand = {
  requestId: string;
  appName: string;
  action: 'create' | 'start' | 'stop' | 'remove' | string;
  environments: string[];
  payload?: Record<string, any>;
};

export type AppDbCreatorOptions = Transactionable & {
  app: Application;
  appOptions: AppModelOptions;
};
export type AppDbCreator = (options: AppDbCreatorOptions) => Promise<void>;
export type AppOptionsFactory = (appName: string, mainApp: Application, options?: AppModelOptions) => any;

/**
 * Abstraction for discovering applications across deployment environments.
 */
export type AppStatusesResult = Record<string, AppStatus | Record<string, AppStatus> | null>;

export interface AppDiscoveryAdapter {
  readonly name: string;
  readonly environmentName?: string;
  readonly environmentUrl?: string;
  readonly environmentProxyUrl?: string;
  readonly appStatus?: Record<string, AppStatus>;
  readonly lastSeenAt?: Map<string, number>;

  /**
   * Update the "last seen at" timestamp for an application.
   */
  setAppLastSeenAt(appName: string): void | Promise<void>;
  getAppLastSeenAt(appName: string): number | null | Promise<number | null>;

  /**
   * Read the cached lifecycle status for a given application.
   */
  getAppStatus(appName: string, defaultStatus?: AppStatus): Promise<AppStatus | null> | AppStatus | null;

  /**
   * Persist an application's lifecycle status back to the discovery backend.
   */
  setAppStatus(appName: string, status: AppStatus, options?: Record<string, any>): void | Promise<void>;
  clearAppStatus?(appName: string): void | Promise<void>;

  loadAppModels?(mainApp: Application): Promise<void>;
  getAppsStatuses?(appNames?: string[]): Promise<AppStatusesResult> | AppStatusesResult;

  addAutoStartApps?(environmentName: string, appName: string[]): Promise<void>;
  getAutoStartApps?(environmentName: string): Promise<string[]>;
  removeAutoStartApps?(environmentName: string, appNames: string[]): Promise<void>;
  addAppModel?(appModel: AppModel): Promise<void>;
  getAppModel?(appName: string): Promise<AppModel>;
  removeAppModel?(appName: string): Promise<void>;
  getAppNameByCName?(cname: string): Promise<string | null>;
  registerEnvironment?(environment: EnvironmentInfo): Promise<boolean>;
  unregisterEnvironment?(): Promise<void>;
  listEnvironments?(): Promise<EnvironmentInfo[]>;
  getEnvironment?(environmentName: string): Promise<EnvironmentInfo | null>;
  heartbeatEnvironment?(): Promise<void>;
  getBootstrapLock?(appName: string): Promise<BootstrapLock | null> | BootstrapLock | null;

  proxyWeb?(appName: string, req: IncomingMessage, res: ServerResponse): Promise<boolean>;
  proxyWs?(req: IncomingMessage, socket: any, head: Buffer): Promise<boolean>;

  dispose?(): Promise<void>;
}

export interface AppProcessAdapter {
  readonly name: string;

  readonly apps?: Record<string, Application>;
  readonly appErrors?: Record<string, Error>;
  readonly lastMaintainingMessage?: Record<string, string>;
  readonly statusBeforeCommanding?: Record<string, AppStatus>;

  // Add app instance to supervisor
  addApp(app: Application): void;
  // Get app instance from supervisor
  getApp(appName: string, options?: GetAppOptions): Promise<Application>;
  // Check whether app instance exists in supervisor
  hasApp(appName: string): boolean;
  bootstrapApp(appName: string): Promise<void>;
  // Return all currently managed application instances.
  getApps?(): Application[];
  // Create a new app, perparing database, install app
  createApp?(
    options: {
      appModel: AppModel;
      mainApp?: Application;
      transaction?: Transaction;
    },
    context?: { requestId: string },
  ): Promise<void>;
  startApp?(appName: string, context?: { requestId: string }): Promise<void>;
  stopApp?(appName: string, context?: { requestId: string }): Promise<void>;
  removeApp?(appName: string, context?: { requestId: string }): Promise<void>;
  upgradeApp?(appName: string, context?: { requestId: string }): Promise<void>;
  // remove all apps in supervisor
  removeAllApps?(): Promise<void>;

  setAppError?(appName: string, error: Error): void;
  hasAppError?(appName: string): boolean;
  clearAppError?(appName: string): void;
}

export interface AppCommandAdapter {
  dispatchCommand(command: ProcessCommand): Promise<void>;
  registerCommandHandler(mainApp: Application): void;
  dispose?(): Promise<void>;
}
