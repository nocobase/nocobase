export interface ConcurrentOptions {
  /** Renewable lease duration in milliseconds; process-local Mutex ignores it. */
  ttl?: number;
}
export interface AcquireOptions {
  signal?: AbortSignal;
}
export interface Lease {
  release(): Promise<void>;
}
export interface Lock {
  lock(options?: AcquireOptions): Promise<Lease>;
  tryLock(
    timeoutMs?: number,
    options?: AcquireOptions,
  ): Promise<Lease | undefined>;
}
export type TryRunResult<T> =
  { acquired: true; value: T } | { acquired: false };
export interface SynchronousExecutor {
  run<T>(runner: () => T | Promise<T>, options?: AcquireOptions): Promise<T>;
  tryRun<T>(
    runner: () => T | Promise<T>,
    timeoutMs?: number,
    options?: AcquireOptions,
  ): Promise<TryRunResult<T>>;
}
export interface ConcurrentManager {
  createLock(name: string, options?: ConcurrentOptions): Promise<Lock>;
  createSynchronous(
    name: string,
    options?: ConcurrentOptions,
  ): Promise<SynchronousExecutor>;
}
