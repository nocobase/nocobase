import type { AppRuntimeLogging } from '../logging/config.js';
import { loggingToken } from '../logging/token.js';
import { Hono, type ExecutionContext } from 'hono';
import type { AppConfigAccessor } from '../config/index.js';
import {
  AppConfigInvalidError,
  type AppIdentityConfig,
} from '../config/index.js';

import type { AppPaths } from '../config/index.js';
import {
  apiErrorHandler,
  apiNotFoundHandler,
  type ApiConfig,
  type AppHttpMiddleware,
  installApiLimits,
  type AppRouteContribution,
  requestIdMiddleware,
  toApiError,
  RouterProvider,
  routerToken,
} from '../router/index.js';
import {
  assertNoDuplicateApiRoutes,
  type OwnedApiRouter,
} from '../router/duplicate-routes.js';
import { normalizeBasePath, resolveAppName } from '../support/index.js';
import {
  ServiceContainer,
  type ServiceProviderLifecycle,
  ServiceProviderRegistry,
  type ServiceResolver,
} from '@nocobase/service-provider';
import type { AppWebSocketHandler } from '@nocobase/app-websocket';
import {
  createRealtimeWebSocketHandler,
  registerRealtimeWebSocketRoutes,
} from '../realtime/websocket.js';
import { RealtimeProvider } from '../realtime/provider.js';
import {
  createAppDatabaseTaskContributions,
  type AppServerPluginLocales,
  type ResolvedAppServerPlugins,
} from '../plugins/index.js';
import type { AppDatabaseTaskContributions } from '../database/types.js';
import { resolveLocalesContribution } from '@nocobase/i18n';
import { i18nToken, registerAppLocales } from '../i18n/index.js';

export type ApplicationFetchHandler = (
  request: Request,
  env?: unknown,
  executionContext?: ExecutionContext,
) => Response | Promise<Response>;

export type ApplicationWebSocketFactory = (
  container: ServiceResolver,
) => AppWebSocketHandler;

export type ApplicationConfig = AppConfigAccessor;

export interface ApplicationOptions<
  TConfig extends ApplicationConfig = ApplicationConfig,
> {
  readonly config: TConfig;
  readonly mode?: 'standalone' | 'embedded';
  readonly paths: AppPaths;
  readonly websocket?: ApplicationWebSocketFactory;
  readonly runtimeLogging?: AppRuntimeLogging;
  /** Where console log records go; see `AppScope.consoleLogStream`. */
  readonly consoleLogStream?: 'stdout' | 'stderr';
  readonly strictStartup?: boolean;
}

export type ApplicationServiceProviderConstructor<
  TConfig extends ApplicationConfig = ApplicationConfig,
  TArguments extends readonly unknown[] = [],
> = new (
  app: Application<TConfig>,
  ...args: TArguments
) => ServiceProviderLifecycle;

export interface ApplicationRuntimeContributions<
  TConfig extends ApplicationConfig = ApplicationConfig,
> {
  readonly plugins: ResolvedAppServerPlugins;
  readonly serviceProviders: readonly ApplicationServiceProviderConstructor<TConfig>[];
  readonly routes: readonly AppRouteContribution<Application<TConfig>>[];
  readonly locales?: AppServerPluginLocales;
}

export interface AddRoutesOptions {
  /** Names the contribution, such as a plugin's package name, when start reports a duplicate API route. */
  readonly owner?: string;
}

/**
 * A composed NocoBase server application.
 *
 * The HTTP router is an application service, not the application itself.
 * Application owns its resolved config, paths, service container and provider lifecycle,
 * while fetch and websocket form its framework-neutral host boundary.
 */
export class Application<
  TConfig extends ApplicationConfig = ApplicationConfig,
