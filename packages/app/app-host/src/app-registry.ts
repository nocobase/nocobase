/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { deploymentLog } from './deployment-log.js';
import type { AppConfigReloadResult } from '@nocobase/app-server/config';
import {
  InvalidAppIdError,
  AppCapacityExceededError,
  AppAlreadyExistsError,
  AppCreateFailedError,
  AppNotFoundError,
  AppReloadFailedError,
} from './errors.ts';
import { AppEventBus } from './events.ts';
import { InProcessAppBackend } from './in-process-backend.ts';
import type {
  ActiveAppHandle,
  CreateAppDefinitionOptions,
  DeployAppOptions,
  AppFactory,
  AppActivationBackend,
  AppDefinition,
  AppDeploymentResult,
  AppDestroyOptions,
  AppLifecycleView,
  AppRequestMetadata,
  AppSnapshot,
  ReplaceAppDefinitionOptions,
  ReplaceAppDefinitionResult,
} from './app-types.ts';
import type { Logger } from '@nocobase/logging';

export interface ReloadAppOptions {
  reason?: string;
  destroyTimeoutMs?: number;
}

export interface DestroyAppOptions extends AppDestroyOptions {
  removeDefinition?: boolean;
}

export interface RegistryHealth {
  apps: AppSnapshot[];
  definitions: AppDefinition[];
  capacity: {
    maxActiveApps: number;
    activeTotal: number;
    idleTtlMs: number;
    evictionIntervalMs: number;
    evictionLoopRunning: boolean;
  };
  metrics: RegistryMetrics;
  registered: number;
  activeTotal: number;
  active: number;
  draining: number;
  destroying: number;
  failed: number;
  operationsInFlight: number;
}

/**
 * What a registry needs to make Apps dormant: a managed Host removes a dormant App's expanded release and expands it
 * again from the artifact store before the App is activated. Without hooks, `dormantAfterMs` is ignored.
 */
export interface AppDormancyHooks {
  /** Removes what a dormant App does not need. Called under the App's lock, with no runtime. */
  hibernate(definition: AppDefinition, lastAccessedAt: number): Promise<void>;
  /** Brings a dormant App's files back. Called under the App's lock, before it is activated. */
  materialize(definition: AppDefinition): Promise<void>;
}

/**
 * A change of an App's runtime the registry made on its own: `idle-stopped` (no request for its idle TTL),
 * `dormant`, `materialized` (a dormant App prepared again), `activated` (a runtime started) or `activation-failed`.
 */
export interface AppLifecycleEvent {
  appId: string;
  kind:
    | 'idle-stopped'
    | 'dormant'
    | 'materialized'
    | 'activated'
    | 'activation-failed';
  lastAccessedAt: number | null;
}

/** How long a failed activation keeps answering requests with its error before one may try again. */
const ACTIVATION_FAILURE_HOLD_MS = 10_000;

export interface AppRuntimeRegistryOptions {
  backend?: AppActivationBackend;
  backends?: AppActivationBackend[];
  resolveFactory?: (
    definition: AppDefinition,
  ) => Promise<AppFactory> | AppFactory;
  maxActiveApps?: number;
  idleTtlMs?: number;
  evictionIntervalMs?: number;
  startEvictionLoop?: boolean;
  dormancy?: AppDormancyHooks;
  logger?: Logger;
}

export interface RegistryMetrics {
  activations: number;
  coldActivations: number;
  reloads: number;
  deployments: number;
  evictions: number;
  idleEvictions: number;
  capacityEvictions: number;
  destroys: number;
  activationFailures: number;
  /** Apps made dormant, and dormant Apps prepared again. */
  dormancies: number;
  materializations: number;
  lastActivationDurationMs: number | null;
  lastEvictionDurationMs: number | null;
}

export class AppRuntimeRegistry {
  readonly events: AppEventBus = new AppEventBus();

  private readonly definitions = new Map<string, AppDefinition>();
  private readonly runtimes = new Map<string, ActiveAppHandle>();
  private readonly operations = new Map<string, Promise<unknown>>();
  private readonly backends: ReadonlyMap<string, AppActivationBackend>;
  private readonly resolveFactory: (
    definition: AppDefinition,
  ) => Promise<AppFactory> | AppFactory;
  private readonly maxActiveApps: number;
  private readonly idleTtlMs: number;
  private readonly evictionIntervalMs: number;
  private readonly logger: Logger | undefined;
  private evictionLoop: NodeJS.Timeout | null = null;
  private dormancy: AppDormancyHooks | undefined;
  /** The last request (or activation, or registration) per App; it outlives the runtime. */
  private readonly lastAccess = new Map<string, number>();
  private readonly dormantApps = new Set<string>();
  private readonly activating = new Set<string>();
  private readonly failures = new Map<string, { at: number; error: string }>();
  private readonly lifecycleListeners = new Set<
    (event: AppLifecycleEvent) => void
  >();
  private metrics: RegistryMetrics = {
    activations: 0,
    coldActivations: 0,
    reloads: 0,
    deployments: 0,
    evictions: 0,
    idleEvictions: 0,
    capacityEvictions: 0,
    destroys: 0,
    activationFailures: 0,
    dormancies: 0,
    materializations: 0,
    lastActivationDurationMs: null,
    lastEvictionDurationMs: null,
  };
  private versionSequence = 0;

