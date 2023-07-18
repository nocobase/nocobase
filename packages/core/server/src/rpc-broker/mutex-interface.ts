export interface AcquireLockOptions {
  lockName: string;
  timeout?: number;
  retryDelay?: number;
  maxRetries?: number;
}

export interface MutexInterface {
  acquireLock(options: AcquireLockOptions): Promise<string | null>;

  releaseLock(lockName: string, identifier: string): Promise<boolean>;
}
