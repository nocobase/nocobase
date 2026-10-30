import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentCloseError,
  ConcurrentConfigurationError,
} from '@nocobase/concurrency';
import type { BackendContext } from '@nocobase/concurrency/backend';
import { ManualTime, deferred } from '@nocobase/concurrency/testing';
import { LocalConcurrentBackend } from '../server/index.ts';
import { LocalResourceRegistry } from '../server/mutex/registry.ts';

function context(time: ManualTime): BackendContext {
  return {
    protocolVersion: 1,
    managerId: 'direct',
    namespace: 'direct',
    operationTimeoutMs: 5000,
    cleanupTimeoutMs: 5000,
    clock: time,
    scheduler: time,
  };
}
afterEach(() => vi.restoreAllMocks());

describe('Mutex backend ownership', () => {
  it('rejects repeated direct initialization, including after validation failure', async () => {
    const time = new ManualTime();
    const backend = new LocalConcurrentBackend();
    expect(backend).not.toHaveProperty('openSession');
    await expect(
      backend.initialize({ ...context(time), namespace: '' }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    await expect(backend.initialize(context(time))).rejects.toBeInstanceOf(
      ConcurrentConfigurationError,
    );
    await backend.close();
    await backend.close();
    expect(time.pendingTimers).toBe(0);
  });

  it('drains its registry through runtime close and retries a failed drain before becoming closed', async () => {
    const time = new ManualTime();
    const backend = new LocalConcurrentBackend();
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'drain',
      clock: time,
      scheduler: time,
    });
    const lease = await (await runtime.manager.createLock('r')).lock();
    await lease.release();
    const cause = new Error('Registry drain failed');
    const drain = vi
      .spyOn(LocalResourceRegistry.prototype, 'drain')
      .mockRejectedValueOnce(cause);
    const close = vi.spyOn(backend, 'close');
    await expect(runtime.close()).rejects.toBeInstanceOf(ConcurrentCloseError);
    expect(close).toHaveBeenCalledTimes(1);
    expect(drain).toHaveBeenCalledTimes(1);
    await expect(runtime.manager.createLock('new')).rejects.toBeInstanceOf(
      ConcurrentAcquireError,
    );
    await runtime.close();
    await runtime.close();
    expect(close).toHaveBeenCalledTimes(2);
    expect(drain).toHaveBeenCalledTimes(2);
    expect(time.pendingTimers).toBe(0);
  });

  it('does not cancel another runtime that owns a distinct backend', async () => {
    const time = new ManualTime();
    const first = await createConcurrentRuntime({
      backend: new LocalConcurrentBackend(),
      namespace: 'separate',
      clock: time,
      scheduler: time,
    });
    const second = await createConcurrentRuntime({
      backend: new LocalConcurrentBackend(),
      namespace: 'separate',
      clock: time,
      scheduler: time,
    });
    const entered = deferred<AbortSignal>();
    const end = deferred<void>();
    const executor = await second.manager.createSynchronous('r');
    const work = executor.run(async ({ signal }) => {
      entered.resolve(signal);
      await end.promise;
    });
    const signal = await entered.promise;
    await first.close();
    expect(signal.aborted).toBe(false);
    end.resolve();
    await work;
    await second.close();
    expect(time.pendingTimers).toBe(0);
  });
});