  constructor(options: AppRuntimeRegistryOptions = {}) {
    this.logger = options.logger;
    const configuredBackends = options.backends ?? [
      options.backend ?? new InProcessAppBackend(this.events),
    ];
    this.backends = new Map(
      configuredBackends.map((backend) => [backend.kind, backend]),
    );
    this.resolveFactory =
      options.resolveFactory ??
      (() => {
        throw new Error('No app factory resolver configured');
      });
    this.maxActiveApps = options.maxActiveApps ?? 500;
    this.idleTtlMs = options.idleTtlMs ?? 5 * 60_000;
    this.evictionIntervalMs = options.evictionIntervalMs ?? 60_000;
    this.dormancy = options.dormancy;

    if (options.startEvictionLoop ?? true) {
      this.startEvictionLoop();
    }
  }

  async create(
    id: string,
    options: CreateAppDefinitionOptions = {},
  ): Promise<AppSnapshot> {
    return this.withAppLock(id, async () => {
      if (this.definitions.has(id)) {
        throw new AppAlreadyExistsError(id);
      }

      const definition = this.createDefinition(id, options);
      this.definitions.set(id, definition);
      this.touch(id);
      return this.ensureActiveUnlocked(id);
    });
  }

  async register(
    id: string,
    options: CreateAppDefinitionOptions = {},
  ): Promise<AppDefinition> {
    return this.withAppLock(id, async () => {
      if (this.definitions.has(id)) {
        throw new AppAlreadyExistsError(id);
      }

      const definition = this.createDefinition(id, options);
      this.definitions.set(id, definition);
      this.touch(id);
      return definition;
    });
  }

  async registerDefinition(definition: AppDefinition): Promise<AppDefinition> {
    return this.register(definition.id, definition);
  }

  async updateDefinition(
    id: string,
    options: CreateAppDefinitionOptions = {},
  ): Promise<AppDefinition> {
    return this.withAppLock(id, async () => {
      this.requireDefinition(id);
      const definition = this.createDefinition(id, options);
      this.definitions.set(id, definition);
      return definition;
    });
  }

  async replaceDefinition(
    definition: AppDefinition,
    replaceOptions: ReplaceAppDefinitionOptions = {},
  ): Promise<ReplaceAppDefinitionResult> {
    const id = definition.id;
    return this.withAppLock(id, async () => {
      const startedAt = Date.now();
      const currentDefinition = this.definitions.get(id);
      const currentRuntime = this.runtimes.get(id);
      const nextDefinition = this.createDefinition(id, definition);
      const changed =
        !currentDefinition ||
        !definitionsEqual(currentDefinition, nextDefinition);
      if (!currentDefinition) this.touch(id);

      // Only the idle or dormancy policy changed: the running runtime keeps serving under the new policy.
      if (
        changed &&
        currentDefinition &&
        definitionsEqual(
          withoutLifecyclePolicy(currentDefinition),
          withoutLifecyclePolicy(nextDefinition),
        )
      ) {
        this.definitions.set(id, nextDefinition);
        const app =
          replaceOptions.activate && !currentRuntime
            ? await this.ensureActiveUnlocked(id)
            : (currentRuntime?.snapshot() ?? null);
        return { definition: nextDefinition, app, changed: true };
      }

      if (!changed) {
        const activationStartedAt = Date.now();
        const app =
          replaceOptions.activate && !currentRuntime
            ? await this.ensureActiveUnlocked(id)
            : (currentRuntime?.snapshot() ?? null);
        this.logger?.debug(
          {
            appId: id,
            changed: false,
            activationDurationMs: Date.now() - activationStartedAt,
            destroyDurationMs: 0,
            durationMs: Date.now() - startedAt,
          },
          'App definition replacement completed',
        );
        return { definition: currentDefinition, app, changed: false };
      }

      if (!currentRuntime && !replaceOptions.activate) {
        this.definitions.set(id, nextDefinition);
        return { definition: nextDefinition, app: null, changed: true };
      }

      if (!currentRuntime) {
        await this.evictForCapacity();
      }

      const strategy =
        currentRuntime &&
        currentDefinition &&
        this.backendOf(currentDefinition) === this.backendOf(nextDefinition) &&
        this.backendOf(nextDefinition)?.replacement === 'start-first'
          ? 'start-first'
          : 'stop-first';
      const replacementStartedAt = Date.now();
      let newRuntime: ActiveAppHandle;
      try {
        newRuntime =
          strategy === 'start-first'
            ? await this.replaceRuntimeStartFirst({
                id,
                currentRuntime: currentRuntime!,
                nextDefinition,
                reason: replaceOptions.reason ?? 'app definition replaced',
                destroyTimeoutMs: replaceOptions.destroyTimeoutMs,
              })
            : await this.replaceRuntimeStopFirst({
                id,
                currentDefinition,
                currentRuntime,
                nextDefinition,
                reason: replaceOptions.reason ?? 'app definition replaced',
                destroyTimeoutMs: replaceOptions.destroyTimeoutMs,
                retire: true,
              });
      } catch (error) {
        throw new AppReloadFailedError(id, error);
      }
      const replacementDurationMs = Date.now() - replacementStartedAt;

      this.definitions.set(id, nextDefinition);

      this.logger?.debug(
        {
          appId: id,
          changed: true,
          replacementDurationMs,
          durationMs: Date.now() - startedAt,
          replacementStrategy: strategy,
        },
        'App definition replacement completed',
      );

      return {
        definition: nextDefinition,
        app: newRuntime.snapshot(),
        changed: true,
      };
    });
  }

