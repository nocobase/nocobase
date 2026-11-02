import {
  Mutex,
  tryAcquire,
  withTimeout,
  E_TIMEOUT,
  E_ALREADY_LOCKED,
} from 'async-mutex';
import {
  ConcurrentAbortError,
  ConcurrentAcquireError,
  ConcurrentConfigurationError,
  type AcquireOptions,
  type ConcurrentOptions,
  type Lease,
  type Lock,
} from '@nocobase/concurrency';
import type { ManagedLeaseAcquireOptions } from '../leases.js';

interface MutexLockContext {
  readonly shutdownSignal: AbortSignal;
  readonly request: (
    options: ManagedLeaseAcquireOptions,
  ) => Promise<Lease | undefined>;
}

function optionsObject(value: unknown, field: string): void {
  if (value === undefined) return;
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null) ||
    Reflect.ownKeys(value).some((key) => key !== field)
  ) {
    throw new ConcurrentConfigurationError('Invalid concurrency options.');
  }
}
function milliseconds(value: unknown, zero: boolean): void {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < (zero ? 0 : 1) ||
    value > 2147483647
  )
    throw new ConcurrentConfigurationError(
      'Expected an integer millisecond value within the supported timer range.',
    );
}

export function validateLockCreation(
  name: string,
  options?: ConcurrentOptions,
): void {
  if (typeof name !== 'string' || !name.length)
    throw new ConcurrentConfigurationError(
      'Resource name must be a non-empty string.',
    );
  optionsObject(options, 'ttl');
  const override = options?.ttl;
  if (override !== undefined) milliseconds(override, false);
}

async function acquireMutex(
  resource: Mutex,
  timeout: number | undefined,
  signal: AbortSignal,
): Promise<(() => Promise<void>) | undefined> {
  try {
    const native =
      timeout === undefined
        ? resource
        : timeout === 0
          ? tryAcquire(resource)
          : withTimeout(resource, timeout);
    const release = await native.acquire();
    return () => {
      release();
      return Promise.resolve();
    };
  } catch (cause) {
    if (signal.aborted)
      throw new ConcurrentAbortError('Concurrency acquisition was aborted.', {
        cause,
      });
    if (
      timeout !== undefined &&
      cause === (timeout === 0 ? E_ALREADY_LOCKED : E_TIMEOUT)
    )
      return undefined;
    throw new ConcurrentAcquireError('Concurrency acquisition failed.', {
      cause,
    });
  }
}

function request(
  resource: Mutex,
  context: MutexLockContext,
  timeout: number | undefined,
  options?: AcquireOptions,
): Promise<Lease | undefined> {
  optionsObject(options, 'signal');
  const originalSignal = options?.signal;
  if (originalSignal !== undefined && !(originalSignal instanceof AbortSignal))
    throw new ConcurrentConfigurationError('Expected an AbortSignal.');
  if (timeout !== undefined) milliseconds(timeout, true);
  const signal = originalSignal
    ? AbortSignal.any([originalSignal, context.shutdownSignal])
    : context.shutdownSignal;
  return context.request({
    signal,
    acquire: () => acquireMutex(resource, timeout, signal),
  });
}

export function createMutexLock(
  resource: Mutex,
  context: MutexLockContext,
): Lock {
  return {
    async lock(options?: AcquireOptions): Promise<Lease> {
      const lease = await request(resource, context, undefined, options);
      if (!lease)
        throw new ConcurrentAcquireError(
          'Ordinary acquisition returned no lease.',
        );
      return lease;
    },
    async tryLock(
      timeoutMs: number = 0,
      options?: AcquireOptions,
    ): Promise<Lease | undefined> {
      return request(resource, context, timeoutMs, options);
    },
  };
}
