import { randomUUID } from 'node:crypto';
import { defaultClock, defaultScheduler } from './backend/index.ts';
import type {
  BackendContext,
  BackendGrant,
  ConcurrentBackendSession,
  ResourceSpec,
  WaitPolicy,
} from './backend/index.ts';
import {
  ConcurrentConfigurationError,
  ConcurrentAcquireError,
  ConcurrentAbortError,
  ConcurrentLeaseLostError,
  ConcurrentReleaseError,
  ConcurrentCloseError,
} from './errors.ts';
import type {
  ConcurrentRuntimeOptions,
  ConcurrentRuntime,
  ConcurrentManager,
  ConcurrentCapabilities,
  ConcurrentDiagnostic,
  ConcurrentOptions,
  ExecutorOptions,
  Lock,
  Semaphore,
  SynchronousExecutor,
  Lease,
  ExecutorContext,
  AcquireOptions,
  WaitOptions,
  CloseOptions,
  TryRunResult,
} from './types.ts';

function milliseconds(
  value: number,
  name: string,
  zero: boolean = false,
): number {
  if (
    !Number.isInteger(value) ||
    value < (zero ? 0 : 1) ||
    value > 2147483647
  ) {
    throw new ConcurrentConfigurationError(
      `${name} must be an integer in ${zero ? '0' : '1'}..2147483647`,
    );
  }
  return value;
}
function nonempty(value: string, name: string): void {
  if (typeof value !== 'string' || value.length === 0)
    throw new ConcurrentConfigurationError(`${name} must be nonempty`);
}
function supported(options: object): void {
  if (
    ('owner' in options && options.owner !== undefined) ||
    ('priority' in options && options.priority !== undefined) ||
    ('autoRenew' in options &&
      options.autoRenew !== undefined &&
      options.autoRenew !== false)
  ) {
    throw new ConcurrentConfigurationError(
      'Owner, priority and automatic renewal are unsupported',
    );
  }
}
function related(value: unknown, reason: unknown): boolean {
  const visited = new Set<unknown>();
  try {
    while (value !== null && value !== undefined && !visited.has(value)) {
      if (value === reason) return true;
      visited.add(value);
      if (
        (typeof value !== 'object' && typeof value !== 'function') ||
        !('cause' in value)
      )
        break;
      value = value.cause;
    }
  } catch {
    /* Untrusted cause access must not replace a business exception. */
  }
  return false;
}

class ManagedLease implements Lease {
  private inFlight?: Promise<void>;
  private released = false;
  private loss?: ConcurrentLeaseLostError;
  private cancelTimer: () => void = () => {};
  private timerVersion = 0;
  readonly controller = new AbortController();
  constructor(
    private readonly runtime: Runtime,
    private readonly grant: BackendGrant,
  ) {
    this.armLossTimer();
  }
  private armLossTimer(): void {
    const version = ++this.timerVersion;
    const remaining = this.grant.notAfter - this.runtime.context.clock.now();
    this.cancelTimer = this.runtime.context.scheduler.setTimer(
      () => {
        if (version !== this.timerVersion) return;
        if (!this.checkLoss()) this.armLossTimer();
      },
      Number.isFinite(remaining) ? Math.max(0, Math.ceil(remaining)) : 0,
    );
  }
  checkLoss(): ConcurrentLeaseLostError | undefined {
    if (!this.loss && this.runtime.context.clock.now() >= this.grant.notAfter) {
      this.loss = new ConcurrentLeaseLostError(
        'The conservative lease budget is exhausted',
      );
      this.controller.abort(this.loss);
    }
    return this.loss;
  }
  release(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    if (this.released) return Promise.resolve();
    this.timerVersion++;
    this.cancelTimer();
    const work = this.runtime.track(async () => {
      try {
        await this.grant.release();
      } catch (cause) {
        throw new ConcurrentReleaseError(
          'Lease release failed; cleanup can be retried',
          { cause },
        );
      }
      this.released = true;
      this.runtime.leases.delete(this);
      this.runtime.abandoned.delete(this);
      this.runtime.changed();
    });
    this.inFlight = work;
    void work.then(
      () => {
        this.inFlight = undefined;
      },
      () => {
        this.inFlight = undefined;
      },
    );
    return work;
  }
}

