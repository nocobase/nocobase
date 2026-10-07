/**
 * Wakes runners waiting in a long-poll claim when work may have arrived. In-process only: other instances' runners
 * find the work on their next poll, at most `TIMINGS.pollTimeoutMs` later.
 */
export interface WorkSignal {
  notify(): void;
  /** Resolves at the next `notify`, after `timeoutMs`, or when `abort` fires, whichever comes first. */
  wait(
    timeoutMs: number,
    abort?: AbortSignal,
  ): Promise<'notified' | 'timeout' | 'aborted'>;
  /** How many requests are waiting. */
  waiting(): number;
}

export function createWorkSignal(): WorkSignal {
  const waiters = new Set<() => void>();
  return {
    notify() {
      for (const wake of [...waiters]) wake();
    },
    wait(timeoutMs, abort) {
      return new Promise((resolve) => {
        if (abort?.aborted) {
          resolve('aborted');
          return;
        }
        const finish = (outcome: 'notified' | 'timeout' | 'aborted') => {
          waiters.delete(wake);
          clearTimeout(timer);
          abort?.removeEventListener('abort', onAbort);
          resolve(outcome);
        };
        const wake = () => finish('notified');
        const onAbort = () => finish('aborted');
        waiters.add(wake);
        const timer = setTimeout(() => finish('timeout'), timeoutMs);
        abort?.addEventListener('abort', onAbort, { once: true });
      });
    },
    waiting: () => waiters.size,
  };
}
