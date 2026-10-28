import { randomUUID } from 'node:crypto';
import {
  createConcurrentRuntime,
  ConcurrentAbortError,
  ConcurrentAcquireError,
  ConcurrentConfigurationError,
} from '../index.ts';
import type {
  ConcurrentBackend,
  BackendContext,
  BackendAcquireRequest,
  BackendGrant,
  Clock,
  Scheduler,
  ConcurrentBackendSession,
  ResourceSpec,
} from '../backend/index.ts';
export * from '../errors.ts';

export interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}
export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
/** Explicit time movement; callbacks run only when flush() is requested. */
export class ManualTime implements Clock, Scheduler {
  private time = 0;
  private sequence = 0;
  private readonly timers = new Map<
    number,
    { due: number; callback: () => void }
  >();
  now(): number {
    return this.time;
  }
  setTimer(callback: () => void, delayMs: number): () => void {
    const id = ++this.sequence;
    this.timers.set(id, { due: this.time + delayMs, callback });
    return () => {
      this.timers.delete(id);
    };
  }
  advance(milliseconds: number): void {
    this.time += milliseconds;
  }
  flush(): void {
    const due = [...this.timers.entries()].filter(
      ([, timer]) => timer.due <= this.time,
    );
    for (const [id, timer] of due) {
      if (this.timers.delete(id)) timer.callback();
    }
  }
  get pendingTimers(): number {
    return this.timers.size;
  }
}
export interface ControlledBackendHooks {
  acquire(
    request: BackendAcquireRequest,
    context: BackendContext,
  ): Promise<BackendGrant | undefined>;
  validateResource?(resource: ResourceSpec): Promise<void>;
  closeSession?(): Promise<void>;
}
/** Fault fixture only: no competition engine and no private controls required of adapters. */
export class ControlledBackend implements ConcurrentBackend {
  readonly contexts: BackendContext[] = [];
  readonly requests: BackendAcquireRequest[] = [];
  constructor(private readonly hooks: ControlledBackendHooks) {}
  async openSession(
    context: BackendContext,
  ): Promise<ConcurrentBackendSession> {
    this.contexts.push(context);
    return {
      protocolVersion: 1,
      capabilities: {
        lock: true,
        executor: true,
        semaphore: false,
        autoRenew: false,
      },
      validateResource: async (resource) => {
        await this.hooks.validateResource?.(resource);
      },
      acquire: (request) => {
        this.requests.push(request);
        return this.hooks.acquire(request, context);
      },
      close: async () => {
        await this.hooks.closeSession?.();
      },
    };
  }
  async close(): Promise<void> {}
}
export interface BackendContractDriver {
  createBackend(): ConcurrentBackend | Promise<ConcurrentBackend>;
}
export interface ContractResult {
  readonly cases: readonly string[];
}
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Backend contract failed: ${message}`);
}
async function rejects(
  operation: () => Promise<unknown>,
  expected: new (message?: string) => Error,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    check(error instanceof expected, `expected ${expected.name}`);
    return;
  }
  throw new Error(
    `Backend contract failed: expected rejection ${expected.name}`,
  );
}
/** Runs through public APIs only. Adapter-specific network/fault matrices remain separate. */
export async function runBackendContract(
  driver: BackendContractDriver,
): Promise<ContractResult> {
  const backend = await driver.createBackend();
  const namespace = `contract:${randomUUID()}`;
  const a = await createConcurrentRuntime({ backend, namespace });
  const b = await createConcurrentRuntime({ backend, namespace });
  const isolated = await createConcurrentRuntime({
    backend,
    namespace: `${namespace}:isolated`,
  });
  const cases: string[] = [];
  try {
    const lock = await a.manager.createLock('shared');
    const contender = await b.manager.createLock('shared');
    const executor = await b.manager.createSynchronous('shared');
    const lease = await lock.lock();
    try {
      check(
        (await contender.tryLock()) === undefined,
        'shared managers compete',
      );
      check(
        !(await executor.tryRun(() => 1)).acquired,
        'executor shares lock kind',
      );
      check((await contender.tryLock(1)) === undefined, 'bounded busy');
      const separate = await (
        await isolated.manager.createLock('shared')
      ).lock();
      await separate.release();
      const abort = new AbortController();
      abort.abort();
      await rejects(
        () => contender.tryLock(0, { signal: abort.signal }),
        ConcurrentAbortError,
      );
    } finally {
      await lease.release();
    }
    await lease.release();
    cases.push(
      'competition',
      'namespace isolation',
      'single and bounded busy',
      'pre-cancellation',
      'repeat release',
    );
    check((await executor.run(() => 42)) === 42, 'executor result');
    const marker = new Error('business marker');
    let threw = false;
    try {
      await executor.run(() => {
        throw marker;
      });
    } catch (error) {
      threw = true;
      check(error === marker, 'business identity');
    }
    check(threw, 'business exception must be propagated');
    const next = await contender.tryLock();
    check(next !== undefined, 'executor cleanup');
    await next?.release();
    await rejects(
      () => a.manager.createSemaphore('s', 2),
      ConcurrentConfigurationError,
    );
    await rejects(
      () => a.manager.createSynchronous('r', { autoRenew: true }),
      ConcurrentConfigurationError,
    );
    cases.push(
      'executor result and cleanup',
      'business identity',
      'capability rejection',
    );
  } finally {
    await a.close();
    await b.close();
    await isolated.close();
    await backend.close();
  }
  return { cases };
}

/** Core-only deterministic fault contract; production backends need no fault control API. */
export async function runCoreFaultContract(): Promise<ContractResult> {
  const cases: string[] = [];
  for (const mode of ['abort', 'deadline', 'ttl'] as const) {
    const time = new ManualTime();
    const entered = deferred<void>();
    const response = deferred<BackendGrant | undefined>();
    let releases = 0;
    let ran = false;
    const backend = new ControlledBackend({
      acquire: () => {
        entered.resolve();
        return response.promise;
      },
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'fault',
      clock: time,
      scheduler: time,
    });
    const executor = await runtime.manager.createSynchronous('resource');
    const controller = new AbortController();
    const expected =
      mode === 'abort' ? ConcurrentAbortError : ConcurrentAcquireError;
    const runner = (): void => {
      ran = true;
    };
    const result = rejects(
      () =>
        mode === 'deadline'
          ? executor.tryRun(runner, 10, { signal: controller.signal })
          : executor.run(runner, { signal: controller.signal }),
      expected,
    );
    await entered.promise;
    if (mode === 'abort') controller.abort();
    if (mode === 'deadline') time.advance(10);
    response.resolve({
      notAfter: mode === 'ttl' ? 0 : 30000,
      release: async () => {
        releases++;
      },
    });
    await result;
    check(!ran && releases === 1, `late ${mode} grant cleanup`);
    await runtime.close();
    check(time.pendingTimers === 0, 'fault timer cleanup');
    cases.push(`late ${mode} grant`);
  }
  for (const method of ['lock', 'run'] as const) {
    const time = new ManualTime();
    const entered = deferred<BackendAcquireRequest>();
    const response = deferred<BackendGrant | undefined>();
    const backend = new ControlledBackend({
      acquire: (request) => {
        entered.resolve(request);
        return response.promise;
      },
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'unbounded',
      clock: time,
      scheduler: time,
    });
    const lock = await runtime.manager.createLock('r');
    const executor = await runtime.manager.createSynchronous('r');
    let ran = false;
    const work =
      method === 'lock'
        ? lock.lock().then((lease) => lease.release())
        : executor.run(() => {
            ran = true;
          });
    const request = await entered.promise;
    check(request.wait.kind === 'unbounded', 'ordinary wait policy');
    check(time.pendingTimers === 0, 'ordinary wait has no deadline timer');
    time.advance(60000);
    time.flush();
    check(!request.signal.aborted && !ran, 'ordinary wait survives 30 seconds');
    response.resolve({ notAfter: time.now() + 30000, release: async () => {} });
    await work;
    check(method === 'lock' || ran, 'ordinary runner starts after grant');
    check(
      backend.requests.length === 1,
      'core does not retry ordinary acquisition',
    );
    await runtime.close();
    check(time.pendingTimers === 0, 'ordinary wait cleanup');
    cases.push(`unbounded ${method}`);
  }
  return { cases };
}
