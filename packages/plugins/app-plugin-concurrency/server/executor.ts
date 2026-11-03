import type {
  AcquireOptions,
  Lock,
  SynchronousExecutor,
  TryRunResult,
  Lease,
} from '@nocobase/concurrency';
import type { ConcurrencyReporter } from '../shared/types.js';
import { reportSafely } from './diagnostics.js';

export function createSynchronousExecutor(
  lock: Lock,
  report?: ConcurrencyReporter,
): SynchronousExecutor {
  const execute = async <T>(
    lease: Lease,
    runner: () => T | Promise<T>,
  ): Promise<T> => {
    try {
      return await runner();
    } finally {
      try {
        await lease.release();
      } catch (cause) {
        reportSafely(report, { phase: 'release', cause });
      }
    }
  };
  return {
    async run<T>(
      runner: () => T | Promise<T>,
      options?: AcquireOptions,
    ): Promise<T> {
      return execute(await lock.lock(options), runner);
    },
    async tryRun<T>(
      runner: () => T | Promise<T>,
      timeoutMs?: number,
      options?: AcquireOptions,
    ): Promise<TryRunResult<T>> {
      const lease = await lock.tryLock(timeoutMs, options);
      return lease
        ? { acquired: true, value: await execute(lease, runner) }
        : { acquired: false };
    },
  };
}
