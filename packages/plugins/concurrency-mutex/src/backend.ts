import {
  ConcurrentConfigurationError,
  ConcurrentAcquireError,
  ConcurrentCloseError,
} from '@nocobase/concurrency';
import type {
  ConcurrentBackend,
  BackendContext,
  BackendAcquireRequest,
  BackendGrant,
  ResourceSpec,
} from '@nocobase/concurrency/backend';
import { LocalResourceRegistry } from './registry.ts';

export interface LocalConcurrentBackendOptions {
  retryIntervalMs?: number;
}
function positive(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1 || value > 2147483647)
    throw new ConcurrentConfigurationError(
      `${name} must be an integer in 1..2147483647`,
    );
  return value;
}
function delay(
  context: BackendContext,
  timeout: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    let cancel = (): void => {};
    const finish = (): void => {
      if (done) return;
      done = true;
      cancel();
      signal.removeEventListener('abort', finish);
      resolve();
    };
    signal.addEventListener('abort', finish, { once: true });
    cancel = context.scheduler.setTimer(finish, timeout);
    if (done) cancel();
    if (signal.aborted) finish();
  });
}
export class LocalConcurrentBackend implements ConcurrentBackend {
  readonly protocolVersion = 1;
  private state?: { context: BackendContext; registry: LocalResourceRegistry };
  private initialized = false;
  private closing = false;
  private closed = false;
  private readonly attempts = new Set<AbortController>();
  private readonly grants = new Set<BackendGrant>();
  private releases = 0;
  private readonly retryInterval: number;
  constructor(options: LocalConcurrentBackendOptions = {}) {
    this.retryInterval = positive(
      options.retryIntervalMs ?? 10,
      'retryIntervalMs',
    );
  }
  async initialize(context: BackendContext): Promise<void> {
    if (this.initialized || this.closing || this.closed)
      throw new ConcurrentConfigurationError(
        'Local backend cannot be initialized twice',
      );
    this.initialized = true;
    if (context.protocolVersion !== 1)
      throw new ConcurrentConfigurationError(
        'Local backend requires protocol v1',
      );
    if (!context.namespace || !Number.isFinite(context.clock.now()))
      throw new ConcurrentConfigurationError('Invalid local backend context');
    positive(context.operationTimeoutMs, 'operationTimeoutMs');
    positive(context.cleanupTimeoutMs, 'cleanupTimeoutMs');
    this.state = { context, registry: new LocalResourceRegistry(context) };
  }
  private opened(): {
    context: BackendContext;
    registry: LocalResourceRegistry;
  } {
    if (!this.state)
      throw new ConcurrentConfigurationError(
        'Local backend is not initialized',
      );
    if (this.closing)
      throw new ConcurrentAcquireError('Local backend is closing');
    return this.state;
  }
  async validateResource(resource: ResourceSpec): Promise<void> {
    const { context } = this.opened();
    if (
      resource.namespace !== context.namespace ||
      resource.kind !== 'lock' ||
      typeof resource.name !== 'string' ||
      !resource.name.length
    )
      throw new ConcurrentConfigurationError('Invalid local lock resource');
    positive(resource.ttl, 'ttl');
  }
  async acquire(
    request: BackendAcquireRequest,
  ): Promise<BackendGrant | undefined> {
    const { context, registry } = this.opened();
    const controller = new AbortController();
    const onAbort = (): void => controller.abort(request.signal.reason);
    this.attempts.add(controller);
    request.signal.addEventListener('abort', onAbort, { once: true });
    if (request.signal.aborted) onAbort();
    try {
      await this.validateResource(request.resource);
      if (
        !request.token ||
        !request.requestId ||
        (request.wait.kind !== 'single' &&
          request.wait.kind !== 'unbounded' &&
          (request.wait.kind !== 'bounded' ||
            !Number.isFinite(request.wait.deadline)))
      )
        throw new ConcurrentConfigurationError(
          'Invalid local acquisition request',
        );
      const key = JSON.stringify([
        request.resource.namespace,
        request.resource.kind,
        request.resource.name,
      ]);
      const unavailable = (): boolean =>
        this.closing ||
        controller.signal.aborted ||
        (request.wait.kind === 'bounded' &&
          context.clock.now() >= request.wait.deadline);
      while (!unavailable()) {
        const notAfter = await registry.transition(key, (state, effects) => {
          // Recheck after waiting for the gate; one caller never cancels the shared Mutex.
          if (unavailable()) return undefined;
          registry.purge(state, effects);
          if (state.holder) return undefined;
          const expiresAt = context.clock.now() + request.resource.ttl;
          if (!Number.isFinite(expiresAt))
            throw new ConcurrentConfigurationError(
              'Invalid local lease deadline',
            );
          registry.grant(state, request.token, expiresAt, effects);
          return expiresAt;
        });
        if (notAfter !== undefined) {
          let inFlight: Promise<void> | undefined;
          let released = false;
          const grant: BackendGrant = {
            notAfter,
            release: (): Promise<void> => {
              if (inFlight) return inFlight;
              if (released) return Promise.resolve();
              this.releases++;
              const work = registry
                .transition(key, (state, effects) => {
                  registry.purge(state, effects);
                  if (state.holder?.token === request.token)
                    registry.clear(state, effects);
                })
                .then(() => {
                  released = true;
                  this.grants.delete(grant);
                });
              inFlight = work;
              void work.then(
                () => {
                  inFlight = undefined;
                  this.releases--;
                },
                () => {
                  inFlight = undefined;
                  this.releases--;
                },
              );
              return work;
            },
          };
          this.grants.add(grant);
          // Even a cancellation after authorization must return the known grant for core cleanup.
          return grant;
        }
        if (request.wait.kind === 'single' || unavailable()) return undefined;
        const interval =
          request.wait.kind === 'bounded'
            ? Math.min(
                this.retryInterval,
                request.wait.deadline - context.clock.now(),
              )
            : this.retryInterval;
        if (interval <= 0) return undefined;
        await delay(context, interval, controller.signal);
      }
      return undefined;
    } finally {
      request.signal.removeEventListener('abort', onAbort);
      this.attempts.delete(controller);
    }
  }
  async close(): Promise<void> {
    if (this.closed) return;
    this.closing = true;
    for (const controller of this.attempts)
      controller.abort(new ConcurrentAcquireError('Local backend is closing'));
    if (this.attempts.size || this.grants.size || this.releases)
      throw new ConcurrentCloseError(
        'Local backend still has visible work or unreturned grants',
      );
    await this.state?.registry.drain();
    this.closed = true;
  }
}
