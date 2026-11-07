/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sampleHostMemory, type HostMemoryUsage } from './memory.js';
import {
  deploymentSignal,
  withPreparationSignal,
} from './deployment-control.js';
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
    /** Deprecated: no static memory-derived application count. */
    memorySlots?: number;
    memory: HostMemoryUsage;
    rotationPending: boolean;
    heapTarget: number;
    appMemory: number;
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
/**
 * An App requested more recently than this is in use even between requests (a page polling every few seconds), so
 * capacity admission never reclaims it: evicting it would only make its next request evict another App, and the Host
 * would restart Apps every few seconds instead of answering the newcomer that it is full.
 */
export const CAPACITY_RECENT_USE_MS = 60_000;

export interface AppRuntimeRegistryOptions {
  /** Live heap/system admission, with headroom for one serialized cold start. */
  memoryBudget?: AppMemoryBudget;
  /** Legacy heap sampler; called again for every admission. */
  sampleHeap?: () => { heapUsed: number; heapLimit: number };
  sampleMemory?: () => HostMemoryUsage;
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

export interface AppMemoryBudget {
  targetRatio?: number;
  /** Deprecated; accepted but ignored. */
  baseMemoryMb?: number;
  /** Cold-start headroom, not a per-App estimate; 320 MiB covers the measured non-first cold-start peaks. */
  appMemoryMb?: number;
  /** Operational OS/process reserve; the 1024 MiB default has not been measured on the target server. */
  reserveMb?: number;
  /** Optional whole-process RSS ceiling; heap is checked separately, never added to RSS. */
  rssBudgetMb?: number;
  startupTimeoutMs?: number;
  maxPendingStarts?: number;
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
  startupTimeouts: number;
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
  private readonly targetRatio: number;
  private readonly sampleMemory: () => HostMemoryUsage;
  private readonly reserveMemory: number;
  private readonly rssBudget: number;
  private readonly startupTimeoutMs: number;
  private readonly maxPendingStarts: number;
  private pendingStarts = 0;
  private readonly loadedRevisions = new Set<string>();
  private rotationPending = false;
  private rotationReady = false;
  private ingress = 0;
  private preparing = 0;
  private readonly appMemory: number;
  private readonly reservations = new Map<string, AppDefinition>();
  private admission: Promise<unknown> = Promise.resolve();
  private capacityAdmission: Promise<unknown> = Promise.resolve();
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
    startupTimeouts: 0,
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
    this.maxActiveApps = options.maxActiveApps ?? Number.MAX_SAFE_INTEGER;
    this.sampleMemory = () => ({
      ...(options.sampleMemory ?? sampleHostMemory)(),
      ...options.sampleHeap?.(),
    });
    this.targetRatio = options.memoryBudget?.targetRatio ?? 0.7;
    this.appMemory = (options.memoryBudget?.appMemoryMb ?? 320) * 1024 ** 2;
    // Operational reserve, not derived from the cold-start measurements; keep configurable.
    this.reserveMemory = (options.memoryBudget?.reserveMb ?? 1024) * 1024 ** 2;
    this.rssBudget = (options.memoryBudget?.rssBudgetMb ?? 0) * 1024 ** 2;
    this.startupTimeoutMs = options.memoryBudget?.startupTimeoutMs ?? 120_000;
    this.maxPendingStarts = options.memoryBudget?.maxPendingStarts ?? 32;
    if (
      !(this.targetRatio > 0 && this.targetRatio < 1) ||
      !Number.isFinite(this.appMemory) ||
      this.appMemory <= 0 ||
      !Number.isFinite(this.reserveMemory) ||
      this.reserveMemory < 0 ||
      !Number.isFinite(this.rssBudget) ||
      this.rssBudget < 0 ||
      !Number.isSafeInteger(this.startupTimeoutMs) ||
      this.startupTimeoutMs <= 0 ||
      this.startupTimeoutMs > 2_147_483_647 ||
      !Number.isSafeInteger(this.maxPendingStarts) ||
      this.maxPendingStarts < 1
    )
      throw new Error('Invalid App Host memory budget');
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
        now,
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
      if (
        nextDefinition.backend === 'in-process' &&
        this.memoryFull(nextDefinition)
      )
        throw new AppCapacityExceededError(
          this.maxActiveApps,
          'Insufficient memory for replacement; current runtime kept serving',
        );
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
    const memory = this.memoryUsage();
    return {
      maxActiveApps: this.maxActiveApps,
      activeTotal: this.runtimes.size,
      idleTtlMs: this.idleTtlMs,
      evictionIntervalMs: this.evictionIntervalMs,
      evictionLoopRunning: this.evictionLoop !== null,
      memory,
      rotationPending: this.rotationPending,
      heapTarget: memory.heapLimit * this.targetRatio,
      appMemory: this.appMemory,
    };
  }