  async unregister(
    id: string,
    options: DestroyAppOptions = {},
  ): Promise<boolean> {
    return this.destroy(id, { ...options, removeDefinition: true });
  }

  async ensureActive(id: string): Promise<AppSnapshot> {
    return this.withAppLock(id, () => this.ensureActiveUnlocked(id));
  }

  async evict(
    id: string,
    options: string | AppDestroyOptions = {},
  ): Promise<boolean> {
    return this.evictWithSource(id, options, 'manual');
  }

  async evictIdle(now: number = Date.now()): Promise<AppSnapshot[]> {
    const candidates = this.getEvictableSnapshots()
      .filter((snapshot) => this.isIdle(snapshot, now))
      .sort(sortByLastAccessed);
    const evicted: AppSnapshot[] = [];

    for (const candidate of candidates) {
      const didEvict = await this.evictWithSource(
        candidate.id,
        {
          reason: 'idle app eviction',
        },
        'idle',
      );

      if (didEvict) {
        evicted.push(candidate);
      }
    }

    return evicted;
  }

  async reloadAppConfig(id: string): Promise<AppConfigReloadResult | null> {
    return this.withAppLock(id, async () => {
      const runtime = this.runtimes.get(id);
      return runtime ? await runtime.reloadConfig() : null;
    });
  }

  async reload(
    id: string,
    options: ReloadAppOptions = {},
  ): Promise<AppSnapshot> {
    return this.withAppLock(id, async () => {
      const definition = this.requireDefinition(id);
      const oldRuntime = this.runtimes.get(id);

      try {
        const newRuntime = await this.replaceRuntimeStopFirst({
          id,
          currentDefinition: definition,
          currentRuntime: oldRuntime,
          nextDefinition: definition,
          reason: options.reason ?? 'app reloaded',
          destroyTimeoutMs: options.destroyTimeoutMs,
        });

        this.metrics.reloads += 1;
        return newRuntime.snapshot();
      } catch (error) {
        throw new AppReloadFailedError(id, error);
      }
    });
  }

  async deploy(
    id: string,
    options: DeployAppOptions = {},
  ): Promise<AppDeploymentResult> {
    return this.withAppLock(id, async () => {
      const currentDefinition = this.requireDefinition(id);
      const oldRuntime = this.runtimes.get(id);
      const oldSnapshot = oldRuntime?.snapshot() ?? null;
      const desiredVersion =
        options.version ?? currentDefinition.desiredVersion;
      let definition = currentDefinition;

      if (desiredVersion !== currentDefinition.desiredVersion) {
        definition = this.createDefinition(id, {
          ...currentDefinition,
          desiredVersion,
          code: currentDefinition.code
            ? { ...currentDefinition.code, version: desiredVersion }
            : undefined,
          release: currentDefinition.release
            ? { ...currentDefinition.release, version: desiredVersion }
            : undefined,
        });
      }

      try {
        if (!oldRuntime) {
          await this.evictForCapacity();
        }

        const newRuntime = await this.replaceRuntimeStopFirst({
          id,
          currentDefinition,
          currentRuntime: oldRuntime,
          nextDefinition: definition,
          reason: options.reason ?? `deployed version ${desiredVersion}`,
          destroyTimeoutMs: options.destroyTimeoutMs,
          retire: definition !== currentDefinition,
        });
        this.definitions.set(id, definition);

        const app = newRuntime.snapshot();
        this.metrics.deployments += 1;
        return {
          id,
          strategy: 'restart',
          previousVersion: oldSnapshot?.codeVersion ?? null,
          desiredVersion,
          activeVersion: app.codeVersion,
          changed: oldSnapshot?.codeVersion !== app.codeVersion,
          app,
        };
      } catch (error) {
        throw new AppReloadFailedError(id, error);
      }
    });
  }

