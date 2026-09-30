import type { AppRuntimeLogging } from '../logging/config.js';
import type {
  ServiceContainer,
  ServiceProviderLifecycle,
} from '@nocobase/service-provider';
import type { Hono } from 'hono';
import type { AppConfigAccessor } from '../config/index.js';
import type { LocalesContribution } from '@nocobase/i18n';

import type { AppPaths } from '../config/index.js';
import type { AppRouteContribution } from '../router/index.js';

export interface AppPluginApplication<TConfig = object> {
  readonly runtimeLogging?: AppRuntimeLogging;
  /** Where console log records go; set by a command-line host to `stderr`. */
  readonly consoleLogStream?: 'stdout' | 'stderr';
  readonly strictStartup?: boolean;
  readonly appName: string;
  /**
   * Whether this app owns the process it runs in, or is one of several an
   * app host mounted. Optional so an app composed by hand need not state it,
   * and absent means embedded, matching what `Application` itself defaults to.
   */
  readonly mode?: 'standalone' | 'embedded';
  readonly publicBasePath: string;
  readonly config: AppConfigAccessor & Partial<Record<never, TConfig>>;
  readonly paths: AppPaths;
  readonly router: Hono;
  readonly container: ServiceContainer;
}

export interface AppPluginProviderConstructor<TConfig = object> {
  new (app: AppPluginApplication): ServiceProviderLifecycle;
  readonly __config?: TConfig;
}

export interface AppServerPluginDatabaseContribution {
  readonly migrations?: string;
  readonly seeds?: string;
}

export interface AppServerPluginQueueContribution {
  readonly jobs?: readonly string[];
}

/** The module a plugin's `locales/index.ts` exports, or a function importing it. */
export type AppServerPluginLocales = LocalesContribution;

/** @deprecated Use {@link AppServerPluginLocales}; `locales` now also accepts the module itself. */
export type AppServerPluginLocalesLoader = AppServerPluginLocales;

export interface AppServerPluginDefinition<TConfig = object> {
  readonly packageName: string;
  /** Absolute base directory for plugin-local contribution paths. */
  readonly baseDir: string;
  readonly serviceProviders?: readonly AppPluginProviderConstructor<TConfig>[];
  readonly routes?: readonly AppRouteContribution<AppPluginApplication>[];
  readonly database?: AppServerPluginDatabaseContribution;
  readonly queue?: AppServerPluginQueueContribution;
  readonly locales?: AppServerPluginLocales;
}

export interface AppServerPlugin<TConfig = object> {
  readonly packageName: string;
  /** Absolute base directory for plugin-local contribution paths. */
  readonly baseDir: string;
  readonly serviceProviders: readonly AppPluginProviderConstructor<TConfig>[];
  readonly routes: readonly AppRouteContribution<AppPluginApplication>[];
  readonly database?: AppServerPluginDatabaseContribution;
  readonly queue?: AppServerPluginQueueContribution;
  readonly locales?: AppServerPluginLocales;
  readonly __config?: TConfig;
}

export interface AppServerPlugins {
  readonly plugins: readonly AppServerPlugin[];
}

export interface ResolvedAppPlugin {
  readonly packageName: string;
  /** Absolute base directory for plugin-local contribution paths. */
  readonly baseDir: string;
  readonly version: string;
  readonly rootDir: string;
  readonly migrationsDirectory?: string;
  readonly seedsDirectory?: string;
  readonly jobLocations: readonly string[];
}

export interface ResolvedAppServerPlugin {
  readonly definition: AppServerPlugin;
  readonly metadata: ResolvedAppPlugin;
}

export interface ResolvedAppServerPlugins {
  readonly appPackageName: string;
  readonly plugins: readonly ResolvedAppServerPlugin[];
}
