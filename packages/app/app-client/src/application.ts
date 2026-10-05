import {
  applyDocumentLocale,
  createRefineI18nProvider,
} from '@nocobase/i18n/client';
import { createApiClient, type ApiClient } from '@nocobase/api-client';
import {
  createRealtimeClient,
  type RealtimeClient,
} from '@nocobase/realtime/client';
import {
  createServiceToken,
  ServiceContainer,
  ServiceProvider,
  ServiceProviderRegistry,
  type ServiceProviderLifecycle,
  type ServiceResolver,
  type ServiceToken,
} from '@nocobase/service-provider';

import { resolveAppUrl } from './client.js';
import type {
  AppClientConfig,
  AppClientRefineConfig,
  AppClientRenderConfig,
} from './config.js';
import type {
  AppClientRefineRegistry,
  AppClientRegisteredServiceProvider,
  ClientServiceProviderContext,
} from './plugins.js';
import type { AppRuntimeContext } from './runtime/index.js';
import {
  createRefineConfigCollector,
  type AppClientRefineConfigCollector,
} from './runtime/refine-config-collector.js';

export const apiClientToken: ServiceToken<ApiClient> =
  createServiceToken<ApiClient>('@nocobase/app-client/api-client');

export const realtimeClientToken: ServiceToken<RealtimeClient> =
  createServiceToken<RealtimeClient>('@nocobase/app-client/realtime-client');

export type ClientApplicationRenderConfigFactory = (
  app: ClientApplication,
) => AppClientRenderConfig;

export interface ClientApplicationOptions {
  readonly runtime: AppRuntimeContext;
  readonly createRenderConfig: ClientApplicationRenderConfigFactory;
  /**
   * What the API client sends its requests through; the global `fetch` when omitted. A test hands it a server it runs
   * in process, so the pages under test talk to a real server without one listening.
   */
  readonly fetch?: typeof globalThis.fetch;
}

type ClientApplicationState =
  'created' | 'starting' | 'started' | 'failed' | 'shutting-down' | 'shutdown';

class CoreClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-client/core';

  public constructor(
    app: ClientApplication,
    private readonly fetch: typeof globalThis.fetch | undefined,
  ) {
    super(app);
  }

  private readonly synchronizeDocumentLocale = (): void =>
    applyDocumentLocale(this.app.runtime.i18n);

  public override register(): void {
    this.app.container.singleton(apiClientToken, (): ApiClient => {
      const baseURL = this.app.config.get<string>('api.baseURL');
      const i18n = this.app.runtime.i18n;
      return createApiClient({
        baseURL: baseURL ?? resolveAppUrl('/api'),
        ...(this.fetch ? { fetch: this.fetch } : {}),
        // The application keeps its language in the browser, so the server can
        // only learn it from the request. Resolved per request rather than
        // captured once, so subsequent requests use the current language.
        headers: () => ({ 'Accept-Language': i18n.getLocale() }),
      });
    });
    this.app.container.singleton(realtimeClientToken, (): RealtimeClient =>
      createRealtimeClient({
        resolveUrl: () => {
          const realtimeURL = this.app.config.get<string>('api.realtimeURL');
          const baseURL =
            this.app.config.get<string>('api.baseURL') ?? resolveAppUrl('/api');
          return realtimeURL ?? `${baseURL.replace(/\/+$/u, '')}/../ws`;
        },
      }),
    );
  }

  public override start(): Promise<void> {
    this.synchronizeDocumentLocale();
    this.app.runtime.i18n.i18n.on(
      'languageChanged',
      this.synchronizeDocumentLocale,
    );
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.app.runtime.i18n.i18n.off(
      'languageChanged',
      this.synchronizeDocumentLocale,
    );
    this.app.container.resolveIfCreated(realtimeClientToken)?.close();
    return Promise.resolve();
  }
}

class ContextualServiceProvider implements ServiceProviderLifecycle {
  public readonly name: string;

  public constructor(
    private readonly app: ClientApplication,
    private readonly provider: ServiceProviderLifecycle,
    private readonly context: ClientServiceProviderContext,
  ) {
    this.name = provider.name;
  }

  public register(): void {
    this.app.runWithProviderContext(this.context, (): void =>
      this.provider.register(),
    );
  }

  public boot(): Promise<void> {
    return this.app.runWithProviderContextAsync(
      this.context,
      (): Promise<void> => this.provider.boot(),
    );
  }

  public start(): Promise<void> {
    return this.app.runWithProviderContextAsync(
      this.context,
      (): Promise<void> => this.provider.start(),
    );
  }

  public ready(): Promise<void> {
    return this.app.runWithProviderContextAsync(
      this.context,
      (): Promise<void> => this.provider.ready(),
    );
  }

  public shutdown(): Promise<void> {
    return this.app.runWithProviderContextAsync(
      this.context,
      (): Promise<void> => this.provider.shutdown(),
    );
  }
}