  memoryUsage(): HostMemoryUsage {
    return this.sampleMemory();
  }

  private revisionKey(definition: AppDefinition): string {
    const code = definition.code ?? definition.release;
    const server = definition.server ?? definition.api;
    return JSON.stringify([
      definition.id,
      code?.rootDir ?? server?.rootDir ?? definition.rootDir,
      code?.entrypoint ?? server?.entrypoint,
      code?.fingerprint ?? code?.version ?? definition.desiredVersion,
    ]);
  }

  /** Existing running Apps keep serving while only new revision loads are paused. */
  pauseNewRevisions(): void {
    this.rotationPending = true;
  }
  resumeAfterRotationFailure(): void {
    this.rotationReady = false;
  }
  isRotating(): boolean {
    return this.rotationReady;
  }

  /** The listener leases ingress before its first await, including assets and upgrade handshakes. */
  enterRequest(): (() => void) | null {
    if (this.rotationReady) return null;
    this.ingress += 1;
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this.ingress -= 1;
      }
    };
  }

  /** Atomic with ingress admission in this process; a successful check closes the check/request race. */
  pendingOperationCount(): number {
    return this.operations.size;
  }
  isRotationPending(): boolean {
    return this.rotationPending;
  }

  prepareRotation(ignoreConnections: boolean): boolean {
    if (
      this.ingress > 0 ||
      this.preparing > 0 ||
      this.operations.size > 0 ||
      this.pendingStarts > 0 ||
      this.list().some(
        (app) =>
          app.activeRequests > 0 ||
          (!ignoreConnections && (app.activeConnections ?? 0) > 0),
      )
    )
      return false;
    this.pauseNewRevisions();
    this.rotationReady = true;
    return true;
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
    const runtime = await this.activateDefinition(definition);
    this.metrics.coldActivations += 1;
    this.runtimes.set(id, runtime);
    return runtime.snapshot();
  }

  private activateDefinition(
    definition: AppDefinition,
  ): Promise<ActiveAppHandle> {
    if (definition.backend !== 'in-process')
      return this.activateAdmitted(definition);
    if (this.pendingStarts >= this.maxPendingStarts)
      return Promise.reject(
        new AppCapacityExceededError(
          this.maxActiveApps,
          'Cold-start queue is full; retry later',
        ),
      );
    this.pendingStarts += 1;
    const signal = deploymentSignal();
    const work = this.admission
      .catch(() => undefined)
      .then(() => {
        signal?.throwIfAborted();
        return this.activateAdmitted(definition);
      });
    this.admission = work;
    return work.finally(() => {
      this.pendingStarts -= 1;
    });
  }

  private async activateAdmitted(
    definition: AppDefinition,
  ): Promise<ActiveAppHandle> {
    if (!definition.enabled) {
      throw new AppNotFoundError(definition.id);
    }

    this.activating.add(definition.id);
    try {
      await this.reserveCapacity(definition);
      const runtime = await this.createRuntimeBounded(definition);
      // Publish before releasing the reservation: another activation must always see this slot occupied.
      this.runtimes.set(definition.id, runtime);
      this.failures.delete(definition.id);
      this.touch(definition.id);
      this.emitLifecycle(definition.id, 'activated');
      return runtime;
    } catch (error) {
      if (error instanceof AppCapacityExceededError) throw error;
      this.failures.set(definition.id, {
        at: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });
      this.emitLifecycle(definition.id, 'activation-failed');
      throw error;
    } finally {
      this.reservations.delete(definition.id);
      this.activating.delete(definition.id);
    }
  }

  private async createRuntimeBounded(
    definition: AppDefinition,
  ): Promise<ActiveAppHandle> {
    if (definition.backend !== 'in-process') {
      if (this.dormantApps.has(definition.id))
        await this.materializeUnlocked(definition);
      return this.createRuntime(definition);
    }
    const timeoutMs =
      definition.resourcePolicy?.startupTimeoutMs ?? this.startupTimeoutMs;
    if (
      !Number.isSafeInteger(timeoutMs) ||
      timeoutMs <= 0 ||
      timeoutMs > 2_147_483_647
    )
      throw new Error('Invalid application startup timeout');
    const abort = new AbortController();
    const parentSignal = deploymentSignal();
    const signal = parentSignal
      ? AbortSignal.any([parentSignal, abort.signal])
      : abort.signal;
    let expired = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const work = withPreparationSignal(signal, async () => {
      if (this.dormantApps.has(definition.id)) {
        this.preparing += 1;
        try {
          await this.materializeUnlocked(definition);
        } finally {
          this.preparing -= 1;
        }
      }
      if (expired)
        throw new Error(
          'App materialization completed after the startup deadline',
        );
      return this.createRuntime(definition, () => expired);
    });
    try {
      return await Promise.race([
        work,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            expired = true;
            this.metrics.startupTimeouts += 1;
            const error = new Error(
              `App "${definition.id}" startup timed out after ${timeoutMs} ms`,
            );
            abort.abort(error);
            reject(error);
          }, timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async createRuntime(
    definition: AppDefinition,
    expired: () => boolean = () => false,
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
      if (definition.backend === 'in-process')
        this.loadedRevisions.add(this.revisionKey(definition));
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
      if (expired())
        throw new Error('App module resolved after the startup deadline');
      const factoryDurationMs = Date.now() - factoryStartedAt;
      const backendStartedAt = Date.now();
      const runtime = await backend.activate({
        definition,
        version,
        createApp,
      });
      const backendDurationMs = Date.now() - backendStartedAt;
      if (expired()) {
        await runtime.destroy({
          reason: 'Late completion after startup timeout',
          timeoutMs: 1000,
        });
        throw new Error('Application completed after its startup deadline');
      }

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

  private reserveCapacity(definition: AppDefinition): Promise<void> {
    const work = this.capacityAdmission
      .catch(() => undefined)
      .then(() => this.reserveCapacityUnlocked(definition));
    this.capacityAdmission = work;
    return work;
  }

  private memoryFull(definition: AppDefinition): boolean {
    if (
      this.rotationPending &&
      !this.loadedRevisions.has(this.revisionKey(definition))
    )
      return true;
    const memory = this.memoryUsage();
    return (
      memory.heapUsed + this.appMemory > memory.heapLimit * this.targetRatio ||
      memory.available < this.appMemory + this.reserveMemory ||
      (this.rssBudget > 0 && memory.rss + this.appMemory > this.rssBudget)
    );
  }

  private async reserveCapacityUnlocked(
    definition: AppDefinition,
  ): Promise<void> {
    const shared = definition.backend === 'in-process';
    const occupied = () =>
      new Map<string, { backend: AppDefinition['backend'] }>([
        ...this.list().map((app) => [app.id, app] as const),
        ...this.reservations,
      ]);
    const full = () => {
      const apps = occupied();
      const countFull =
        apps.size + (apps.has(definition.id) ? 0 : 1) > this.maxActiveApps;
      if (!shared) return countFull;
      return countFull || this.memoryFull(definition);
    };
    const recent = (id: string) =>
      Date.now() - (this.lastAccessedAt(id) ?? 0) < CAPACITY_RECENT_USE_MS;
    let capacityFull = full();
    if (capacityFull) {
      const candidate = this.getEvictableSnapshots()
        .filter(
          (app) =>
            app.id !== definition.id &&
            !this.operations.has(app.id) &&
            !recent(app.id) &&
            (!shared || app.backend === 'in-process'),
        )
        .reduce<AppSnapshot | undefined>(
          (oldest, app) =>
            !oldest ||
            (this.lastAccessedAt(app.id) ?? 0) <
              (this.lastAccessedAt(oldest.id) ?? 0)
              ? app
              : oldest,
          undefined,
        );
      if (candidate) {
        await this.evictWithSource(
          candidate.id,
          { reason: 'App Host capacity reached' },
          'capacity',
        );
        capacityFull = full();
      }
    }
    if (capacityFull) {
      this.logger?.warn(
        {
          appId: definition.id,
          memory: this.memoryUsage(),
          rotationPending: this.rotationPending,
          occupants: [...occupied().keys()].map((id) => {
            const app = this.snapshot(id);
            const policy = this.definitions.get(id);
            return {
              appId: id,
              reasons: [
                app?.activeRequests ? 'requests' : null,
                app?.activeConnections ? 'connections' : null,
                this.activating.has(id) ? 'starting' : null,
                this.operations.has(id) && !this.activating.has(id)
                  ? 'operation'
                  : null,
                policy?.tier === 'dedicated' ||
                policy?.resourcePolicy?.idleTtlMs === 0
                  ? 'resident'
                  : null,
                app && !this.isEvictable(app) ? 'busy' : null,
                app && this.isEvictable(app) && recent(id) ? 'recent' : null,
              ].filter(Boolean),
            };
          }),
        },
        'App Host capacity full; retry later',
      );
      throw new AppCapacityExceededError(
        this.maxActiveApps,
        this.rotationPending
          ? 'Waiting for Host memory recycling; retry later'
          : 'App Host capacity exceeded: insufficient memory or active application capacity; retry later',
      );
    }

    this.reservations.set(definition.id, definition);
  }

  private async evictWithSource(
    id: string,
    options: string | AppDestroyOptions,
    source: 'manual' | 'idle' | 'capacity',
    idleNow: number = Date.now(),
  ): Promise<boolean> {
    return this.withAppLock(id, () =>
      this.evictUnlocked(id, options, source, idleNow),
    );
  }

  private async evictUnlocked(
    id: string,
    options: string | AppDestroyOptions = {},
    source: 'manual' | 'idle' | 'capacity' | 'dormant' = 'manual',
    idleNow: number = Date.now(),
  ): Promise<boolean> {
    const runtime = this.runtimes.get(id);
    if (!runtime) {
      return false;
    }
    if (source !== 'manual') {
      const snapshot = runtime.snapshot();
      if (
        !this.isEvictable(snapshot) ||
        (source === 'idle' && !this.isIdle(snapshot, idleNow)) ||
        (source === 'capacity' &&
          Date.now() - (this.lastAccessedAt(id) ?? 0) < CAPACITY_RECENT_USE_MS)
      )
        return false;
    }

    const startedAt = Date.now();
    await runtime.destroy(options);
    const lastAccessedAt = this.lastAccessedAt(id);
    if (lastAccessedAt !== null) this.touch(id, lastAccessedAt);
    this.runtimes.delete(id);
    this.metrics.evictions += 1;
    this.metrics.lastEvictionDurationMs = Date.now() - startedAt;

    if (source === 'idle' || source === 'dormant') {
      this.metrics.idleEvictions += 1;
    }
    if (source === 'idle') {
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
      .filter((snapshot) => this.isEvictable(snapshot));
  }

  private isEvictable(snapshot: AppSnapshot): boolean {
    return (
      snapshot.state === 'active' &&
      snapshot.activeRequests === 0 &&
      (snapshot.activeConnections ?? 0) === 0 &&
      snapshot.tier !== 'dedicated' &&
      !this.activating.has(snapshot.id) &&
      this.definitions.get(snapshot.id)?.resourcePolicy?.idleTtlMs !== 0
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
          if (
            !(await this.evictUnlocked(
              id,
              { reason: 'dormant app' },
              'dormant',
            ))
          )
            return false;
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
    if (definition.tier === 'dedicated') return false;
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
