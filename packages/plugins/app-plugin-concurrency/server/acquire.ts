import {
  ConcurrentAbortError,
  ConcurrentAcquireError,
  type Lease,
} from '@nocobase/concurrency';
import type { ConcurrencyReporter } from '../shared/types.js';
import { reportSafely } from './diagnostics.js';
import {
  releaseSafely,
  type ManagedLeaseAcquireOptions,
  type ManagedLeaseRegistry,
} from './leases.js';

export interface AcquireTask {
  readonly result: Promise<Lease | undefined>;
  /** Settles after native acquisition and any late-grant cleanup. */
  readonly completion?: Promise<void>;
}

class AcquireRequest {
  private ended = false;
  private resolve!: (lease: Lease | undefined) => void;
  private reject!: (cause: unknown) => void;

  public constructor(
    private readonly registry: ManagedLeaseRegistry,
    private readonly signal: AbortSignal,
    private readonly acquire: ManagedLeaseAcquireOptions['acquire'],
    private readonly report: ConcurrencyReporter | undefined,
  ) {}

  public start(): AcquireTask {
    if (this.signal.aborted)
      return {
        result: Promise.reject(
          new ConcurrentAbortError('Concurrency acquisition was aborted.'),
        ),
      };
    let completion: Promise<void> | undefined;
    const result = new Promise<Lease | undefined>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.signal.addEventListener('abort', this.abort, { once: true });
      if (this.signal.aborted) {
        this.abort();
        return;
      }
      completion = Promise.resolve()
        .then(() => {
          if (this.signal.aborted) return undefined;
          const acquire = this.acquire;
          return acquire(this.signal);
        })
        .then(
          (releaser) => this.acquired(releaser),
          (cause: unknown) => this.failed(cause),
        );
    });
    return completion ? { result, completion } : { result };
  }

  private readonly abort = (): void => {
    if (this.ended) return;
    this.finish();
    this.reject(
      new ConcurrentAbortError('Concurrency acquisition was aborted.'),
    );
  };

  private async acquired(
    releaser: (() => Promise<void>) | undefined,
  ): Promise<void> {
    if (this.signal.aborted) this.abort();
    if (!releaser) {
      if (!this.ended) {
        this.finish();
        this.resolve(undefined);
      }
      return;
    }
    const lease = this.registry.register(releaser);
    if (this.ended) {
      await releaseSafely(lease, this.report);
      return;
    }
    this.finish();
    this.resolve(lease);
  }

  private failed(cause: unknown): void {
    if (this.signal.aborted) this.abort();
    if (!this.ended) {
      this.finish();
      this.reject(
        cause instanceof Error
          ? cause
          : new ConcurrentAcquireError('Concurrency acquisition failed.', {
              cause,
            }),
      );
    } else reportSafely(this.report, { phase: 'acquire', cause });
  }

  private finish(): void {
    this.ended = true;
    this.signal.removeEventListener('abort', this.abort);
  }
}

/** Starts one request; the instance must observe and drain completion. */
export function startAcquire(
  registry: ManagedLeaseRegistry,
  options: ManagedLeaseAcquireOptions,
  report?: ConcurrencyReporter,
): AcquireTask {
  const { signal, acquire } = options;
  return new AcquireRequest(registry, signal, acquire, report).start();
}
