/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type Application from '../application';
import type { AppSupervisor } from './index';

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
  label?: string;
  metadata?: Record<string, any>;
  lastHeartbeatAt?: number;
};

/**
 * Abstraction for discovering applications across deployment environments.
 */
export interface AppDiscoveryAdapter {
  readonly name: string;
  getApp(appName: string, options?: GetAppOptions): Promise<Application>;
  hasApp(appName: string): boolean;
  getAppsNames(): Promise<string[]>;
  subApps(): Application[];
  touchApp(appName: string): void;
  getAppStatus(appName: string, defaultStatus?: AppStatus): AppStatus | null;
  setAppStatus(appName: string, status: AppStatus, options?: Record<string, any>): void;
  setAppError(appName: string, error: Error): void;
  hasAppError(appName: string): boolean;
  clearAppError(appName: string): void;
  registerEnvironment?(environment: EnvironmentInfo): Promise<void>;
  unregisterEnvironment?(environmentName: string): Promise<void>;
  listEnvironments?(): Promise<EnvironmentInfo[]>;
  getEnvironment?(environmentName: string): Promise<EnvironmentInfo | null>;
  heartbeatEnvironment?(environmentName: string, payload?: Record<string, any>): Promise<void>;
}

/**
 * Adapter responsible for managing the lifecycle of applications within an environment.
 */
export interface AppProcessAdapter {
  readonly name: string;
  setAppBootstrapper(appBootstrapper: AppBootstrapper): void;
  bootStrapApp(appName: string, options?: Record<string, any>): Promise<void>;
  addApp(app: Application): Application;
  startApp(appName: string): Promise<void>;
  stopApp(appName: string): Promise<void>;
  removeApp(appName: string): Promise<void>;
  reset(): Promise<void>;
}