> {
  public readonly strictStartup: boolean;
  public readonly runtimeLogging: AppRuntimeLogging | undefined;
  public readonly consoleLogStream: 'stdout' | 'stderr' | undefined;
  public readonly config: TConfig;
  public readonly mode: 'standalone' | 'embedded';
  public readonly paths: AppPaths;
  public readonly container: ServiceContainer;
  public readonly fetch: ApplicationFetchHandler = async (
    request,
    env,
    executionContext,
  ) => {
    await this.start();
    return this.router.fetch(request, env, executionContext);
  };
  public readonly websocket: AppWebSocketHandler;

  private readonly providerRegistry: ServiceProviderRegistry =
    new ServiceProviderRegistry();
  private readonly websocketFactory: ApplicationWebSocketFactory;
  private readonly usesDefaultWebSocket: boolean;
  private serviceProvidersRegistered = false;
  private routesRegistered = false;
  private readonly httpMiddleware: AppHttpMiddleware<Application<TConfig>>[] =
    [];
  private readonly routes: {
    readonly contribution: AppRouteContribution<Application<TConfig>>;
    readonly owner: string | undefined;
  }[] = [];
  private startPromise: Promise<void> | undefined;
  private websocketHandler: AppWebSocketHandler | undefined;
  private appPackageName: string | undefined;
  /** Defaults match an application that registered no server plugins. */
  private databaseTaskContributionsValue: AppDatabaseTaskContributions = {
    appPackageName: 'app',
    migrations: [],
    seeds: [],
  };
  private readonly localeContributions: {
    packageName: string;
    locales: AppServerPluginLocales;
  }[] = [];
  private applicationLocales: AppServerPluginLocales | undefined;
  /** Plugins still declaring the removed `queue: { jobs }` contribution. */
  private readonly queueJobPlugins: string[] = [];

  public constructor(options: ApplicationOptions<TConfig>) {
    this.strictStartup = options.strictStartup ?? false;
    this.runtimeLogging = options.runtimeLogging;
    this.consoleLogStream = options.consoleLogStream;
    this.config = options.config;
    this.mode = options.mode ?? 'embedded';
    this.paths = options.paths;
    this.container = new ServiceContainer();
    this.usesDefaultWebSocket = options.websocket === undefined;
    this.websocketFactory = options.websocket ?? createRealtimeWebSocketHandler;
    this.websocket = async (request, env) => {
      await this.start();
      return this.getWebSocketHandler()(request, env);
    };
    this.addServiceProvider(RouterProvider);
    if (this.usesDefaultWebSocket) {
      this.addServiceProvider(RealtimeProvider);
    }
  }

  public get appName(): string {
    return resolveAppName(this.config.get<AppIdentityConfig>('app')!.name);
  }

  public get publicBasePath(): string {
    return normalizeBasePath(
      this.config.get<AppIdentityConfig>('app')!.publicBasePath,
    );
  }

  public get router(): Hono {
    return this.container.resolve(routerToken);
  }

  public addServiceProvider<TArguments extends readonly unknown[]>(
    Provider: ApplicationServiceProviderConstructor<TConfig, TArguments>,
    ...args: TArguments
  ): void {
    this.providerRegistry.add(new Provider(this, ...args));
  }

  public addServiceProviders(
    Providers: readonly ApplicationServiceProviderConstructor<TConfig>[],
  ): void {
    for (const Provider of Providers) {
      this.addServiceProvider(Provider);
    }
  }

  public get databaseTaskContributions(): AppDatabaseTaskContributions {
    return this.databaseTaskContributionsValue;
  }

  public addServerPlugins(serverPlugins: ResolvedAppServerPlugins): void {
    this.appPackageName = serverPlugins.appPackageName;
    this.databaseTaskContributionsValue =
      createAppDatabaseTaskContributions(serverPlugins);
    for (const plugin of serverPlugins.plugins) {
      for (const Provider of plugin.definition.serviceProviders) {
        this.addServiceProvider(Provider);
      }
      for (const routes of plugin.definition.routes) {
        this.addRoutes(routes, { owner: plugin.definition.packageName });
      }
      if (plugin.definition.queue) {
        this.queueJobPlugins.push(plugin.definition.packageName);
      }
      if (plugin.definition.locales) {
        this.localeContributions.push({
          packageName: plugin.definition.packageName,
          locales: plugin.definition.locales,
        });
      }
    }
  }

  public addRuntimeContributions(
    runtime: ApplicationRuntimeContributions<TConfig>,
  ): void {
    this.addServerPlugins(runtime.plugins);
    if (runtime.locales) {
      this.addApplicationLocales(runtime.locales);
    }
    this.addServiceProviders(runtime.serviceProviders);
    for (const routes of runtime.routes) {
      this.addRoutes(routes, {
        owner: this.appPackageName ?? 'the application',
      });
    }
  }

  public addApplicationLocales(locales: AppServerPluginLocales): void {
    this.applicationLocales = locales;
  }

  /**
   * Adds a route contribution. `owner` names what contributed it, such as a plugin's package name, in the error that a
   * duplicate API route raises at start; contributions added without one are named by their position.
   */
  public addRoutes(
    routes: AppRouteContribution<Application<TConfig>>,
    options: AddRoutesOptions = {},
  ): void {
    this.assertRoutesMutable();
    this.routes.push({ contribution: routes, owner: options.owner });
  }

  public addHttpMiddleware(
    middleware: AppHttpMiddleware<Application<TConfig>>,
  ): void {
    this.assertRoutesMutable();
    this.httpMiddleware.push(middleware);
  }

  public registerProviders(): void {
    if (this.serviceProvidersRegistered) {
      return;
    }
    this.providerRegistry.registerAll();
    this.serviceProvidersRegistered = true;
    if (this.usesDefaultWebSocket && this.container.has(routerToken)) {
      registerRealtimeWebSocketRoutes(this.router);
    }
  }

  public start(): Promise<void> {
    this.startPromise ??= this.startServiceProviders();
    return this.startPromise;
  }

  public shutdown(): Promise<void> {
    return this.providerRegistry.shutdown();
  }

  private getWebSocketHandler(): AppWebSocketHandler {
    this.websocketHandler ??= this.websocketFactory(this.container);
    return this.websocketHandler;
  }

  private async startServiceProviders(): Promise<void> {
    await this.validateConfig();
    this.registerProviders();
    this.reportQueueJobPlugins();
    await this.registerLocales();
    await this.providerRegistry.bootAll();
    await this.registerRoutes();
    await this.providerRegistry.startAll();
    await this.providerRegistry.readyAll();
  }

  /** Warns once per plugin whose `queue: { jobs }` contribution is no longer loaded. */
  private reportQueueJobPlugins(): void {
    const logger = this.container.has(loggingToken)
      ? this.container.resolve(loggingToken).getLogger('plugins')
      : undefined;
    for (const packageName of this.queueJobPlugins) {
      const message = `Plugin ${packageName} declares queue.jobs, which is deprecated and ignored: Job modules are no longer discovered. Register queue handlers from a service provider's boot() through queueServiceToken, or move the work to @nocobase/jobs.`;
      if (logger) logger.warn({ packageName }, message);
      else console.warn(message);
    }
  }

  /**
   * Refuses to start on a configuration that breaks a rule its sections declare. It runs here rather than when the
   * runtime is resolved, so commands that only read the configuration, such as `config init` and `config check`, still
   * load it and can report what is wrong.
   */
  private async validateConfig(): Promise<void> {
    const issues = (await this.config.validate?.()) ?? [];
    if (issues.some((issue) => issue.level === 'error')) {
      throw new AppConfigInvalidError(issues);
    }
  }

  /**
   * Registers each plugin's locale loaders against its package name and brings the runtime up.
   *
   * Only the default language is read here; another one is imported the first time a request asks for it.
   */
  private async registerLocales(): Promise<void> {
    if (!this.container.has(i18nToken)) {
      return;
    }

    const runtime = this.container.resolve(i18nToken);
    const sources = [
      ...(this.applicationLocales
        ? [
            {
              packageName: this.appPackageName ?? '',
              locales: this.applicationLocales,
            },
          ]
        : []),
      ...this.localeContributions,
    ];
    const contributions = await Promise.all(
      sources.map(async (contribution) => ({
        packageName: contribution.packageName,
        locales: await resolveLocalesContribution(contribution.locales),
      })),
    );
    await registerAppLocales(runtime, this.appPackageName ?? '', contributions);
  }

  private async registerRoutes(): Promise<void> {
    if (this.routesRegistered) {
      return;
    }

    for (const middleware of this.httpMiddleware) {
      await middleware.register(this.router, this);
    }
    // Every API contribution mounts into one router so `/api` answers errors and unknown paths in the standard error
    // body. It mounts before the root contributions, whose catch-alls (the SPA's `/*`) would otherwise answer an
    // unknown API path with a page.
    const api = new Hono();
    api.use('*', requestIdMiddleware());
    // The `api` section's global limits, each installed only when configured.
    installApiLimits(api, this.config.get<ApiConfig>('api'));
    // The last resort: anything no router recognized is an unexpected failure, answered with an opaque 500.
    api.onError((error, context) =>
      apiErrorHandler(toApiError(error), context),
    );
    const apiRouters: OwnedApiRouter[] = [];
    const roots: Hono[] = [];
    for (const [index, { contribution, owner }] of this.routes.entries()) {
      const router = await contribution.createRouter(this);
      if (contribution.scope === 'api') {
        apiRouters.push({
          owner: owner ?? `route contribution #${index + 1}`,
          router,
        });
      } else roots.push(router);
    }
    // Hono lets the first matching route win without a word, so a second contribution answering the same method and
    // path would be dead code nobody notices. Checked before anything mounts, so a failed start leaves no half-built
    // router behind.
    assertNoDuplicateApiRoutes(apiRouters);
    for (const { router } of apiRouters) api.route('/', router);
    api.all('*', apiNotFoundHandler);
    this.router.route('/api', api);
    for (const router of roots) this.router.route('/', router);
    this.routesRegistered = true;
  }

  private assertRoutesMutable(): void {
    if (this.startPromise || this.routesRegistered) {
      throw new Error('Routes cannot be added after the application starts.');
    }
  }
}
