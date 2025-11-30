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

  /**
   * Resolve an application's configuration/state from the discovery backend.
   */
  getApp(appName: string, options?: GetAppOptions): Promise<Application>;

  /**
   * Enumerate all known application names tracked by the discovery backend.
   */
  getAppsNames(): Promise<string[]>;

  /**
   * Update the "last seen" timestamp for an application.
   */
  touchApp(appName: string): void | Promise<void>;

  /**
   * Read the cached lifecycle status for a given application.
   */
  getAppStatus(appName: string, defaultStatus?: AppStatus): Promise<AppStatus | null> | AppStatus | null;

  /**
   * Persist an application's lifecycle status back to the discovery backend.
   */
  setAppStatus(appName: string, status: AppStatus, options?: Record<string, any>): void | Promise<void>;

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

  readonly apps?: Record<string, Application>;
  readonly appStatus?: Record<string, AppStatus>;
  readonly appErrors?: Record<string, Error>;
  readonly lastSeenAt?: Map<string, number>;
  readonly lastMaintainingMessage?: Record<string, string>;
  readonly statusBeforeCommanding?: Record<string, AppStatus>;

  /**
   * Return all currently managed sub-application instances.
   */
  subApps(): Application[];
  setAppBootstrapper(appBootstrapper: AppBootstrapper): void;
  bootStrapApp(appName: string, options?: Record<string, any>): Promise<void>;
  addApp(app: Application): Application;
  hasApp(appName: string): boolean;
  startApp(appName: string): Promise<void>;
  stopApp(appName: string): Promise<void>;
  removeApp(appName: string): Promise<void>;
  reset(): Promise<void>;

  setAppError(appName: string, error: Error): void;
  hasAppError(appName: string): boolean;
  clearAppError(appName: string): void;

  /**
   * Allow the adapter to expose a remote control surface (e.g. HTTP routes, message queues).
   */
  registerCommandHandler?(app: Application): Promise<void>;

  /**
   * Send a lifecycle command to a remote worker/environment. Returns true if the command was handled remotely.
   */
  dispatchCommand?(command: ProcessCommand): Promise<boolean>;

  /**
   * Whether this adapter expects lifecycle changes to be dispatched remotely instead of executed locally.
   */
  supportsRemoteCommands?: boolean;
}

export type ProcessCommand = {
  appName: string;
  action: 'add' | 'start' | 'stop' | 'remove' | string;
  environment?: string;
  payload?: Record<string, any>;
  requestId?: string;
};