  /**
   * Starts the replacement beside the running runtime and switches to it only once it is ready: a replacement that
   * fails to start leaves the running one serving untouched. The previous runtime then drains its requests and is
   * retired. Only for backends that run each runtime apart (`replacement: 'start-first'`).
   */
  private async replaceRuntimeStartFirst(options: {
    id: string;
    currentRuntime: ActiveAppHandle;
    nextDefinition: AppDefinition;
    reason: string;
    destroyTimeoutMs?: number;
  }): Promise<ActiveAppHandle> {
    const { id, currentRuntime, nextDefinition, reason, destroyTimeoutMs } =
      options;
    deploymentLog(
      'starting',
      'Starting the new application instance beside the running one',
    );
    const newRuntime = await this.activateDefinition(nextDefinition);
    this.runtimes.set(id, newRuntime);
    deploymentLog('switching', 'Switched traffic to the new instance');
    try {
      await currentRuntime.destroy({
        reason,
        timeoutMs: destroyTimeoutMs,
        retire: true,
      });
    } catch (error) {
      this.logger?.warn(
        { err: error, appId: id },
        'Failed to retire the previous app runtime',
      );
    }
    return newRuntime;
  }

  // This remains stop-first: an in-memory queue or jobs configuration belongs
  // to one runtime at a time. The next runtime reads the state files the
  // current one writes when it stops, so running both at once would read them
  // before they are written.
  private async replaceRuntimeStopFirst(options: {
    id: string;
    currentDefinition: AppDefinition | undefined;
    currentRuntime: ActiveAppHandle | undefined;
    nextDefinition: AppDefinition;
    reason: string;
    destroyTimeoutMs?: number;
    /** The previous runtime is not coming back with this definition (see `AppDestroyOptions.retire`). */
    retire?: boolean;
  }): Promise<ActiveAppHandle> {
    const {
      id,
      currentDefinition,
      currentRuntime,
      nextDefinition,
      reason,
      destroyTimeoutMs,
      retire,
    } = options;

    if (currentRuntime) {
      deploymentLog('starting', 'Stopping previous application instance');
      await currentRuntime.destroy({
        reason,
        timeoutMs: destroyTimeoutMs,
        ...(retire ? { retire } : {}),
      });
      if (this.runtimes.get(id) === currentRuntime) {
        this.runtimes.delete(id);
      }
    }

    try {
      const newRuntime = await this.activateDefinition(nextDefinition);
      this.runtimes.set(id, newRuntime);
      return newRuntime;
    } catch (activationError) {
      if (!currentRuntime || !currentDefinition?.enabled) {
        throw activationError;
      }

      try {
        deploymentLog(
          'starting',
          'Restoring previous application after activation failure',
          { err: activationError },
        );
        const restoredRuntime =
          await this.activateDefinition(currentDefinition);
        this.runtimes.set(id, restoredRuntime);
        deploymentLog('starting', 'Previous application restored');
      } catch (restoreError) {
        deploymentLog(
          'starting',
          'Previous application could not be restored',
          { err: restoreError },
        );
        throw new AggregateError(
          [activationError, restoreError],
          `App "${id}" failed to activate the replacement and restore the previous runtime`,
          { cause: restoreError },
        );
      }

      throw activationError;
    }
  }

  async destroy(
    id: string,
    options: string | DestroyAppOptions = {},
  ): Promise<boolean> {
    return this.withAppLock(id, async () => {
      const destroyOptions =
        typeof options === 'string' ? { reason: options } : options;
      const runtime = this.runtimes.get(id);
      const hadDefinition = this.definitions.has(id);

      if (runtime) {
        await runtime.destroy({
          ...destroyOptions,
          retire:
            destroyOptions.retire ?? destroyOptions.removeDefinition !== false,
        });
        this.runtimes.delete(id);
        this.metrics.destroys += 1;
      }

      if (destroyOptions.removeDefinition !== false) {
        this.definitions.delete(id);
        this.lastAccess.delete(id);
        this.dormantApps.delete(id);
        this.failures.delete(id);
      }

      return Boolean(runtime || hadDefinition);
    });
  }

  async destroyAll(options: string | DestroyAppOptions = {}): Promise<void> {
    this.stopEvictionLoop();
    const ids = [
      ...new Set([...this.definitions.keys(), ...this.runtimes.keys()]),
    ];
    const results = await Promise.allSettled(
      ids.map((id) => this.destroy(id, options)),
    );
    const failures = results.filter((result) => result.status === 'rejected');

    if (failures.length > 0) {
      const failureReasons: unknown[] = [];
      for (const failure of failures) {
        failureReasons.push(failure.reason);
      }
      throw new AggregateError(
        failureReasons,
        `Failed to destroy ${failures.length} app(s)`,
      );
    }
  }

