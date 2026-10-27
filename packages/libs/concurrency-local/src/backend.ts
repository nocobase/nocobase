import {
  ConcurrentConfigurationError,
  ConcurrentAcquireError,
  ConcurrentCloseError,
} from '@nocobase/concurrency';
import type {
  ConcurrentBackend,
  ConcurrentBackendSession,
  BackendContext,
  BackendAcquireRequest,
  BackendGrant,
  ResourceSpec,
  ConcurrentCapabilities,
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
class LocalSession implements ConcurrentBackendSession {
  get protocolVersion(): 2 {
    return 2;
  }
  readonly capabilities: ConcurrentCapabilities = Object.freeze({
    lock: true,
    executor: true,
    semaphore: false,
    autoRenew: false,
  });
  private closing = false;
  private closed = false;
  private readonly attempts = new Set<AbortController>();
  private readonly grants = new Set<BackendGrant>();
  private releases = 0;
  constructor(
    private readonly context: BackendContext,
    private readonly registry: LocalResourceRegistry,
    private readonly retryInterval: number,
    private readonly onClosed: () => void,
  ) {}
  async validateResource(resource: ResourceSpec): Promise<void> {
    if (this.closing)
      throw new ConcurrentAcquireError('Local session is closing');
    if (
      resource.namespace !== this.context.namespace ||
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
    if (this.closing)
      throw new ConcurrentAcquireError('Local session is closing');
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
          this.context.clock.now() >= request.wait.deadline);
      while (!unavailable()) {
        const notAfter = await this.registry.transition(
          key,
          (state, effects) => {
            // Recheck after waiting for the gate; one caller never cancels the shared Mutex.
            if (unavailable()) return undefined;
            this.registry.purge(state, effects);
            if (state.holder) return undefined;
            const expiresAt = this.context.clock.now() + request.resource.ttl;
            if (!Number.isFinite(expiresAt))
              throw new ConcurrentConfigurationError(
                'Invalid local lease deadline',
              );
            this.registry.grant(state, request.token, expiresAt, effects);
            return expiresAt;
          },
        );
        if (notAfter !== undefined) {
          let inFlight: Promise<void> | undefined;
          let released = false;
          const grant: BackendGrant = {
            notAfter,
            release: (): Promise<void> => {
              if (inFlight) return inFlight;
              if (released) return Promise.resolve();
              this.releases++;
              const work = this.registry
                .transition(key, (state, effects) => {
                  this.registry.purge(state, effects);
                  if (state.holder?.token === request.token)
                    this.registry.clear(state, effects);
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
        const remaining = request.wait.deadline - this.context.clock.now();
        if (remaining <= 0) return undefined;
        await delay(
          this.context,
          Math.min(this.retryInterval, remaining),
          controller.signal,
        );
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
      controller.abort(new ConcurrentAcquireError('Local session is closing'));
    if (this.attempts.size || this.grants.size || this.releases)
      throw new ConcurrentCloseError(
        'Local session still has visible work or unreturned grants',
      );
    this.closed = true;
    this.onClosed();
  }
}

export class LocalConcurrentBackend implements ConcurrentBackend {
  private context?: BackendContext;
  private registry?: LocalResourceRegistry;
  private readonly sessions = new Set<LocalSession>();
  private closed = false;
  private readonly retryInterval: number;
  constructor(options: LocalConcurrentBackendOptions = {}) {
    this.retryInterval = positive(
      options.retryIntervalMs ?? 10,
      'retryIntervalMs',
    );
  }
  async openSession(
    context: BackendContext,
  ): Promise<ConcurrentBackendSession> {
    if (this.closed)
      throw new ConcurrentConfigurationError('Local backend is closed');
    if (context.protocolVersion !== 2)
      throw new ConcurrentConfigurationError(
        'Local backend requires protocol v2',
      );
    if (!context.namespace || !Number.isFinite(context.clock.now()))
      throw new ConcurrentConfigurationError('Invalid local backend context');
    positive(context.operationTimeoutMs, 'operationTimeoutMs');
    positive(context.cleanupTimeoutMs, 'cleanupTimeoutMs');
    if (
      this.context &&
      (this.context.clock !== context.clock ||
        this.context.scheduler !== context.scheduler)
    )
      throw new ConcurrentConfigurationError(
        'Shared local sessions must use the same clock and scheduler instances',
      );
    this.context ??= context;
    this.registry ??= new LocalResourceRegistry(context);
    const session = new LocalSession(
      context,
      this.registry,
      this.retryInterval,
      () => {
        this.sessions.delete(session);
      },
    );
    this.sessions.add(session);
    return session;
  }
  async close(): Promise<void> {
    if (this.sessions.size)
      throw new ConcurrentCloseError(
        'Close all local sessions before closing the backend',
      );
    this.closed = true;
    await this.registry?.drain();
  }
}
