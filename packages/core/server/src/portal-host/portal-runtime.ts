/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PortalEventBus, type PortalEvent, type PortalEventPayload, type PortalState } from './events';
import type {
  ActivePortalHandle,
  PortalAppFactory,
  PortalDefinition,
  PortalDisposer,
  PortalDestroyOptions,
  PortalFetchApp,
  PortalRequestMetadata,
  PortalScope,
  PortalSnapshot,
} from './portal-types';

export interface PortalRuntimeOptions {
  version: number;
  definition: PortalDefinition;
  createApp: PortalAppFactory;
  globalEvents: PortalEventBus;
}

interface RegisteredDisposer {
  name: string;
  dispose: PortalDisposer;
}

export class PortalRuntime implements PortalScope, ActivePortalHandle {
  readonly id: string;
  readonly appName?: string;
  readonly portalName?: string;
  readonly version: number;
  readonly basePath: string;
  readonly rootDir?: string;
  readonly dataDir?: string;
  readonly config?: unknown;
  readonly backend: PortalDefinition['backend'];
  readonly configVersion: string;
  readonly desiredVersion: string;
  readonly codeVersion: string;
  readonly isolation: PortalDefinition['isolation'];
  readonly tier: PortalDefinition['tier'];
  readonly events = new PortalEventBus();
  app!: PortalFetchApp;

  private readonly globalEvents: PortalEventBus;
  private readonly abortController = new AbortController();
  private readonly disposers: RegisteredDisposer[] = [];
  private readonly beforeDestroyHandlers: PortalDisposer[] = [];
  private requestSequence = 0;
  private waitForIdleResolvers: Array<() => void> = [];
  private createdAt = new Date();
  private updatedAt = new Date();
  private lastAccessedAt: Date | null = null;
  private lastError: string | null = null;

  state: PortalState = 'creating';
  activeRequests = 0;

  private constructor(options: Omit<PortalRuntimeOptions, 'createApp'>) {
    this.id = options.definition.id;
    this.appName = options.definition.appName;
    this.portalName = options.definition.portalName;
    this.version = options.version;
    this.basePath = options.definition.basePath;
    this.rootDir = options.definition.rootDir;
    this.dataDir = options.definition.dataDir;
    this.config = options.definition.config;
    this.backend = options.definition.backend;
    this.configVersion = options.definition.configVersion;
    this.desiredVersion = options.definition.desiredVersion;
    this.codeVersion = options.definition.code?.version ?? options.definition.desiredVersion;
    this.isolation = options.definition.isolation;
    this.tier = options.definition.tier;
    this.globalEvents = options.globalEvents;
  }

