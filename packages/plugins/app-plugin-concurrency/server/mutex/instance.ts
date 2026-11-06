import { Mutex } from 'async-mutex';
import {
  ConcurrentAbortError,
  type ConcurrentOptions,
  type ConcurrentManager,
  type Lock,
  type Lease,
  type SynchronousExecutor,
} from '@nocobase/concurrency';
import type {
  ConcurrencyInstance,
  ConcurrencyReporter,
  ResolvedConcurrencyConfig,
} from '../../shared/types.js';
import { ManagedLeaseRegistry } from '../leases.js';
import { startAcquire } from '../acquire.js';
import { reportSafely } from '../diagnostics.js';
import type { ManagedLeaseAcquireOptions } from '../leases.js';
import { createSynchronousExecutor } from '../executor.js';
import { createMutexLock, validateLockCreation } from './lock.js';

export class MutexConcurrencyInstance
  implements ConcurrencyInstance, ConcurrentManager
{
  public readonly manager: ConcurrentManager;
  private readonly resources = new Map<string, Mutex>();
  private readonly controller = new AbortController();
  private readonly leases: ManagedLeaseRegistry;
  private readonly pending = new Set<Promise<void>>();
  private stopping?: Promise<void>;
  private closed = false;

  public constructor(
    _config: ResolvedConcurrencyConfig,
    private readonly report: ConcurrencyReporter | undefined = undefined,
  ) {
    this.leases = new ManagedLeaseRegistry(report);
    this.manager = {
      createLock: (name, options) => this.createLock(name, options),
      createSynchronous: (name, options) =>
        this.createSynchronous(name, options),
    };
  }
  public start(): Promise<void> {
    return this.controller.signal.aborted
      ? Promise.reject(
          new ConcurrentAbortError('Concurrency instance is closed.'),
        )
      : Promise.resolve();
  }
  public async createLock(
    name: string,
    options?: ConcurrentOptions,
  ): Promise<Lock> {
    if (this.controller.signal.aborted)
      throw new ConcurrentAbortError('Concurrency instance is closed.');
    validateLockCreation(name, options);
    return createMutexLock(this.getOrCreateMutex(name), {
      shutdownSignal: this.controller.signal,
      request: (request) => this.requestAcquire(request),
    });
  }

  private getOrCreateMutex(name: string): Mutex {
    let mutex = this.resources.get(name);
    if (!mutex) {
      mutex = new Mutex();
      this.resources.set(name, mutex);
    }
    return mutex;
  }
  public async createSynchronous(
    name: string,
    options?: ConcurrentOptions,
  ): Promise<SynchronousExecutor> {
    return createSynchronousExecutor(
      await this.createLock(name, options),
      this.report,
    );
  }
  private requestAcquire(
    options: ManagedLeaseAcquireOptions,
  ): Promise<Lease | undefined> {
    const task = startAcquire(this.leases, options, this.report);
    if (task.completion) this.trackPending(task.completion);
    return task.result;
  }

  private trackPending(completion: Promise<void>): void {
    this.pending.add(completion);
    void completion
      .finally(() => this.pending.delete(completion))
      .catch((cause: unknown) => {
        reportSafely(this.report, { phase: 'cleanup', cause });
      });
  }

  private async settlePending(): Promise<void> {
    while (this.pending.size) await Promise.allSettled([...this.pending]);
  }

  public shutdown(): Promise<void> {
    if (this.closed) return Promise.resolve();
    if (this.stopping) return this.stopping;
    this.controller.abort();
    for (const mutex of this.resources.values()) mutex.cancel();
    this.stopping = Promise.resolve()
      .then(async () => {
        await this.settlePending();
        await this.leases.releaseAll();
        this.leases.clear();
        this.resources.clear();
        this.closed = true;
      })
      .finally(() => {
        this.stopping = undefined;
      });
    return this.stopping;
  }
}