export class ClientApplication {
  public readonly runtime: AppRuntimeContext;
  public readonly config: AppClientConfig;
  public readonly container: ServiceContainer;
  public readonly services: ServiceResolver;
  private readonly providerRegistry = new ServiceProviderRegistry();
  private readonly refineCollector: AppClientRefineConfigCollector;
  private readonly createRenderConfig: ClientApplicationRenderConfigFactory;
  private currentProviderContext: ClientServiceProviderContext | undefined;
  private resolvedRefine: Readonly<AppClientRefineConfig> | undefined;
  private resolvedRenderConfig: AppClientRenderConfig | undefined;
  private state: ClientApplicationState = 'created';
  private startPromise: Promise<void> | undefined;
  private shutdownPromise: Promise<void> | undefined;

  public constructor(options: ClientApplicationOptions) {
    this.runtime = options.runtime;
    this.config = options.runtime.config;
    this.container = new ServiceContainer();
    this.services = this.container;
    this.createRenderConfig = options.createRenderConfig;
    this.refineCollector = createRefineConfigCollector({
      i18nProvider: createRefineI18nProvider(options.runtime.i18n),
    });

    this.providerRegistry.add(
      new CoreClientServiceProvider(this, options.fetch),
    );
    this.addServiceProviders(options.runtime.serviceProviders);
  }

  public get refine(): AppClientRefineRegistry {
    const context = this.currentProviderContext;
    if (!context) {
      throw new Error(
        'Client Refine configuration can only be changed from a ServiceProvider lifecycle method.',
      );
    }
    return this.refineCollector.forContribution(context.packageName);
  }

  public get refineConfig(): Readonly<AppClientRefineConfig> {
    if (!this.resolvedRefine) {
      throw new Error(
        'Client Application has not finalized Refine configuration.',
      );
    }
    return this.resolvedRefine;
  }

  public get renderConfig(): AppClientRenderConfig {
    if (this.state !== 'started' || !this.resolvedRenderConfig) {
      throw new Error('Client Application must be started before rendering.');
    }
    return this.resolvedRenderConfig;
  }

  public addServiceProvider(
    contribution: AppClientRegisteredServiceProvider,
  ): void {
    if (this.state !== 'created') {
      throw new Error(
        'Client ServiceProviders can only be added before Application startup.',
      );
    }
    const provider = new contribution.Provider(this, contribution.context);
    this.providerRegistry.add(
      new ContextualServiceProvider(this, provider, contribution.context),
    );
  }

  public addServiceProviders(
    contributions: readonly AppClientRegisteredServiceProvider[],
  ): void {
    contributions.forEach((contribution) =>
      this.addServiceProvider(contribution),
    );
  }

  public start(): Promise<void> {
    this.startPromise ??= this.startApplication();
    return this.startPromise;
  }

  public shutdown(): Promise<void> {
    this.shutdownPromise ??= this.shutdownApplication();
    return this.shutdownPromise;
  }

  public runWithProviderContext<TResult>(
    context: ClientServiceProviderContext,
    run: () => TResult,
  ): TResult {
    const previous = this.currentProviderContext;
    this.currentProviderContext = context;
    try {
      return run();
    } finally {
      this.currentProviderContext = previous;
    }
  }

  public async runWithProviderContextAsync<TResult>(
    context: ClientServiceProviderContext,
    run: () => Promise<TResult>,
  ): Promise<TResult> {
    const previous = this.currentProviderContext;
    this.currentProviderContext = context;
    try {
      return await run();
    } finally {
      this.currentProviderContext = previous;
    }
  }

  private async startApplication(): Promise<void> {
    if (this.state !== 'created') {
      throw new Error(
        `Cannot start Client Application from state "${this.state}".`,
      );
    }
    this.state = 'starting';
    try {
      this.providerRegistry.registerAll();
      await this.providerRegistry.bootAll();
      this.resolvedRefine = this.refineCollector.finalize();
      this.resolvedRenderConfig = Object.freeze(this.createRenderConfig(this));
      await this.runtime.validate?.(this);
      await this.providerRegistry.startAll();
      await this.providerRegistry.readyAll();
      this.state = 'started';
    } catch (error) {
      this.state = 'failed';
      await this.shutdownAfterFailure(error);
    }
  }

  private async shutdownAfterFailure(startupError: unknown): Promise<never> {
    try {
      await this.shutdown();
    } catch (shutdownError) {
      throw new AggregateError(
        [startupError, shutdownError],
        'Client Application startup and shutdown both failed.',
        { cause: shutdownError },
      );
    }
    throw startupError;
  }

  private async shutdownApplication(): Promise<void> {
    if (this.state === 'shutdown') {
      return;
    }
    this.state = 'shutting-down';
    try {
      await this.providerRegistry.shutdown();
    } finally {
      this.state = 'shutdown';
    }
  }
}

export function createApp(
  runtime: AppRuntimeContext,
  createRenderConfig: ClientApplicationRenderConfigFactory,
): ClientApplication {
  return new ClientApplication({ runtime, createRenderConfig });
}
