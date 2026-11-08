/** The time, injectable so tests can move it. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** `date` plus `ms` milliseconds, as ISO 8601. */
export function later(date: Date, ms: number): string {
  return new Date(date.getTime() + ms).toISOString();
}

/** Whether ISO 8601 `at` is before `date`; null is never. */
export function isBefore(at: string | null | undefined, date: Date): boolean {
  return at !== null && at !== undefined && Date.parse(at) < date.getTime();
}

/** Waits `ms`, or until `signal` aborts. */
export function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(done, ms);
    function done(): void {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
    signal?.addEventListener('abort', done, { once: true });
  });
}
