export { defineServerPlugin, defineServerPlugins } from './define.js';
export {
  inspectResolvedAppServerPlugins,
  type AppServerDatabaseSnapshot,
  type AppServerInspectionIssue,
  type AppServerInspectionSnapshot,
  type AppServerJobsSnapshot,
  type AppServerPluginSnapshot,
  type AppServerProviderSnapshot,
  type AppServerRouteSnapshot,
} from './inspect.js';
export {
  createAppDatabaseTaskContributions,
  createPluginJobLocations,
  createPluginMigrationSources,
  createPluginSeedSources,
  resolveAppServerPlugins,
  type ResolveAppServerPluginsOptions,
} from './resolve.js';
export {
  classifyPluginRegistration,
  type PluginRegistrationFacts,
  type PluginRegistrationIssue,
  type PluginRegistrationIssueCode,
  type PluginRegistrationState,
  type PluginRegistrationStateName,
  type PluginRegistrationSurfaces,
} from './registration-state.js';
export type * from './types.js';

import type { Hono } from 'hono';
import type { AppPaths } from '../config/types.js';

export interface AppPluginRoutesContext<
  TDeps = unknown,
  TServices = unknown,
  TConfig = unknown,
> {
  readonly app: Hono;
  readonly config: TConfig;
  readonly deps: TDeps;
  readonly services: TServices;
  readonly paths: AppPaths;
}

export type AppPluginDisposer = () => void | Promise<void>;

export interface AppPluginLifecycle {
  registerDisposer(name: string, dispose: AppPluginDisposer): void;
}

export interface AppPluginServerContext<
  TDeps = unknown,
  TServices = unknown,
  TConfig = unknown,
> {
  readonly config: TConfig;
  readonly deps: TDeps;
  readonly services: TServices;
  readonly lifecycle: AppPluginLifecycle;
  readonly paths: AppPaths;
}

export type AppPluginBootstrap<
  TDeps = unknown,
  TServices = unknown,
  TConfig = unknown,
> = (context: AppPluginServerContext<TDeps, TServices, TConfig>) => void;

export type AppPluginRoutesRegistrar<
  TDeps = unknown,
  TServices = unknown,
  TConfig = unknown,
> = (context: AppPluginRoutesContext<TDeps, TServices, TConfig>) => void;
