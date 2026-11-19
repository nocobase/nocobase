import { findApplicationNotConfigured } from '../config/not-configured.js';
import { findAppConfigInvalid } from '../config/validation.js';
import { formatNotConfigured } from './not-configured-message.js';
import { loggingToken } from '../logging/token.js';
import type { Application } from '../application/index.js';
import { NodeServerProxy, type NodeServerProxyOptions } from './proxy.js';
import {
  resolveAppRuntime,
  type AppRuntimeDefinition,
  type ResolvedAppRuntime,
} from '../runtime/definition.js';
import type { NodeServerConfig } from './config.js';
import { createPublicBasePathAdapter } from '../runtime/mount.js';
import type { AppScope } from '../runtime/types.js';
import {
  createStandaloneScope,
  type CreateStandaloneScopeOptions,
  type StandaloneAppScope,
} from './scope.js';
import {
  resolveNodeShutdownTimeouts,
  type ClosableNodeAppServer,
  type NodeShutdownOptions,
  disposeAfterStartupFailure,
  startNodeAppServer,
  watchStartupShutdownSignals,
} from './server.js';

export type CreateStandaloneRuntimeScopeOptions = CreateStandaloneScopeOptions;

export interface StandaloneServerListenOptions {
  readonly hostname: string;
  readonly port: number;
  readonly startLog: boolean;
}

export interface StandaloneServer extends ClosableNodeAppServer {
  readonly application: Application;
  readonly listenOptions: StandaloneServerListenOptions;
  /** Shutdown budget resolved from the environment; empty keeps the defaults. */
  readonly shutdownOptions: NodeShutdownOptions;
  readonly signal: AbortSignal;
}

export type StandaloneServerFactory = (scope: AppScope) => Promise<Application>;

export interface StandaloneApplicationDefinition {
  readonly rootDir: string;
  readonly appRuntime: AppRuntimeDefinition;
  readonly createServer: StandaloneServerFactory;
  /** Configure listener-level forwarding after the application has started. */
  readonly proxy?: (context: {
    readonly application: Application;
  }) => NodeServerProxyOptions;
}

export type StandaloneServerOptions = CreateStandaloneRuntimeScopeOptions & {
  readonly viteDevUrl?: string | false;
};

export type CreateStandaloneServerOptions = StandaloneApplicationDefinition &
  StandaloneServerOptions;

export interface DefinedStandaloneServer {
  readonly create: (
    options?: StandaloneServerOptions,
  ) => Promise<StandaloneServer>;
  readonly start: (options?: StandaloneServerOptions) => void;
}

export async function createStandaloneServer(
  options: CreateStandaloneServerOptions,
): Promise<StandaloneServer> {
  const {
    appRuntime,
    createServer,
    proxy: configureProxy,
    ...serverOptions
  } = options;
  const scope = createStandaloneRuntimeScope(
    resolveStandaloneServerScopeOptions({
      ...serverOptions,
      deploymentRootDir:
        serverOptions.deploymentRootDir ?? appRuntime.deploymentRootDir,
    }),
  );

  try {
    const application = await createServer(scope);
    const mounted = createPublicBasePathAdapter(
      application,
      application.publicBasePath,
    );
    const proxy = configureProxy
      ? new NodeServerProxy(configureProxy({ application }))
      : undefined;
    if (proxy) scope.registerDisposer('standalone-proxy', () => proxy.close());
    const serverConfigValue = application.config.get<NodeServerConfig>(
      'server',
    ) ?? { host: '127.0.0.1', port: 13000, startLog: true };
    const listenOptions: StandaloneServerListenOptions = {
      hostname: serverConfigValue.host,
      port: serverConfigValue.port,
      startLog: serverConfigValue.startLog,
    };
    const server: StandaloneServer = {
      application,
      shutdownOptions: resolveNodeShutdownTimeouts(scope.env),
      close: (): Promise<void> => scope.destroy(),
      fetch: (request, env, executionContext) =>
        proxy?.matches(new URL(request.url).pathname)
          ? proxy.fetch(request)
          : mounted.fetch(request, env, executionContext),
      proxy,
      listenOptions,
      signal: scope.signal,
    };

    if (mounted.websocket) {
      server.websocket = mounted.websocket;
    }

    return server;
  } catch (error) {
    return disposeAfterStartupFailure(() => scope.destroy(), error);
  }
}

