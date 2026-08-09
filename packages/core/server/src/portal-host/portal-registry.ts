/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  InvalidPortalIdError,
  PortalCapacityExceededError,
  PortalAlreadyExistsError,
  PortalCreateFailedError,
  PortalNotFoundError,
  PortalReloadFailedError,
} from './errors';
import { PortalEventBus } from './events';
import { InProcessPortalBackend } from './in-process-backend';
import type {
  ActivePortalHandle,
  CreatePortalDefinitionOptions,
  DeployPortalOptions,
  PortalAppFactory,
  PortalActivationBackend,
  PortalDefinition,
  PortalDeploymentResult,
  PortalDestroyOptions,
  PortalRequestMetadata,
  PortalSnapshot,
} from './portal-types';

export interface ReloadPortalOptions {
  reason?: string;
  destroyTimeoutMs?: number;
}

export interface DestroyPortalOptions extends PortalDestroyOptions {
  removeDefinition?: boolean;
}

export interface RegistryHealth {
  portals: PortalSnapshot[];
  definitions: PortalDefinition[];
  capacity: {
    maxActivePortals: number;
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

export interface PortalRuntimeRegistryOptions {
  backend?: PortalActivationBackend;
  resolveFactory?: (definition: PortalDefinition) => Promise<PortalAppFactory> | PortalAppFactory;
  maxActivePortals?: number;
  idleTtlMs?: number;
  evictionIntervalMs?: number;
  startEvictionLoop?: boolean;
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
  lastActivationDurationMs: number | null;
  lastEvictionDurationMs: number | null;
}

export class PortalRuntimeRegistry {
  readonly events = new PortalEventBus();

  private readonly definitions = new Map<string, PortalDefinition>();
  private readonly runtimes = new Map<string, ActivePortalHandle>();
  private readonly operations = new Map<string, Promise<unknown>>();
  private readonly backend: PortalActivationBackend;
  private readonly resolveFactory: (definition: PortalDefinition) => Promise<PortalAppFactory> | PortalAppFactory;
  private readonly maxActivePortals: number;
  private readonly idleTtlMs: number;
  private readonly evictionIntervalMs: number;
  private evictionLoop: NodeJS.Timeout | null = null;
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
    lastActivationDurationMs: null,
    lastEvictionDurationMs: null,
  };
  private versionSequence = 0;

  constructor(options: PortalRuntimeRegistryOptions = {}) {
    this.backend = options.backend ?? new InProcessPortalBackend(this.events);
    this.resolveFactory =
      options.resolveFactory ??
      (() => {
        throw new Error('No portal factory resolver configured');
      });
    this.maxActivePortals = options.maxActivePortals ?? 500;
    this.idleTtlMs = options.idleTtlMs ?? 5 * 60_000;
    this.evictionIntervalMs = options.evictionIntervalMs ?? 60_000;

    if (options.startEvictionLoop ?? true) {
      this.startEvictionLoop();
    }
  }

  async create(id: string, options: CreatePortalDefinitionOptions = {}): Promise<PortalSnapshot> {
    return this.withPortalLock(id, async () => {
      if (this.definitions.has(id)) {
        throw new PortalAlreadyExistsError(id);
      }

      const definition = this.createDefinition(id, options);
      this.definitions.set(id, definition);
      return this.ensureActiveUnlocked(id);
    });
  }

  async register(id: string, options: CreatePortalDefinitionOptions = {}): Promise<PortalDefinition> {
    return this.withPortalLock(id, async () => {
      if (this.definitions.has(id)) {
        throw new PortalAlreadyExistsError(id);
      }

      const definition = this.createDefinition(id, options);
      this.definitions.set(id, definition);
      return definition;
    });
  }

  async updateDefinition(id: string, options: CreatePortalDefinitionOptions = {}): Promise<PortalDefinition> {
    return this.withPortalLock(id, async () => {
      this.requireDefinition(id);
      const definition = this.createDefinition(id, options);
      this.definitions.set(id, definition);
      return definition;
    });
  }

  async unregister(id: string, options: DestroyPortalOptions = {}): Promise<boolean> {
    return this.destroy(id, { ...options, removeDefinition: true });
  }

  async ensureActive(id: string): Promise<PortalSnapshot> {
    return this.withPortalLock(id, () => this.ensureActiveUnlocked(id));
  }

  async evict(id: string, options: string | PortalDestroyOptions = {}): Promise<boolean> {
    return this.evictWithSource(id, options, 'manual');
  }

  async evictIdle(now = Date.now()): Promise<PortalSnapshot[]> {
    const candidates = this.getEvictableSnapshots()
      .filter((snapshot) => this.isIdle(snapshot, now))
      .sort(sortByLastAccessed);
    const evicted: PortalSnapshot[] = [];

    for (const candidate of candidates) {
      const didEvict = await this.evictWithSource(
        candidate.id,
        {
          reason: 'idle portal eviction',
        },
        'idle',
      );

      if (didEvict) {
        evicted.push(candidate);
      }
    }

    return evicted;
  }

  async reload(id: string, options: ReloadPortalOptions = {}): Promise<PortalSnapshot> {
    return this.withPortalLock(id, async () => {
      const definition = this.requireDefinition(id);
      const oldRuntime = this.runtimes.get(id);

      try {
        const newRuntime = await this.activateDefinition(definition);
        this.runtimes.set(id, newRuntime);

        if (oldRuntime) {
          await oldRuntime.destroy({
            reason: options.reason ?? `reloaded by version ${newRuntime.version}`,
            timeoutMs: options.destroyTimeoutMs,
          });
        }

        this.metrics.reloads += 1;
        return newRuntime.snapshot();
      } catch (error) {
        throw new PortalReloadFailedError(id, error);
      }
    });
  }

  async deploy(id: string, options: DeployPortalOptions = {}): Promise<PortalDeploymentResult> {
    return this.withPortalLock(id, async () => {
      const currentDefinition = this.requireDefinition(id);
      const oldRuntime = this.runtimes.get(id);
      const oldSnapshot = oldRuntime?.snapshot() ?? null;
      const desiredVersion = options.version ?? currentDefinition.desiredVersion;
      let definition = currentDefinition;

      if (desiredVersion !== currentDefinition.desiredVersion) {
        definition = this.createDefinition(id, {
          ...currentDefinition,
          desiredVersion,
          code: currentDefinition.code ? { ...currentDefinition.code, version: desiredVersion } : undefined,
          release: currentDefinition.release ? { ...currentDefinition.release, version: desiredVersion } : undefined,
        });
        this.definitions.set(id, definition);
      }

      try {
        if (!oldRuntime) {
          await this.evictForCapacity();
        }

        const newRuntime = await this.activateDefinition(definition);
        this.runtimes.set(id, newRuntime);

        if (oldRuntime) {
          await oldRuntime.destroy({
            reason: options.reason ?? `deployed version ${desiredVersion}`,
            timeoutMs: options.destroyTimeoutMs,
          });
        }

        const portal = newRuntime.snapshot();
        this.metrics.deployments += 1;
        return {
          id,
          strategy: options.strategy ?? 'blue-green',
          previousVersion: oldSnapshot?.codeVersion ?? null,
          desiredVersion,
          activeVersion: portal.codeVersion,
          changed: oldSnapshot?.codeVersion !== portal.codeVersion,
          portal,
        };
      } catch (error) {
        if (desiredVersion !== currentDefinition.desiredVersion) {
          this.definitions.set(id, currentDefinition);
        }

        throw new PortalReloadFailedError(id, error);
      }
    });
  }

  async destroy(id: string, options: string | DestroyPortalOptions = {}): Promise<boolean> {
    return this.withPortalLock(id, async () => {
      const destroyOptions = typeof options === 'string' ? { reason: options } : options;
      const runtime = this.runtimes.get(id);
      const hadDefinition = this.definitions.has(id);

      if (runtime) {
        await runtime.destroy(destroyOptions);
        this.runtimes.delete(id);
        this.metrics.destroys += 1;
      }

      if (destroyOptions.removeDefinition !== false) {
        this.definitions.delete(id);
      }

      return Boolean(runtime || hadDefinition);
    });
  }

  async destroyAll(options: string | DestroyPortalOptions = {}): Promise<void> {
    this.stopEvictionLoop();
    const ids = [...new Set([...this.definitions.keys(), ...this.runtimes.keys()])];
    const results = await Promise.allSettled(ids.map((id) => this.destroy(id, options)));
    const failures = results.filter((result) => result.status === 'rejected');

    if (failures.length > 0) {
      throw new AggregateError(
        failures.map((failure) => (failure as PromiseRejectedResult).reason),
        `Failed to destroy ${failures.length} portal(s)`,
      );
    }
  }

  has(id: string): boolean {
    return this.definitions.has(id);
  }

  isActive(id: string): boolean {
    return this.runtimes.has(id);
  }

  definition(id: string): PortalDefinition | undefined {
    return this.definitions.get(id);
  }

  listDefinitions(): PortalDefinition[] {
    return [...this.definitions.values()];
  }

  snapshot(id: string): PortalSnapshot | undefined {
    return this.runtimes.get(id)?.snapshot();
  }

  requireSnapshot(id: string): PortalSnapshot {
    const snapshot = this.snapshot(id);
    if (!snapshot) {
      throw new PortalNotFoundError(id);
    }

    return snapshot;
  }

  status(id: string): { definition: PortalDefinition; portal: PortalSnapshot | null } {
    return {
      definition: this.requireDefinition(id),
      portal: this.snapshot(id) ?? null,
    };
  }

  list(): PortalSnapshot[] {
    return [...this.runtimes.values()].map((runtime) => runtime.snapshot());
  }

  capacity(): RegistryHealth['capacity'] {
    return {
      maxActivePortals: this.maxActivePortals,
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
    const portals = this.list();

    return {
      portals,
      definitions: this.listDefinitions(),
      capacity: this.capacity(),
      metrics: this.getMetrics(),
      registered: this.definitions.size,
      activeTotal: portals.length,
      active: portals.filter((portal) => portal.state === 'active').length,
      draining: portals.filter((portal) => portal.state === 'draining').length,
      destroying: portals.filter((portal) => portal.state === 'destroying').length,
      failed: portals.filter((portal) => portal.state === 'failed').length,
      operationsInFlight: this.operations.size,
    };
  }

  startEvictionLoop(): void {
    if (this.evictionLoop || this.evictionIntervalMs <= 0) {
      return;
    }

    this.evictionLoop = setInterval(() => {
      this.evictIdle().catch((error) => {
        console.error('Idle portal eviction failed', error);
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

  async dispatch(id: string, request: Request, metadata: PortalRequestMetadata = {}): Promise<Response> {
    const runtime = await this.ensureActiveHandle(id);
    return runtime.dispatch(request, metadata);
  }

  async ensureActiveHandle(id: string): Promise<ActivePortalHandle> {
    return this.withPortalLock(id, async () => {
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

  private async ensureActiveUnlocked(id: string): Promise<PortalSnapshot> {
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

  private async activateDefinition(definition: PortalDefinition): Promise<ActivePortalHandle> {
    if (!definition.enabled) {
      throw new PortalNotFoundError(definition.id);
    }

    const version = ++this.versionSequence;

    this.events.emit('portal:beforeCreate', {
      portalId: definition.id,
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
      const createApp = await this.resolveFactory(definition);
      const runtime = await this.backend.activate({
        definition,
        version,
        createApp,
      });

      // In-process runtimes emit `created` only after activation.
      const activatableRuntime = runtime as ActivePortalHandle & { activate?: () => void };
      if (typeof activatableRuntime.activate === 'function') {
        activatableRuntime.activate();
      }

      this.metrics.activations += 1;
      this.metrics.lastActivationDurationMs = Date.now() - startedAt;
      return runtime;
    } catch (error) {
      this.metrics.activationFailures += 1;
      this.events.emit('portal:createFailed', {
        portalId: definition.id,
        version,
        basePath: definition.basePath,
        state: 'failed',
        error,
      });
      throw new PortalCreateFailedError(definition.id, error);
    }
  }

  private async evictForCapacity(): Promise<void> {
    if (this.runtimes.size < this.maxActivePortals) {
      return;
    }

    const candidates = this.getEvictableSnapshots().sort(sortByLastAccessed);

    const candidate = candidates[0];
    if (!candidate) {
      throw new PortalCapacityExceededError(this.maxActivePortals);
    }

    const didEvict = await this.evictWithSource(
      candidate.id,
      {
        reason: 'max active portals reached',
      },
      'capacity',
    );

    if (!didEvict) {
      throw new PortalCapacityExceededError(this.maxActivePortals);
    }
  }

  private async evictWithSource(
    id: string,
    options: string | PortalDestroyOptions,
    source: 'manual' | 'idle' | 'capacity',
  ): Promise<boolean> {
    return this.withPortalLock(id, () => this.evictUnlocked(id, options, source));
  }

  private async evictUnlocked(
    id: string,
    options: string | PortalDestroyOptions = {},
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
    }

    if (source === 'capacity') {
      this.metrics.capacityEvictions += 1;
    }

    return true;
  }

  private getEvictableSnapshots(): PortalSnapshot[] {
    return [...this.runtimes.values()]
      .map((runtime) => runtime.snapshot())
      .filter((snapshot) => snapshot.activeRequests === 0 && snapshot.tier !== 'dedicated');
  }

  private isIdle(snapshot: PortalSnapshot, now: number): boolean {
    const lastTouchedAt = snapshot.lastAccessedAt ?? snapshot.createdAt;
    return now - Date.parse(lastTouchedAt) >= this.idleTtlMs;
  }

  private createDefinition(id: string, options: CreatePortalDefinitionOptions): PortalDefinition {
    this.assertPortalId(id);

    return {
      id,
      appName: options.appName,
      portalName: options.portalName,
      basePath: options.basePath ?? `/portals/${options.portalName ?? portalNameFromId(id)}`,
      enabled: options.enabled ?? true,
      backend: options.backend ?? options.isolation ?? 'in-process',
      configVersion: options.configVersion ?? 'v1',
      isolation: options.isolation ?? options.backend ?? 'in-process',
      tier: options.tier ?? 'warm',
      desiredVersion:
        options.desiredVersion ?? options.code?.version ?? options.release?.version ?? options.configVersion ?? 'v1',
      rootDir: options.rootDir,
      dataDir: options.dataDir,
      entrypoint: options.entrypoint,
      code: options.code,
      release: options.release,
      healthPath: options.healthPath,
      resourcePolicy: options.resourcePolicy,
      config: options.config,
    };
  }

  private requireDefinition(id: string): PortalDefinition {
    const definition = this.definitions.get(id);
    if (!definition || !definition.enabled) {
      throw new PortalNotFoundError(id);
    }

    return definition;
  }

  private async withPortalLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
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

  private assertPortalId(id: string): void {
    if (!/^[a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)?$/.test(id)) {
      throw new InvalidPortalIdError(id);
    }
  }
}

function portalNameFromId(id: string): string {
  return id.includes(':') ? id.split(':').at(-1) ?? id : id;
}

function sortByLastAccessed(a: PortalSnapshot, b: PortalSnapshot): number {
  const aTime = a.lastAccessedAt ? Date.parse(a.lastAccessedAt) : Date.parse(a.createdAt);
  const bTime = b.lastAccessedAt ? Date.parse(b.lastAccessedAt) : Date.parse(b.createdAt);
  return aTime - bTime;
}