  static async create(options: PortalRuntimeOptions): Promise<PortalRuntime> {
    const runtime = new PortalRuntime(options);

    try {
      runtime.app = await options.createApp(runtime);
      return runtime;
    } catch (error) {
      runtime.transitionTo('failed');
      runtime.lastError = error instanceof Error ? error.message : String(error);
      await runtime.disposeRegisteredResources('portal create failed');
      throw error;
    }
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  get abortSignal(): AbortSignal {
    return this.abortController.signal;
  }

  activate(): void {
    this.transitionTo('active');
    this.emit('portal:created');
  }

  on(event: PortalEvent, handler: (payload: PortalEventPayload) => void | Promise<void>): () => void {
    return this.events.on(event, handler);
  }

  onBeforeDestroy(handler: () => void | Promise<void>): () => void {
    this.beforeDestroyHandlers.push(handler);
    return () => {
      const index = this.beforeDestroyHandlers.indexOf(handler);
      if (index >= 0) {
        this.beforeDestroyHandlers.splice(index, 1);
      }
    };
  }

  registerDisposer(name: string, dispose: PortalDisposer): void {
    if (this.state === 'destroying' || this.state === 'destroyed') {
      throw new Error(`Cannot register disposer "${name}" after portal ${this.id} has started destroying`);
    }

    this.disposers.push({ name, dispose });
  }

  snapshot(): PortalSnapshot {
    return {
      id: this.id,
      appName: this.appName,
      portalName: this.portalName,
      version: this.version,
      basePath: this.basePath,
      backend: this.backend,
      configVersion: this.configVersion,
      desiredVersion: this.desiredVersion,
      codeVersion: this.codeVersion,
      isolation: this.isolation,
      tier: this.tier,
      state: this.state,
      endpoint: {
        kind: 'in-process',
      },
      activeRequests: this.activeRequests,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      lastAccessedAt: this.lastAccessedAt?.toISOString() ?? null,
      lastError: this.lastError,
      disposerCount: this.disposers.length,
    };
  }

  async dispatch(request: Request, metadata: PortalRequestMetadata = {}): Promise<Response> {
    if (this.state !== 'active') {
      return new Response(
        JSON.stringify({
          error: `Portal ${this.id} is ${this.state}`,
        }),
        {
          status: this.state === 'draining' || this.state === 'destroying' ? 503 : 410,
          headers: {
            'content-type': 'application/json',
          },
        },
      );
    }

    const requestId = `${this.id}-${++this.requestSequence}`;
    const startedAt = Date.now();
    this.activeRequests += 1;
    this.lastAccessedAt = new Date();
    this.touch();
    this.emit('portal:requestStart', {
      requestId,
      method: metadata.method ?? request.method,
      path: metadata.path ?? new URL(request.url).pathname,
      activeRequests: this.activeRequests,
    });

    try {
      const response = await this.app.fetch(request, {
        portalId: this.id,
        portalVersion: this.version,
        portalBasePath: this.basePath,
        signal: this.abortSignal,
      });

      this.emit('portal:requestEnd', {
        requestId,
        method: metadata.method ?? request.method,
        path: metadata.path ?? new URL(request.url).pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
        activeRequests: this.activeRequests,
      });
      return response;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.emit('portal:requestError', {
        requestId,
        method: metadata.method ?? request.method,
        path: metadata.path ?? new URL(request.url).pathname,
        durationMs: Date.now() - startedAt,
        error,
        activeRequests: this.activeRequests,
      });
      throw error;
    } finally {
      this.activeRequests -= 1;
      if (this.activeRequests === 0) {
        this.resolveIdleWaiters();
      }
    }
  }

  async destroy(options: string | PortalDestroyOptions = {}): Promise<void> {
    if (this.state === 'destroyed') {
      return;
    }

    const destroyOptions = typeof options === 'string' ? { reason: options } : options;
    const reason = destroyOptions.reason ?? 'manual destroy';
    const timeoutMs = destroyOptions.timeoutMs ?? 10_000;

    if (this.state !== 'failed' && this.state !== 'creating') {
      this.transitionTo('draining');
    }
    this.emit('portal:beforeDrain', { reason, activeRequests: this.activeRequests });
    this.emit('portal:draining', { reason, activeRequests: this.activeRequests });

    await this.waitForIdle(timeoutMs);

    this.abortController.abort(new Error(reason));
    this.emit('portal:beforeDestroy', { reason, activeRequests: this.activeRequests });
    await this.runBeforeDestroyHandlers(reason);

    this.transitionTo('destroying');
    this.emit('portal:destroying', { reason, activeRequests: this.activeRequests });
    await this.disposeRegisteredResources(reason);

    this.events.removeAllListeners();
    this.transitionTo('destroyed');
    this.globalEvents.emit('portal:destroyed', this.payload({ reason }));
  }

  private async runBeforeDestroyHandlers(reason: string): Promise<void> {
    for (const handler of [...this.beforeDestroyHandlers]) {
      try {
        await handler();
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
        this.emit('portal:destroyFailed', {
          reason,
          resourceName: 'beforeDestroy hook',
          error,
        });
      }
    }

    this.beforeDestroyHandlers.length = 0;
  }

  private async disposeRegisteredResources(reason: string): Promise<void> {
    for (const disposer of [...this.disposers].reverse()) {
      this.emit('portal:resourceDispose', { reason, resourceName: disposer.name });
      try {
        await disposer.dispose();
        this.emit('portal:resourceDisposed', { reason, resourceName: disposer.name });
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
        this.emit('portal:destroyFailed', { reason, resourceName: disposer.name, error });
      }
    }

    this.disposers.length = 0;
  }

  private waitForIdle(timeoutMs: number): Promise<void> {
    if (this.activeRequests === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, timeoutMs);
      this.waitForIdleResolvers.push(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  private resolveIdleWaiters(): void {
    const resolvers = this.waitForIdleResolvers;
    this.waitForIdleResolvers = [];
    for (const resolve of resolvers) {
      resolve();
    }
  }

  private emit(event: PortalEvent, overrides: Partial<PortalEventPayload> = {}): void {
    const payload = this.payload(overrides);
    this.events.emit(event, payload);
    this.globalEvents.emit(event, payload);
  }

  private transitionTo(state: PortalState): void {
    this.state = state;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  private payload(overrides: Partial<PortalEventPayload> = {}): PortalEventPayload {
    return {
      portalId: this.id,
      version: this.version,
      basePath: this.basePath,
      state: this.state,
      ...overrides,
    };
  }
}
