import type { Clock, Scheduler, ConcurrentBackend } from './backend/index.ts';

export interface ConcurrentOptions {
  ttl?: number;
}
export interface AcquireOptions {
  signal?: AbortSignal;
}
export interface Lease {
  release(): Promise<void>;
}
export interface ExecutorContext {
  readonly signal: AbortSignal;
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
  run<T>(
    runner: (context: ExecutorContext) => T | Promise<T>,
    options?: AcquireOptions,
  ): Promise<T>;
  tryRun<T>(
    runner: (context: ExecutorContext) => T | Promise<T>,
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
export interface CloseOptions {
  timeoutMs?: number;
}
export interface ConcurrentRuntime {
  readonly manager: ConcurrentManager;
  /** Drain real work, then close the backend; failed or timed-out close can be retried. */
  close(options?: CloseOptions): Promise<void>;
}
export interface ConcurrentDiagnostic {
  readonly phase: 'acquire' | 'release' | 'cleanup' | 'business';
  readonly error: unknown;
}
export interface ConcurrentRuntimeOptions {
  /** Transfers ownership of a fresh backend; do not share or reuse it. */
  backend: ConcurrentBackend;
  namespace: string;
  operationTimeoutMs?: number;
  cleanupTimeoutMs?: number;
  clock?: Clock;
  scheduler?: Scheduler;
  logger?: (diagnostic: ConcurrentDiagnostic) => void;
}
