import { resolveDatabaseConfig } from '../database/resolve-config.js';
import type { AppDatabaseConfig } from '../database/types.js';
import type { AppConfigFactory } from '../config/index.js';
import type { ConfigMap } from '@nocobase/config';
import { AppConfig } from '../config/index.js';

import type {
  Application,
  ApplicationServiceProviderConstructor,
} from '../application/index.js';
import {
  createConfigContext,
  createAppPaths,
  type ConfigContext,
  type AppPaths,
} from '../config/index.js';
import {
  resolveAppServerPlugins,
  type AppServerPluginLocalesLoader,
  type AppServerPlugins,
  type ResolvedAppServerPlugins,
} from '../plugins/index.js';
import type { AppRouteContribution } from '../router/index.js';
import {
  resolveAppScopeRuntime,
  type ResolvedAppScopeRuntime,
} from './scope.js';
import type { AppPathOptions, AppScope } from './types.js';

export type AppRuntimeConfig = object;

export interface AppRuntimeConfigContext extends ConfigContext {
  readonly mode?: 'standalone' | 'embedded';
  readonly routing?: ResolvedAppScopeRuntime['routing'];
  readonly plugins?: ResolvedAppServerPlugins;
  readonly appPackageName?: string;
  readonly configPath?: string;
}

export interface ResolvedAppRuntimeConfigContext extends AppRuntimeConfigContext {
  readonly mode: 'standalone' | 'embedded';
  readonly routing: ResolvedAppScopeRuntime['routing'];
  readonly plugins: ResolvedAppServerPlugins;
  readonly appPackageName: string;
  readonly configPath: string | undefined;
}

export interface AppRuntimeDefinition {
  /** Standalone deployment root, absolute or relative to the code root; shared by server and CLI. */
  readonly deploymentRootDir?: string;
  /** Application-owned paths, applied consistently to server and CLI resolution. */
  readonly resolvePaths?: (runtime: ResolvedAppScopeRuntime) => AppPathOptions;
  readonly defaultConfigs?: AppConfigFactory<ConfigMap>;
  readonly createAppConfig: (
    context: ResolvedAppRuntimeConfigContext,
  ) => AppConfig;
  readonly plugins: AppServerPlugins;
  readonly serviceProviders: readonly ApplicationServiceProviderConstructor[];
  readonly routes: readonly AppRouteContribution<Application>[];
  readonly locales?: AppServerPluginLocalesLoader;
}

export interface AppRuntimeContext extends ResolvedAppScopeRuntime {
  app?: Application;
  readonly scope: AppScope;
  readonly paths: AppPaths;
  readonly plugins: ResolvedAppServerPlugins;
  readonly serviceProviders: readonly ApplicationServiceProviderConstructor[];
  readonly routes: readonly AppRouteContribution<Application>[];
  readonly config: AppConfig;
  readonly locales?: AppServerPluginLocalesLoader;
}

export type ResolvedAppRuntime = AppRuntimeContext;

export function defineAppRuntime(
  definition: AppRuntimeDefinition,
): AppRuntimeDefinition {
  return Object.freeze({
    ...definition,
    serviceProviders: Object.freeze([...definition.serviceProviders]),
    routes: Object.freeze([...definition.routes]),
  });
}

export async function resolveAppRuntime(
  definition: AppRuntimeDefinition,
  scope: AppScope,
): Promise<ResolvedAppRuntime> {
  const resolved = withStandaloneStorageDir(resolveAppScopeRuntime(scope));
  const base = definition.resolvePaths
    ? { ...resolved, paths: definition.resolvePaths(resolved) }
    : resolved;
  const context = createAppRuntimeConfigContext(definition, scope, base);
  const appConfig = definition.createAppConfig(context);
  await appConfig.loadAll();

  const runtime: AppRuntimeContext = {
    ...base,
    scope,
    paths: context.paths,
    plugins: context.plugins,
    serviceProviders: definition.serviceProviders,
    routes: definition.routes,
    config: appConfig,
    locales: definition.locales,
  };
  if (definition.defaultConfigs) {
    runtime.config.mergeDefaults(definition.defaultConfigs(runtime));
    if (definition.defaultConfigs.sections) {
      runtime.config.defineSections(definition.defaultConfigs.sections);
      await runtime.config.loadSectionEnvironment(context.environment);
    }
  }
  const database = runtime.config.get<AppDatabaseConfig>('database');
  if (database && database.default !== 'none') {
    const resolvedDatabase = await resolveDatabaseConfig(database);
    runtime.config.mergeDefaults({
      database: {
        drivers: resolvedDatabase.drivers,
        connections: Object.fromEntries(
          Object.entries(resolvedDatabase.connections)
            .filter(
              ([name, connection]) =>
                connection.databaseDriver &&
                !database.connections[name].databaseDriver,
            )
            .map(([name, connection]) => [
              name,
              { databaseDriver: connection.databaseDriver },
            ]),
        ),
      },
    });
  }
  return runtime;
}

/**
 * A standalone deployment keeps its data under `APP_STORAGE_DIR` when it is set, so a deployment whose code root is
 * replaced on every release (one release directory per version) keeps one storage directory across them. A relative
 * value resolves from the deployment root, as the default `storage` does. Explicit paths win, and embedded
 * applications always use the volume their host provides.
 */
function withStandaloneStorageDir(
  runtime: ResolvedAppScopeRuntime,
): ResolvedAppScopeRuntime {
  if (runtime.mode !== 'standalone' || runtime.paths.storageDir !== undefined) {
    return runtime;
  }
  const storageDir = runtime.env.APP_STORAGE_DIR?.trim();
  return storageDir
    ? { ...runtime, paths: { ...runtime.paths, storageDir } }
    : runtime;
}

function createAppRuntimeConfigContext(
  definition: AppRuntimeDefinition,
  scope: AppScope,
  runtime: ResolvedAppScopeRuntime,
): ResolvedAppRuntimeConfigContext {
  const paths = createAppPaths(runtime.paths);
  const plugins = resolveAppServerPlugins(paths.rootDir, definition.plugins);

  return {
    ...createConfigContext({ env: runtime.env, paths }),
    mode: runtime.mode,
    routing: runtime.routing,
    plugins,
    appPackageName: plugins.appPackageName,
    configPath: scope.configPath,
  };
}