  /**
   * Lets every runtime go as the Host shuts down: one whose backend can keep it running for the next Host (`detach`)
   * is left running, the others are destroyed. Definitions are forgotten; nothing is retired.
   */
  async releaseAll(reason: string = 'host shutdown'): Promise<void> {
    this.stopEvictionLoop();
    const ids = [
      ...new Set([...this.definitions.keys(), ...this.runtimes.keys()]),
    ];
    const results = await Promise.allSettled(
      ids.map((id) =>
        this.withAppLock(id, async () => {
          const runtime = this.runtimes.get(id);
          if (runtime) {
            if (runtime.detach) await runtime.detach();
            else await runtime.destroy({ reason });
            this.runtimes.delete(id);
          }
          this.definitions.delete(id);
        }),
      ),
    );
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0)
      throw new AggregateError(
        failures.map((failure) => failure.reason as unknown),
        `Failed to release ${failures.length} app(s)`,
      );
  }

  has(id: string): boolean {
    return this.definitions.has(id);
  }

  isActive(id: string): boolean {
    return this.runtimes.has(id);
  }

  definition(id: string): AppDefinition | undefined {
    return this.definitions.get(id);
  }

  listDefinitions(): AppDefinition[] {
    return [...this.definitions.values()];
  }

  snapshot(id: string): AppSnapshot | undefined {
    return this.runtimes.get(id)?.snapshot();
  }

  requireSnapshot(id: string): AppSnapshot {
    const snapshot = this.snapshot(id);
    if (!snapshot) {
      throw new AppNotFoundError(id);
    }

    return snapshot;
  }

  status(id: string): { definition: AppDefinition; app: AppSnapshot | null } {
    return {
      definition: this.requireDefinition(id),
      app: this.snapshot(id) ?? null,
    };
  }

  list(): AppSnapshot[] {
    return [...this.runtimes.values()].map((runtime) => runtime.snapshot());
  }

  backendKinds(): AppDefinition['backend'][] {
    return [...this.backends.keys()] as AppDefinition['backend'][];
  }

  /** The activation backends this registry runs Apps on. */
  listBackends(): AppActivationBackend[] {
    return [...this.backends.values()];
  }

  /** The backend a definition runs on, or undefined when this registry has none of its kind. */
  backendOf(definition: AppDefinition): AppActivationBackend | undefined {
    return this.backends.get(definition.backend);
  }

  capacity(): RegistryHealth['capacity'] {
    return {
      maxActiveApps: this.maxActiveApps,
      activeTotal: this.runtimes.size,
      idleTtlMs: this.idleTtlMs,
      evictionIntervalMs: this.evictionIntervalMs,
      evictionLoopRunning: this.evictionLoop !== null,
    };
  }

  getMetrics(): RegistryMetrics {
    return { ...this.metrics };
  }

  health(): RegistryHealth {
    const apps = this.list();

    return {
      apps,
      definitions: this.listDefinitions(),
      capacity: this.capacity(),
      metrics: this.getMetrics(),
      registered: this.definitions.size,
      activeTotal: apps.length,
      active: apps.filter((app) => app.state === 'active').length,
      draining: apps.filter((app) => app.state === 'draining').length,
      destroying: apps.filter((app) => app.state === 'destroying').length,
      failed: apps.filter((app) => app.state === 'failed').length,
      operationsInFlight: this.operations.size,
    };
  }

  startEvictionLoop(): void {
    if (this.evictionLoop || this.evictionIntervalMs <= 0) {
      return;
    }

    this.evictionLoop = setInterval(() => {
      this.sweep().catch((error) => {
        this.logger?.error({ err: error }, 'Idle app eviction failed');
      });
    }, this.evictionIntervalMs);
    this.evictionLoop.unref?.();
  }

  stopEvictionLoop(): void {
    if (!this.evictionLoop) {
      return;
    }

    clearInterval(this.evictionLoop);
    this.evictionLoop = null;
  }

  async dispatch(
    id: string,
    request: Request,
    metadata: AppRequestMetadata = {},
  ): Promise<Response> {
    const runtime = await this.ensureActiveHandle(id);
    return runtime.dispatch(request, metadata);
  }

  async ensureActiveHandle(id: string): Promise<ActiveAppHandle> {
    if (this.definitions.has(id)) this.touch(id);
    // A serving runtime answers at once, even while the App's lock is held: a start-first replacement keeps the
    // previous runtime serving until it switches. A runtime that is draining or being replaced waits for the lock.
    const serving = this.runtimes.get(id);
    if (serving?.state === 'active') return serving;
    return this.withAppLock(id, async () => {
      const existing = this.runtimes.get(id);
      if (existing) {
        return existing;
      }

      const definition = this.requireDefinition(id);
      await this.evictForCapacity();
      const runtime = await this.activateDefinition(definition);
      this.metrics.coldActivations += 1;
      this.runtimes.set(id, runtime);
      return runtime;
    });
  }

  private async ensureActiveUnlocked(id: string): Promise<AppSnapshot> {
    const existing = this.runtimes.get(id);
    if (existing) {
      return existing.snapshot();
    }

    const definition = this.requireDefinition(id);
    await this.evictForCapacity();
    const runtime = await this.activateDefinition(definition);
    this.metrics.coldActivations += 1;
    this.runtimes.set(id, runtime);
    return runtime.snapshot();
  }

  private async activateDefinition(
    definition: AppDefinition,
  ): Promise<ActiveAppHandle> {
    if (!definition.enabled) {
      throw new AppNotFoundError(definition.id);
    }

    this.activating.add(definition.id);
    try {
      if (this.dormantApps.has(definition.id)) {
        await this.materializeUnlocked(definition);
      }
      const runtime = await this.createRuntime(definition);
      this.failures.delete(definition.id);
      this.touch(definition.id);
      this.emitLifecycle(definition.id, 'activated');
      return runtime;
    } catch (error) {
      this.failures.set(definition.id, {
        at: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });
      this.emitLifecycle(definition.id, 'activation-failed');
      throw error;
    } finally {
      this.activating.delete(definition.id);
    }
  }

  private async createRuntime(
    definition: AppDefinition,
  ): Promise<ActiveAppHandle> {
    const version = ++this.versionSequence;

    this.events.emit('app:beforeCreate', {
      appId: definition.id,
      version,
      basePath: definition.basePath,
      state: 'creating',
      metadata: {
        configVersion: definition.configVersion,
        isolation: definition.isolation,
        tier: definition.tier,
      },
    });

    const startedAt = Date.now();
    try {
      const backend = this.backends.get(definition.backend);
      if (!backend) {
        throw new Error(
          `App backend "${definition.backend}" is not available on this host`,
        );
      }
      const factoryStartedAt = Date.now();
      // A backend that runs the App elsewhere loads no server module here.
      const createApp: AppFactory =
        backend.loadsAppCode === false
          ? () => {
              throw new Error(
                `App backend "${backend.name ?? backend.kind}" does not load app code in the host`,
              );
            }
          : await this.resolveFactory(definition);
      const factoryDurationMs = Date.now() - factoryStartedAt;
      const backendStartedAt = Date.now();
      const runtime = await backend.activate({
        definition,
        version,
        createApp,
      });
      const backendDurationMs = Date.now() - backendStartedAt;

      // In-process runtimes emit `created` only after activation.
      const activatableRuntime = runtime as ActiveAppHandle & {
        activate?: () => void;
      };
      if (typeof activatableRuntime.activate === 'function') {
        activatableRuntime.activate();
      }

      this.metrics.activations += 1;
      this.metrics.lastActivationDurationMs = Date.now() - startedAt;
      this.logger?.info(
        {
          appId: definition.id,
          factoryDurationMs,
          backendDurationMs,
          durationMs: this.metrics.lastActivationDurationMs,
        },
        'App runtime activation completed',
      );
      return runtime;
    } catch (error) {
      this.metrics.activationFailures += 1;
      this.events.emit('app:createFailed', {
        appId: definition.id,
        version,
        basePath: definition.basePath,
        state: 'failed',
        error,
      });
      throw new AppCreateFailedError(definition.id, error);
    }
  }

  private async evictForCapacity(): Promise<void> {
    if (this.runtimes.size < this.maxActiveApps) {
      return;
    }

    const candidates = this.getEvictableSnapshots().sort(sortByLastAccessed);

    const candidate = candidates[0];
    if (!candidate) {
      throw new AppCapacityExceededError(this.maxActiveApps);
    }

    const didEvict = await this.evictWithSource(
      candidate.id,
      {
        reason: 'max active apps reached',
      },
      'capacity',
    );

    if (!didEvict) {
      throw new AppCapacityExceededError(this.maxActiveApps);
    }
  }

  private async evictWithSource(
    id: string,
    options: string | AppDestroyOptions,
    source: 'manual' | 'idle' | 'capacity',
  ): Promise<boolean> {
    return this.withAppLock(id, () => this.evictUnlocked(id, options, source));
  }

  private async evictUnlocked(
    id: string,
    options: string | AppDestroyOptions = {},
    source: 'manual' | 'idle' | 'capacity' = 'manual',
  ): Promise<boolean> {
    const runtime = this.runtimes.get(id);
    if (!runtime) {
      return false;
    }

    const startedAt = Date.now();
    await runtime.destroy(options);
    this.runtimes.delete(id);
    this.metrics.evictions += 1;
    this.metrics.lastEvictionDurationMs = Date.now() - startedAt;

    if (source === 'idle') {
      this.metrics.idleEvictions += 1;
      this.emitLifecycle(id, 'idle-stopped');
    }

    if (source === 'capacity') {
      this.metrics.capacityEvictions += 1;
    }

    return true;
  }

  private getEvictableSnapshots(): AppSnapshot[] {
    return [...this.runtimes.values()]
      .map((runtime) => runtime.snapshot())
      .filter(
        (snapshot) =>
          snapshot.activeRequests === 0 && snapshot.tier !== 'dedicated',
      );
  }

  private isIdle(snapshot: AppSnapshot, now: number): boolean {
    const ttl =
      this.definitions.get(snapshot.id)?.resourcePolicy?.idleTtlMs ??
      this.idleTtlMs;
    if (!(ttl > 0)) return false;
    const lastTouchedAt = Math.max(
      Date.parse(snapshot.lastAccessedAt ?? snapshot.createdAt),
      this.lastAccess.get(snapshot.id) ?? 0,
    );
    return now - lastTouchedAt >= ttl;
  }

  // --- On-demand lifecycle --------------------------------------------------------------------------------------

  /** Records a request to the App (or anything that counts as one) for its idle and dormancy timers. */
  touch(id: string, at: number = Date.now()): void {
    const previous = this.lastAccess.get(id) ?? 0;
    if (at > previous) this.lastAccess.set(id, at);
  }

  /** Sets the App's last access exactly, as a restarted Host restores what it persisted. */
  restoreLastAccess(id: string, at: number): void {
    this.lastAccess.set(id, at);
  }

  /** When the App was last requested, activated or registered; null when the registry does not know it. */
  lastAccessedAt(id: string): number | null {
    const runtimeAccess = this.runtimes.get(id)?.snapshot().lastAccessedAt;
    const values = [
      this.lastAccess.get(id),
      runtimeAccess ? Date.parse(runtimeAccess) : undefined,
    ].filter((value): value is number => typeof value === 'number');
    return values.length ? Math.max(...values) : null;
  }

  setDormancyHooks(hooks: AppDormancyHooks | undefined): void {
    this.dormancy = hooks;
  }

  onLifecycle(listener: (event: AppLifecycleEvent) => void): () => void {
    this.lifecycleListeners.add(listener);
    return () => this.lifecycleListeners.delete(listener);
  }

  /** Marks a registered App dormant without touching its files, as a restarted Host finds it. */
  markDormant(id: string): void {
    if (this.definitions.has(id) && !this.runtimes.has(id))
      this.dormantApps.add(id);
  }

  /** Forgets that an App was dormant once its files are back (a new deployment expanded them). */
  markMaterialized(id: string): void {
    this.dormantApps.delete(id);
  }

  isDormant(id: string): boolean {
    return this.dormantApps.has(id);
  }

  isActivating(id: string): boolean {
    return this.activating.has(id);
  }

  /** The App's last activation failure while it is recent; requests answer with it rather than retrying at once. */
  recentFailure(
    id: string,
    now: number = Date.now(),
  ): { at: number; error: string } | null {
    const failure = this.failures.get(id);
    return failure && now - failure.at < ACTIVATION_FAILURE_HOLD_MS
      ? failure
      : null;
  }

  lifecycle(id: string): AppLifecycleView | undefined {
    if (!this.definitions.has(id)) return undefined;
    const runtime = this.runtimes.get(id);
    const lastAccessedAt = this.lastAccessedAt(id);
    const failure = this.recentFailure(id);
    return {
      state: this.activating.has(id)
        ? 'starting'
        : runtime
          ? 'running'
          : this.dormantApps.has(id)
            ? 'dormant'
            : 'stopped',
      lastAccessedAt:
        lastAccessedAt === null ? null : new Date(lastAccessedAt).toISOString(),
      lastFailure: failure
        ? { at: new Date(failure.at).toISOString(), error: failure.error }
        : null,
    };
  }

  /** Brings a dormant App's files back without starting it, for static assets served from them. */
  async prepare(id: string): Promise<void> {
    if (!this.dormantApps.has(id)) return;
    await this.withAppLock(id, async () => {
      const definition = this.definitions.get(id);
      if (definition && this.dormantApps.has(id))
        await this.materializeUnlocked(definition);
    });
  }

  /** Stops idle Apps, then makes dormant those not requested for their dormancy period. */
  async sweep(now: number = Date.now()): Promise<void> {
    await this.evictIdle(now);
    await this.hibernateIdle(now);
  }

  /** Makes dormant every App whose `dormantAfterMs` passed without a request. Answers their IDs. */
  async hibernateIdle(now: number = Date.now()): Promise<string[]> {
    const hibernated: string[] = [];
    for (const candidate of this.listDefinitions()) {
      const id = candidate.id;
      const backend = this.backendOf(candidate);
      const hibernate = backend?.hibernate
        ? (definition: AppDefinition) => backend.hibernate!(definition)
        : this.dormancy
          ? (definition: AppDefinition, lastAccessedAt: number) =>
              this.dormancy!.hibernate(definition, lastAccessedAt)
          : null;
      if (!hibernate) continue;
      if (!this.isDormancyDue(candidate, now)) continue;
      const done = await this.withAppLock(id, async () => {
        const definition = this.definitions.get(id);
        if (!definition || !this.isDormancyDue(definition, now)) return false;
        const runtime = this.runtimes.get(id);
        if (runtime) {
          if (runtime.snapshot().activeRequests > 0) return false;
          await this.evictUnlocked(id, { reason: 'dormant app' }, 'idle');
        }
        await hibernate(definition, this.lastAccessedAt(id) ?? now);
        this.dormantApps.add(id);
        this.metrics.dormancies += 1;
        this.logger?.info({ appId: id }, 'App made dormant');
        this.emitLifecycle(id, 'dormant');
        return true;
      });
      if (done) hibernated.push(id);
    }
    return hibernated;
  }

  private isDormancyDue(definition: AppDefinition, now: number): boolean {
    const after = definition.resourcePolicy?.dormantAfterMs ?? 0;
    if (!(after > 0) || !definition.enabled) return false;
    if (this.dormantApps.has(definition.id)) return false;
    if (this.activating.has(definition.id)) return false;
    const last = this.lastAccessedAt(definition.id);
    return last !== null && now - last >= after;
  }

  private async materializeUnlocked(definition: AppDefinition): Promise<void> {
    const backend = this.backendOf(definition);
    const materialize = backend?.hibernate
      ? (backend.materialize?.bind(backend) ?? (() => Promise.resolve()))
      : this.dormancy
        ? this.dormancy.materialize.bind(this.dormancy)
        : null;
    if (!materialize)
      throw new Error(
        `App "${definition.id}" is dormant and this registry cannot prepare it`,
      );
    const startedAt = Date.now();
    await materialize(definition);
    this.dormantApps.delete(definition.id);
    this.metrics.materializations += 1;
    this.logger?.info(
      { appId: definition.id, durationMs: Date.now() - startedAt },
      'Dormant app prepared again',
    );
    this.emitLifecycle(definition.id, 'materialized');
  }

  private emitLifecycle(id: string, kind: AppLifecycleEvent['kind']): void {
    const event: AppLifecycleEvent = {
      appId: id,
      kind,
      lastAccessedAt: this.lastAccessedAt(id),
    };
    for (const listener of this.lifecycleListeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger?.warn(
          { err: error, appId: id },
          'Lifecycle listener failed',
        );
      }
    }
  }

  private createDefinition(
    id: string,
    options: CreateAppDefinitionOptions,
  ): AppDefinition {
    this.assertAppId(id);
    const server =
      options.server ??
      options.api ??
      (options.entrypoint && options.rootDir
        ? {
            rootDir: options.rootDir,
            entrypoint: options.entrypoint,
            healthPath: options.healthPath,
          }
        : undefined);

    return {
      id,
      deploymentId: options.deploymentId,
      logging: options.logging,
      appName: options.appName,
      basePath: options.basePath ?? `/${options.appName ?? id}`,
      enabled: options.enabled ?? true,
      backend: options.backend ?? options.isolation ?? 'in-process',
      configVersion: options.configVersion ?? 'v1',
      isolation: options.isolation ?? options.backend ?? 'in-process',
      tier: options.tier ?? 'warm',
      desiredVersion:
        options.desiredVersion ??
        options.code?.version ??
        options.release?.version ??
        options.configVersion ??
        'v1',
      rootDir: options.rootDir,
      dataDir: options.dataDir,
      configPath: options.configPath,
      client: options.client,
      server,
      api: options.api,
      code: options.code,
      release: options.release,
      healthPath: server?.healthPath ?? options.healthPath,
      resourcePolicy: options.resourcePolicy,
      ...(options.backendOptions
        ? { backendOptions: options.backendOptions }
        : {}),
      ...(options.hostname ? { hostname: options.hostname } : {}),
      ...(options.env ? { env: options.env } : {}),
    };
  }

  private requireDefinition(id: string): AppDefinition {
    const definition = this.definitions.get(id);
    if (!definition || !definition.enabled) {
      throw new AppNotFoundError(id);
    }

    return definition;
  }

  private async withAppLock<T>(
    id: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const previous = this.operations.get(id) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    this.operations.set(id, current);

    try {
      return await current;
    } finally {
      if (this.operations.get(id) === current) {
        this.operations.delete(id);
      }
    }
  }

  private assertAppId(id: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new InvalidAppIdError(id);
    }
  }
}

function sortByLastAccessed(a: AppSnapshot, b: AppSnapshot): number {
  const aTime = a.lastAccessedAt
    ? Date.parse(a.lastAccessedAt)
    : Date.parse(a.createdAt);
  const bTime = b.lastAccessedAt
    ? Date.parse(b.lastAccessedAt)
    : Date.parse(b.createdAt);
  return aTime - bTime;
}

function definitionsEqual(a: AppDefinition, b: AppDefinition): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** The definition without the policies that change when a runtime stops, which never require replacing it. */
function withoutLifecyclePolicy(definition: AppDefinition): AppDefinition {
  if (!definition.resourcePolicy) return definition;
  const { idleTtlMs, dormantAfterMs, ...rest } = definition.resourcePolicy;
  void idleTtlMs;
  void dormantAfterMs;
  return {
    ...definition,
    resourcePolicy: Object.keys(rest).length ? rest : undefined,
  };
}