class Runtime implements ConcurrentRuntime, ConcurrentManager {
  readonly manager: ConcurrentManager = this;
  readonly capabilities: ConcurrentCapabilities;
  readonly leases = new Set<ManagedLease>();
  readonly abandoned = new Set<ManagedLease>();
  private readonly operations = new Set<Promise<unknown>>();
  private readonly waiting = new Set<AbortController>();
  private readonly observers = new Set<() => void>();
  private state: 'open' | 'closing' | 'closed' = 'open';
  private sessionClose?: Promise<void>;
  private sessionClosed = false;
  constructor(
    readonly context: BackendContext,
    private readonly session: ConcurrentBackendSession,
    private readonly options: ConcurrentRuntimeOptions,
  ) {
    this.capabilities = Object.freeze({ ...session.capabilities });
  }
  changed(): void {
    for (const notify of [...this.observers]) notify();
  }
  diagnostic(phase: ConcurrentDiagnostic['phase'], error: unknown): void {
    try {
      this.options.logger?.({ phase, error });
    } catch {
      /* Diagnostics are never control flow. */
    }
  }
  track<T>(operation: () => Promise<T>): Promise<T> {
    // Register before invoking external code, including a synchronously reentrant backend.
    const work = Promise.resolve().then(operation);
    this.operations.add(work);
    void work.then(
      () => {
        this.operations.delete(work);
        this.changed();
      },
      () => {
        this.operations.delete(work);
        this.changed();
      },
    );
    return work;
  }
  private requireOpen(): void {
    if (this.state !== 'open')
      throw new ConcurrentAcquireError('Runtime is closing or closed');
  }
  private resource(name: string, options: ConcurrentOptions): ResourceSpec {
    this.requireOpen();
    supported(options);
    nonempty(name, 'name');
    return Object.freeze({
      namespace: this.context.namespace,
      kind: 'lock',
      name,
      ttl: milliseconds(options.ttl ?? 30000, 'ttl'),
    });
  }
  createLock(name: string, options: ConcurrentOptions = {}): Promise<Lock> {
    return this.track(async () => {
      const resource = this.resource(name, options);
      if (!this.capabilities.lock)
        throw new ConcurrentConfigurationError(
          'Lock capability is unavailable',
        );
      await this.session.validateResource(resource);
      this.requireOpen();
      return new ManagedLock(this, resource);
    });
  }
  createSynchronous(
    name: string,
    options: ExecutorOptions = {},
  ): Promise<SynchronousExecutor> {
    return this.track(async () => {
      const resource = this.resource(name, options);
      if (!this.capabilities.executor)
        throw new ConcurrentConfigurationError(
          'Executor capability is unavailable',
        );
      await this.session.validateResource(resource);
      this.requireOpen();
      return new ManagedExecutor(this, resource);
    });
  }
  createSemaphore(
    _name: string,
    _permits: number,
    _options: ConcurrentOptions = {},
  ): Promise<Semaphore> {
    return Promise.reject(
      new ConcurrentConfigurationError(
        'Semaphore capability is unavailable in this protocol implementation',
      ),
    );
  }
  acquire<T>(
    resource: ResourceSpec,
    timeoutMs: number | undefined,
    options: AcquireOptions,
    single: boolean,
    deliver: (lease: ManagedLease) => T | Promise<T>,
  ): Promise<T | undefined> {
    // Take the timestamp at the public entry, not after a microtask or a backend call.
    const start = this.context.clock.now();
    return this.track(async () => {
      this.requireOpen();
      supported(options);
      const timeout = milliseconds(
        timeoutMs ??
          (single ? 0 : (this.options.defaultAcquireTimeoutMs ?? 30000)),
        'timeoutMs',
        single,
      );
      const wait: WaitPolicy =
        timeout === 0
          ? { kind: 'single' }
          : { kind: 'bounded', deadline: start + timeout };
      if (wait.kind === 'bounded' && !Number.isFinite(wait.deadline))
        throw new ConcurrentConfigurationError('Invalid deadline');
      if (options.signal?.aborted)
        throw new ConcurrentAbortError('Acquisition was cancelled', {
          cause: options.signal.reason,
        });
      const controller = new AbortController();
      const onAbort = (): void =>
        controller.abort(
          new ConcurrentAbortError('Acquisition was cancelled', {
            cause: options.signal?.reason,
          }),
        );
      options.signal?.addEventListener('abort', onAbort, { once: true });
      this.waiting.add(controller);
      const cancelDeadline =
        wait.kind === 'bounded'
          ? this.context.scheduler.setTimer(
              () =>
                controller.abort(
                  new ConcurrentAcquireError('Acquisition deadline elapsed'),
                ),
              Math.max(0, wait.deadline - this.context.clock.now()),
            )
          : () => {};
      const deliveryError = (grant?: BackendGrant): Error | undefined => {
        if (options.signal?.aborted || this.state !== 'open')
          return new ConcurrentAbortError(
            'Acquisition cancelled before delivery',
            { cause: controller.signal.reason },
          );
        if (
          (wait.kind === 'bounded' &&
            this.context.clock.now() >= wait.deadline) ||
          (grant &&
            (!Number.isFinite(grant.notAfter) ||
              this.context.clock.now() >= grant.notAfter))
        )
          return new ConcurrentAcquireError(
            'Acquisition or conservative lease budget elapsed before delivery',
          );
        return undefined;
      };
      try {
        const early = deliveryError();
        if (early) throw early;
        let grant: BackendGrant | undefined;
        try {
          grant = await this.session.acquire({
            requestId: randomUUID(),
            token: randomUUID(),
            resource,
            wait,
            signal: controller.signal,
          });
        } catch (cause) {
          if (options.signal?.aborted || this.state !== 'open') {
            this.diagnostic('acquire', cause);
            throw new ConcurrentAbortError('Acquisition cancelled', { cause });
          }
          throw new ConcurrentAcquireError(
            'Backend acquisition failed or its result is unknown',
            { cause },
          );
        }
        if (!grant) {
          const error = deliveryError();
          if (error instanceof ConcurrentAbortError) throw error;
          return undefined;
        }
        const lease = new ManagedLease(this, grant);
        this.leases.add(lease);
        const error = deliveryError(grant);
        if (error) {
          this.abandoned.add(lease);
          try {
            await lease.release();
          } catch (cleanup) {
            this.diagnostic('cleanup', cleanup);
          }
          throw error;
        }
        // No await or external scheduler call between this check and delivery.
        return deliver(lease);
      } finally {
        cancelDeadline();
        options.signal?.removeEventListener('abort', onAbort);
        this.waiting.delete(controller);
        this.changed();
      }
    });
  }
  async execute<T>(
    lease: ManagedLease,
    runner: (context: ExecutorContext) => T | Promise<T>,
  ): Promise<T> {
    let failed = false;
    let business: unknown;
    let value!: T;
    try {
      value = await runner(Object.freeze({ signal: lease.controller.signal }));
    } catch (error) {
      failed = true;
      business = error;
    }
    lease.checkLoss();
    let releaseError: ConcurrentReleaseError | undefined;
    try {
      await lease.release();
    } catch (error) {
      releaseError =
        error instanceof ConcurrentReleaseError
          ? error
          : new ConcurrentReleaseError('Release failed', { cause: error });
      this.abandoned.add(lease);
    }
    const loss = lease.checkLoss();
    if (failed) {
      if (releaseError !== undefined) this.diagnostic('release', releaseError);
      if (loss && related(business, loss)) throw loss;
      if (loss) this.diagnostic('business', loss);
      throw business;
    }
    if (loss) {
      if (releaseError !== undefined) this.diagnostic('release', releaseError);
      throw loss;
    }
    if (releaseError !== undefined) throw releaseError;
    return value;
  }
  close(options: CloseOptions = {}): Promise<void> {
    const timeout = milliseconds(options.timeoutMs ?? 30000, 'close timeoutMs');
    if (this.state === 'closed') return Promise.resolve();
    this.state = 'closing';
    for (const controller of this.waiting)
      controller.abort(new ConcurrentAbortError('Runtime is closing'));
    // Only abandoned executor/late-grant cleanup is retried. Never release a live manual Lease.
    for (const lease of this.abandoned)
      void lease.release().catch((error) => this.diagnostic('cleanup', error));
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let cancelTimer = (): void => {};
      const finish = (error?: ConcurrentCloseError): void => {
        if (settled) return;
        settled = true;
        cancelTimer();
        this.observers.delete(check);
        if (error) reject(error);
        else resolve();
      };
      const check = (): void => {
        if (this.state === 'closed') {
          finish();
          return;
        }
        if (this.operations.size || this.leases.size) return;
        if (this.sessionClosed) {
          this.state = 'closed';
          finish();
          return;
        }
        if (!this.sessionClose) {
          this.sessionClose = Promise.resolve().then(() =>
            this.session.close(),
          );
          void this.sessionClose.then(
            () => {
              this.sessionClosed = true;
              this.changed();
            },
            (cause) => {
              this.sessionClose = undefined;
              finish(
                new ConcurrentCloseError('Backend session close failed', {
                  cause,
                }),
              );
            },
          );
        }
      };
      this.observers.add(check);
      cancelTimer = this.context.scheduler.setTimer(
        () =>
          finish(
            new ConcurrentCloseError(
              'Close wait elapsed; runtime remains closing',
            ),
          ),
        timeout,
      );
      check();
    });
  }
}
class ManagedLock implements Lock {
  constructor(
    private readonly runtime: Runtime,
    private readonly resource: ResourceSpec,
  ) {}
  async lock(options: WaitOptions = {}): Promise<Lease> {
    const lease = await this.runtime.acquire(
      this.resource,
      options.timeoutMs,
      options,
      false,
      (lease) => lease,
    );
    if (!lease)
      throw new ConcurrentAcquireError(
        'Resource was not acquired within the wait budget',
      );
    return lease;
  }
  tryLock(
    timeoutMs?: number,
    options: AcquireOptions = {},
  ): Promise<Lease | undefined> {
    return this.runtime.acquire(
      this.resource,
      timeoutMs,
      options,
      true,
      (lease) => lease,
    );
  }
}
class ManagedExecutor implements SynchronousExecutor {
  constructor(
    private readonly runtime: Runtime,
    private readonly resource: ResourceSpec,
  ) {}
  async run<T>(
    runner: (context: ExecutorContext) => T | Promise<T>,
    options: WaitOptions = {},
  ): Promise<T> {
    const result = await this.runtime.acquire(
      this.resource,
      options.timeoutMs,
      options,
      false,
      (lease) =>
        this.runtime.execute(lease, runner).then((value) => ({ value })),
    );
    if (!result)
      throw new ConcurrentAcquireError(
        'Resource was not acquired within the wait budget',
      );
    return result.value;
  }
  async tryRun<T>(
    runner: (context: ExecutorContext) => T | Promise<T>,
    timeoutMs?: number,
    options: AcquireOptions = {},
  ): Promise<TryRunResult<T>> {
    const result = await this.runtime.acquire(
      this.resource,
      timeoutMs,
      options,
      true,
      (lease) =>
        this.runtime.execute(lease, runner).then((value) => ({ value })),
    );
    return result
      ? { acquired: true, value: result.value }
      : { acquired: false };
  }
}
export async function createConcurrentRuntime(
  options: ConcurrentRuntimeOptions,
): Promise<ConcurrentRuntime> {
  nonempty(options.namespace, 'namespace');
  milliseconds(
    options.defaultAcquireTimeoutMs ?? 30000,
    'defaultAcquireTimeoutMs',
  );
  const context: BackendContext = Object.freeze({
    protocolVersion: 2,
    managerId: randomUUID(),
    namespace: options.namespace,
    operationTimeoutMs: milliseconds(
      options.operationTimeoutMs ?? 5000,
      'operationTimeoutMs',
    ),
    cleanupTimeoutMs: milliseconds(
      options.cleanupTimeoutMs ?? 5000,
      'cleanupTimeoutMs',
    ),
    clock: options.clock ?? defaultClock,
    scheduler: options.scheduler ?? defaultScheduler,
  });
  const session = await options.backend.openSession(context);
  const caps = session.capabilities;
  if (
    session.protocolVersion !== 2 ||
    !caps ||
    typeof caps.lock !== 'boolean' ||
    typeof caps.executor !== 'boolean' ||
    caps.semaphore !== false ||
    caps.autoRenew !== false
  ) {
    try {
      await session.close();
    } catch {
      /* Preserve the incompatible protocol error. */
    }
    throw new ConcurrentConfigurationError(
      'Unsupported backend protocol or capabilities',
    );
  }
  return new Runtime(context, session, { ...options });
}
