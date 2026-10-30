import { afterEach, expect, it, vi } from 'vitest';
import {
  ConcurrentAbortError,
  ConcurrentAcquireError,
} from '@nocobase/concurrency';
import { startAcquire } from '../../server/acquire.js';
import { ManagedLeaseRegistry } from '../../server/leases.js';

afterEach(() => vi.restoreAllMocks());

it('pre-abort creates no observation or listener and calls no native acquisition', async () => {
  const signal = AbortSignal.abort();
  const add = vi.spyOn(signal, 'addEventListener');
  const acquire = vi.fn(async () => undefined);
  const task = startAcquire(new ManagedLeaseRegistry(), { signal, acquire });
  await expect(task.result).rejects.toBeInstanceOf(ConcurrentAbortError);
  expect(task.completion).toBeUndefined();
  expect(add).not.toHaveBeenCalled();
  expect(acquire).not.toHaveBeenCalled();
});

it('captures both options once and invokes the native function without a receiver', async () => {
  const controller = new AbortController();
  const signal = vi.fn(() => controller.signal);
  const acquire = vi.fn(
    () =>
      async function (this: void, captured: AbortSignal) {
        expect(this).toBeUndefined();
        expect(captured).toBe(controller.signal);
        return undefined;
      },
  );
  const task = startAcquire(new ManagedLeaseRegistry(), {
    get signal() {
      return signal();
    },
    get acquire() {
      return acquire();
    },
  });
  expect(signal).toHaveBeenCalledOnce();
  expect(acquire).toHaveBeenCalledOnce();
  await expect(task.result).resolves.toBeUndefined();
  await task.completion;
  expect(signal).toHaveBeenCalledOnce();
  expect(acquire).toHaveBeenCalledOnce();
});

it('observes cancellation before the native microtask without issuing the acquisition', async () => {
  const controller = new AbortController();
  const acquire = vi.fn(async () => undefined);
  const task = startAcquire(new ManagedLeaseRegistry(), {
    signal: controller.signal,
    acquire,
  });
  const observed = task.result.catch((cause: unknown) => cause);
  expect(task.completion).toBeInstanceOf(Promise);
  controller.abort();
  expect(await observed).toBeInstanceOf(ConcurrentAbortError);
  await task.completion;
  expect(acquire).not.toHaveBeenCalled();
});

it('handles cancellation during listener registration without issuing an observation', async () => {
  const controller = new AbortController();
  const add = controller.signal.addEventListener.bind(controller.signal);
  vi.spyOn(controller.signal, 'addEventListener').mockImplementation(
    (...args) => {
      add(...args);
      controller.abort();
    },
  );
  const acquire = vi.fn(async () => undefined);
  const task = startAcquire(new ManagedLeaseRegistry(), {
    signal: controller.signal,
    acquire,
  });
  await expect(task.result).rejects.toBeInstanceOf(ConcurrentAbortError);
  expect(task.completion).toBeUndefined();
  expect(acquire).not.toHaveBeenCalled();
});

it('rejects listener registration failures through result rather than throwing synchronously', async () => {
  const signal = new AbortController().signal;
  const cause = new Error('listener');
  vi.spyOn(signal, 'addEventListener').mockImplementation(() => {
    throw cause;
  });
  const task = startAcquire(new ManagedLeaseRegistry(), {
    signal,
    acquire: async () => undefined,
  });
  await expect(task.result).rejects.toBe(cause);
  expect(task.completion).toBeUndefined();
});

it.each(['success', 'miss', 'failure', 'abort'] as const)(
  'removes the exact abort listener after %s',
  async (outcome) => {
    const registry = new ManagedLeaseRegistry();
    const controller = new AbortController();
    const add = vi.spyOn(controller.signal, 'addEventListener');
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const native = Promise.withResolvers<(() => Promise<void>) | undefined>();
    const release = vi.fn(async () => {});
    const task = startAcquire(registry, {
      signal: controller.signal,
      acquire: () => native.promise,
    });
    const observed = task.result.catch((cause: unknown) => cause);
    await Promise.resolve();
    if (outcome === 'abort') controller.abort();
    if (outcome === 'failure') native.reject(new Error('native'));
    else native.resolve(outcome === 'miss' ? undefined : release);
    await observed;
    await task.completion;
    expect(remove).toHaveBeenCalledExactlyOnceWith(
      'abort',
      add.mock.calls[0]![1],
    );
    await registry.releaseAll();
  },
);

it('keeps completion pending until late-grant cleanup and retains a failed releaser', async () => {
  const report = vi.fn();
  const registry = new ManagedLeaseRegistry(report);
  const controller = new AbortController();
  const native = Promise.withResolvers<() => Promise<void>>();
  const cleanup = Promise.withResolvers<void>();
  const release = vi
    .fn()
    .mockImplementationOnce(() => cleanup.promise)
    .mockResolvedValue(undefined);
  const register = vi.spyOn(registry, 'register');
  const task = startAcquire(
    registry,
    { signal: controller.signal, acquire: () => native.promise },
    report,
  );
  const observed = task.result.catch((cause: unknown) => cause);
  let completed = false;
  void task.completion!.then(() => {
    completed = true;
  });
  await Promise.resolve();
  controller.abort();
  expect(await observed).toBeInstanceOf(ConcurrentAbortError);
  native.resolve(release);
  await vi.waitFor(() => expect(release).toHaveBeenCalledOnce());
  expect(register).toHaveBeenCalledExactlyOnceWith(release);
  expect(completed).toBe(false);
  cleanup.reject(new Error('cleanup'));
  await task.completion;
  expect(completed).toBe(true);
  await registry.releaseAll();
  expect(release).toHaveBeenCalledTimes(2);
  expect(register).toHaveBeenCalledOnce();
  expect(report).toHaveBeenCalledWith(
    expect.objectContaining({ phase: 'cleanup' }),
  );
});

it('keeps a delivered lease independent from later acquisition cancellation', async () => {
  const registry = new ManagedLeaseRegistry();
  const controller = new AbortController();
  const release = vi.fn(async () => {});
  const task = startAcquire(registry, {
    signal: controller.signal,
    acquire: async () => release,
  });
  const lease = await task.result;
  controller.abort();
  await task.completion;
  expect(release).not.toHaveBeenCalled();
  await lease!.release();
  expect(release).toHaveBeenCalledOnce();
});

it.each([new Error('native'), 'native', undefined])(
  'preserves native failure classification (%s)',
  async (cause) => {
    const task = startAcquire(new ManagedLeaseRegistry(), {
      signal: new AbortController().signal,
      acquire: () => {
        throw cause;
      },
    });
    if (cause instanceof Error) await expect(task.result).rejects.toBe(cause);
    else
      await expect(task.result).rejects.toMatchObject({
        name: ConcurrentAcquireError.name,
        cause,
      });
    await task.completion;
  },
);
