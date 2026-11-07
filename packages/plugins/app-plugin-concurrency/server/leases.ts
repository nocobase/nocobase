import { ConcurrentReleaseError, type Lease } from '@nocobase/concurrency';
import type { ConcurrencyReporter } from '../shared/types.js';
import { reportSafely } from './diagnostics.js';

export interface ManagedLeaseAcquireOptions {
  readonly signal: AbortSignal;
  readonly acquire: (
    signal: AbortSignal,
  ) => Promise<(() => Promise<void>) | undefined>;
}

class ManagedLease implements Lease {
  private released = false;
  private releasing?: Promise<void>;

  public constructor(
    private readonly nativeRelease: () => Promise<void>,
    private readonly removed: () => void,
  ) {}

  public release(): Promise<void> {
    if (this.released) return Promise.resolve();
    if (this.releasing) return this.releasing;
    this.releasing = Promise.resolve()
      .then(() => this.nativeRelease())
      .then(
        () => {
          this.released = true;
          this.removed();
        },
        (cause: unknown) => {
          throw new ConcurrentReleaseError('Concurrency release failed.', {
            cause,
          });
        },
      )
      .finally(() => {
        this.releasing = undefined;
      });
    return this.releasing;
  }
}

/** Owns confirmed releasers until successful release or explicit disposal. */
export class ManagedLeaseRegistry {
  private readonly active = new Set<ManagedLease>();

  public constructor(
    private readonly report: ConcurrencyReporter | undefined = undefined,
  ) {}

  public register(nativeRelease: () => Promise<void>): Lease {
    const lease = new ManagedLease(nativeRelease, () =>
      this.active.delete(lease),
    );
    this.active.add(lease);
    return lease;
  }

  public async releaseAll(): Promise<void> {
    await Promise.all(
      [...this.active].map((lease) => releaseSafely(lease, this.report)),
    );
  }

  /** Call only after the instance's owned resources have closed. */
  public clear(): void {
    this.active.clear();
  }
}

export async function releaseSafely(
  lease: Lease,
  report: ConcurrencyReporter | undefined,
): Promise<void> {
  try {
    await lease.release();
  } catch (cause) {
    reportSafely(report, { phase: 'cleanup', cause });
  }
}