export function startServer(options: CreateStandaloneServerOptions): void {
  const strictStartup =
    createStandaloneRuntimeScope({
      ...options,
      deploymentRootDir:
        options.deploymentRootDir ?? options.appRuntime.deploymentRootDir,
    }).env.NOCOBASE_STRICT_STARTUP === 'true';
  const startPromise = startStandaloneServer(options);
  startPromise.catch((error) => {
    // An unconfigured or misconfigured application gets its instruction without a stack trace; anything else is
    // printed whole.
    const notConfigured = findApplicationNotConfigured(error);
    const invalid = notConfigured ? undefined : findAppConfigInvalid(error);
    console.error(
      notConfigured
        ? formatNotConfigured(notConfigured)
        : invalid
          ? invalid.message
          : error,
    );
    process.exitCode = 1;
    // Startup has already disposed the scope. Do not retain leaked handles.
    if (strictStartup) process.exit(1);
  });
}

export function defineStandaloneServer(
  definition: StandaloneApplicationDefinition,
): DefinedStandaloneServer {
  return {
    create: (
      options: StandaloneServerOptions = {},
    ): Promise<StandaloneServer> =>
      createStandaloneServer({
        ...options,
        ...definition,
        rootDir: options.rootDir ?? definition.rootDir,
      }),
    start: (options: StandaloneServerOptions = {}): void => {
      startServer({
        ...options,
        ...definition,
        rootDir: options.rootDir ?? definition.rootDir,
      });
    },
  };
}

export function createStandaloneRuntimeScope(
  options: CreateStandaloneRuntimeScopeOptions,
): StandaloneAppScope {
  return createStandaloneScope(options);
}

export async function resolveStandaloneAppRuntime(
  definition: AppRuntimeDefinition,
  options: CreateStandaloneRuntimeScopeOptions & {
    prepareDatabaseDrivers?: boolean;
  },
): Promise<ResolvedAppRuntime & { readonly scope: StandaloneAppScope }> {
  const scope = createStandaloneRuntimeScope({
    ...options,
    deploymentRootDir:
      options.deploymentRootDir ?? definition.deploymentRootDir,
  });
  try {
    const runtime = await resolveAppRuntime(definition, scope, options);
    return Object.assign(runtime, { scope });
  } catch (error) {
    return disposeAfterStartupFailure(() => scope.destroy(), error);
  }
}

async function startStandaloneServer(
  options: CreateStandaloneServerOptions,
): Promise<void> {
  // Startup runs migrations and seeds under a task lock before the HTTP server
  // registers its own handlers, so the signals are watched from here until it
  // does. A restart that arrives mid-startup then shuts down cleanly instead
  // of leaving the lock held by a process that no longer exists.
  const startupSignals = watchStartupShutdownSignals();
  let app: StandaloneServer;
  try {
    app = await createStandaloneServer(options);
  } catch (error) {
    startupSignals.dispose();
    throw error;
  }

  const logger = app.application.container.has(loggingToken)
    ? app.application.container.resolve(loggingToken).getLogger('server')
    : undefined;

  const startupSignal = startupSignals.received();
  if (startupSignal) {
    startupSignals.dispose();
    const message = `Startup completed after ${startupSignal}; shutting down without listening.`;
    if (logger) logger.info(message);
    else console.log(message);
    await app.close();
    return;
  }

  try {
    await startNodeAppServer(app, {
      ...(logger
        ? {
            logger: {
              error: (message: string, err?: unknown) =>
                logger.error({ err }, message),
            },
          }
        : {}),
      ...app.shutdownOptions,
      hostname: app.listenOptions.hostname,
      port: app.listenOptions.port,
      onListen: (info): void => {
        if (!app.listenOptions.startLog) {
          return;
        }

        const message = `App server listening on http://${info.address}:${info.port}`;
        if (logger) logger.info(message);
        else console.log(message);
      },
    });
  } catch (error) {
    await disposeAfterStartupFailure(() => app.close(), error);
  } finally {
    startupSignals.dispose();
  }
}

function resolveStandaloneServerScopeOptions(
  options: StandaloneServerOptions,
): CreateStandaloneRuntimeScopeOptions {
  const { viteDevUrl, ...scopeOptions } = options;
  if (viteDevUrl === undefined) {
    return scopeOptions;
  }

  return {
    ...scopeOptions,
    env: {
      ...scopeOptions.env,
      APP_VITE_DEV_URL: viteDevUrl === false ? 'false' : viteDevUrl,
    },
  };
}
