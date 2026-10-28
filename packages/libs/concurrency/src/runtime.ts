import { randomUUID } from 'node:crypto';
import { defaultClock, defaultScheduler } from './backend/index.ts';
import type {
  BackendContext,
  BackendGrant,
  ConcurrentBackend,
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
  ConcurrentDiagnostic,
  ConcurrentOptions,
  Lock,
  SynchronousExecutor,
  Lease,
  ExecutorContext,
  AcquireOptions,
  CloseOptions,
  TryRunResult,
} from './types.ts';

const ownedBackends = new WeakSet<ConcurrentBackend>();
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
function validateOptions(options: object, allowed: readonly string[]): void {
  for (const key of Reflect.ownKeys(options)) {
    if (typeof key !== 'string' || !allowed.includes(key))
      throw new ConcurrentConfigurationError(`Unknown option: ${String(key)}`);
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
  ) {}
  start(): void {
    this.armLossTimer();
  }
  private armLossTimer(): void {
    const version = ++this.timerVersion;
    const previous = this.cancelTimer;
    this.cancelTimer = () => {};
    this.runtime.cancelTimer(previous);
    const remaining = this.grant.notAfter - this.runtime.context.clock.now();
    const cancel = this.runtime.context.scheduler.setTimer(
      () => {
        if (version !== this.timerVersion) return;
        try {
          if (!this.checkLoss()) this.armLossTimer();
        } catch (cause) {
          this.timerVersion++;
          this.monitoringFailed(cause);
        }
      },
      Number.isFinite(remaining) ? Math.max(0, Math.ceil(remaining)) : 0,
    );
    if (version !== this.timerVersion) this.runtime.cancelTimer(cancel);
    else this.cancelTimer = cancel;
  }
  private monitoringFailed(cause: unknown): ConcurrentLeaseLostError {
    const loss = (this.loss ??= new ConcurrentLeaseLostError(
      'Lease monitoring failed',
      { cause },
    ));
    this.controller.abort(loss);
    this.runtime.diagnostic('cleanup', cause);
    return loss;
  }
  checkLoss(): ConcurrentLeaseLostError | undefined {
    if (this.loss) return this.loss;
    let expired: boolean;
    try {
      expired = this.runtime.context.clock.now() >= this.grant.notAfter;
    } catch (cause) {
      return this.monitoringFailed(cause);
    }
    if (expired && !this.loss) {
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
    const cancel = this.cancelTimer;
    this.cancelTimer = () => {};
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
    this.runtime.cancelTimer(cancel);
    return work;
  }
}

class Runtime implements ConcurrentRuntime, ConcurrentManager {
  readonly manager: ConcurrentManager = this;
  readonly leases = new Set<ManagedLease>();
  readonly abandoned = new Set<ManagedLease>();
  private readonly operations = new Set<Promise<unknown>>();
  private readonly waiting = new Set<AbortController>();
  private readonly observers = new Set<() => void>();
  private state: 'open' | 'closing' | 'closed' = 'open';
  private backendClose?: Promise<void>;
  private backendClosed = false;
  private backendCloseError?: ConcurrentCloseError;
  constructor(
    readonly context: BackendContext,
    private readonly backend: ConcurrentBackend,
    private readonly options: ConcurrentRuntimeOptions,
  ) {}
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
  cancelTimer(cancel: () => void): void {
    try {
      cancel();
    } catch (error) {
      this.diagnostic('cleanup', error);
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
    validateOptions(options, ['ttl']);
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
      await this.backend.validateResource(resource);
      this.requireOpen();
      return new ManagedLock(this, resource);
    });
  }
  createSynchronous(
    name: string,
    options: ConcurrentOptions = {},
  ): Promise<SynchronousExecutor> {
    return this.track(async () => {
      const resource = this.resource(name, options);
      await this.backend.validateResource(resource);
      this.requireOpen();
      return new ManagedExecutor(this, resource);
    });
  }
  acquire<T>(
    resource: ResourceSpec,
    timeoutMs: number | undefined,
    options: AcquireOptions,
    trying: boolean,
    deliver: (lease: ManagedLease) => T | Promise<T>,
  ): Promise<T | undefined> {
    // Take the timestamp at the public entry, not after a microtask or a backend call.
    const start = this.context.clock.now();
    return this.track(async () => {
      this.requireOpen();
      validateOptions(options, ['signal']);
      const timeout = trying
        ? milliseconds(timeoutMs ?? 0, 'timeoutMs', true)
        : 0;
      const wait: WaitPolicy = !trying
        ? { kind: 'unbounded' }
        : timeout === 0
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
      let cancelDeadline = (): void => {};
      let deadlineVersion = 0;
      let deadlineError: ConcurrentAcquireError | undefined;
      const failDeadline = (cause: unknown): void => {
        deadlineError ??= new ConcurrentAcquireError(
          'Acquisition deadline monitoring failed',
          { cause },
        );
        deadlineVersion++;
        const cancel = cancelDeadline;
        cancelDeadline = () => {};
        this.cancelTimer(cancel);
        controller.abort(deadlineError);
      };
      const armDeadline = (): void => {
        if (wait.kind !== 'bounded' || controller.signal.aborted) return;
        const version = ++deadlineVersion;
        const previous = cancelDeadline;
        cancelDeadline = () => {};
        this.cancelTimer(previous);
        try {
          const cancel = this.context.scheduler.setTimer(
            () => {
              if (version !== deadlineVersion || controller.signal.aborted)
                return;
              try {
                if (this.context.clock.now() < wait.deadline) armDeadline();
                else
                  controller.abort(
                    new ConcurrentAcquireError('Acquisition deadline elapsed'),
                  );
              } catch (cause) {
                failDeadline(cause);
              }
            },
            Math.max(0, Math.ceil(wait.deadline - this.context.clock.now())),
          );
          if (version !== deadlineVersion || controller.signal.aborted)
            this.cancelTimer(cancel);
          else cancelDeadline = cancel;
        } catch (cause) {
          failDeadline(cause);
        }
      };
      const deliveryError = (
        grant?: BackendGrant,
        loss?: ConcurrentLeaseLostError,
      ): Error | undefined => {
        if (options.signal?.aborted || this.state !== 'open')
          return new ConcurrentAbortError(
            'Acquisition cancelled before delivery',
            { cause: controller.signal.reason },
          );
        if (deadlineError) return deadlineError;
        if (loss) return loss;
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
        armDeadline();
        const early = deliveryError();
        if (early && (early instanceof ConcurrentAbortError || deadlineError))
          throw early;
        // No backend call has started, so an elapsed wait is a normal miss.
        if (early) return undefined;
        let grant: BackendGrant | undefined;
        try {
          grant = await this.backend.acquire({
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
          if (deadlineError) {
            if (cause !== deadlineError) this.diagnostic('acquire', cause);
            throw deadlineError;
          }
          throw new ConcurrentAcquireError(
            'Backend acquisition failed or its result is unknown',
            { cause },
          );
        }
        if (!grant) {
          const error = deliveryError();
          if (error && (error instanceof ConcurrentAbortError || deadlineError))
            throw error;
          return undefined;
        }
        const lease = new ManagedLease(this, grant);
        this.leases.add(lease);
        let error: Error | undefined;
        try {
          error = deliveryError(grant);
          if (!error) {
            lease.start();
            error = deliveryError(grant, lease.checkLoss());
          }
        } catch (cause) {
          error =
            options.signal?.aborted || this.state !== 'open'
              ? new ConcurrentAbortError(
                  'Acquisition cancelled before delivery',
                  { cause },
                )
              : (deadlineError ??
                new ConcurrentAcquireError('Lease monitoring could not start', {
                  cause,
                }));
        }
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
        deadlineVersion++;
        this.cancelTimer(cancelDeadline);
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
    const deadline = this.context.clock.now() + timeout;
    if (!Number.isFinite(deadline))
      throw new ConcurrentConfigurationError('Invalid close deadline');
    const previousBackendCloseError = this.backendCloseError;
    this.state = 'closing';
    for (const controller of this.waiting)
      controller.abort(new ConcurrentAbortError('Runtime is closing'));
    // Retry only undelivered/abandoned cleanup, never a live manual Lease.
    for (const lease of this.abandoned)
      void lease.release().catch((error) => this.diagnostic('cleanup', error));
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let timerVersion = 0;
      let cancelTimer = (): void => {};
      const finish = (error?: ConcurrentCloseError): void => {
        if (settled) return;
        settled = true;
        timerVersion++;
        this.observers.delete(check);
        this.cancelTimer(cancelTimer);
        if (error) reject(error);
        else resolve();
      };
      const check = (): void => {
        if (settled) return;
        if (this.state === 'closed') {
          finish();
          return;
        }
        if (
          this.backendCloseError &&
          this.backendCloseError !== previousBackendCloseError
        ) {
          finish(this.backendCloseError);
          return;
        }
        if (this.operations.size || this.leases.size) return;
        if (this.backendClosed) {
          this.state = 'closed';
          finish();
          return;
        }
        if (!this.backendClose) {
          this.backendClose = Promise.resolve().then(() =>
            this.backend.close(),
          );
          void this.backendClose.then(
            () => {
              this.backendClosed = true;
              this.changed();
            },
            (cause) => {
              this.backendClose = undefined;
              this.backendCloseError = new ConcurrentCloseError(
                'Backend close failed',
                { cause },
              );
              this.changed();
            },
          );
        }
      };
      const armTimeout = (): void => {
        if (settled) return;
        const version = ++timerVersion;
        const previous = cancelTimer;
        cancelTimer = () => {};
        this.cancelTimer(previous);
        try {
          const remaining = deadline - this.context.clock.now();
          if (!Number.isFinite(remaining))
            throw new ConcurrentConfigurationError('Invalid close deadline');
          if (remaining <= 0) {
            finish(
              new ConcurrentCloseError(
                'Close wait elapsed; runtime remains closing',
              ),
            );
            return;
          }
          const cancel = this.context.scheduler.setTimer(() => {
            if (!settled && version === timerVersion) armTimeout();
          }, Math.ceil(remaining));
          if (settled || version !== timerVersion) this.cancelTimer(cancel);
          else cancelTimer = cancel;
        } catch (cause) {
          finish(
            new ConcurrentCloseError('Close wait timer failed', { cause }),
          );
        }
      };
      this.observers.add(check);
      armTimeout();
      if (!settled) check();
    });
  }
}
class ManagedLock implements Lock {
  constructor(
    private readonly runtime: Runtime,
    private readonly resource: ResourceSpec,
  ) {}
  async lock(options: AcquireOptions = {}): Promise<Lease> {
    const lease = await this.runtime.acquire(
      this.resource,
      undefined,
      options,
      false,
      (lease) => lease,
    );
    if (!lease)
      throw new ConcurrentAcquireError(
        'Backend returned without granting the resource',
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
    options: AcquireOptions = {},
  ): Promise<T> {
    const result = await this.runtime.acquire(
      this.resource,
      undefined,
      options,
      false,
      (lease) =>
        this.runtime.execute(lease, runner).then((value) => ({ value })),
    );
    if (!result)
      throw new ConcurrentAcquireError(
        'Backend returned without granting the resource',
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
  validateOptions(options, [
    'backend',
    'namespace',
    'operationTimeoutMs',
    'cleanupTimeoutMs',
    'clock',
    'scheduler',
    'logger',
  ]);
  const context: BackendContext = Object.freeze({
    protocolVersion: 1,
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
  const backend = options.backend;
  if (ownedBackends.has(backend))
    throw new ConcurrentConfigurationError(
      'Backend is already owned; create a new backend for each runtime',
    );
  ownedBackends.add(backend);
  try {
    if (backend.protocolVersion !== 1)
      throw new ConcurrentConfigurationError('Unsupported backend protocol');
    await backend.initialize(context);
  } catch (error) {
    try {
      await backend.close();
    } catch (cleanup) {
      try {
        options.logger?.({ phase: 'cleanup', error: cleanup });
      } catch {
        /* Preserve initialization failure. */
      }
    }
    throw error;
  }
  return new Runtime(context, backend, { ...options });
}
