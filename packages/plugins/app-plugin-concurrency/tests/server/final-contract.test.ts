import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mutex } from 'async-mutex';
import {
  ConcurrentAbortError,
  ConcurrentConfigurationError,
  ConcurrentReleaseError,
} from '@nocobase/concurrency';
import { MutexConcurrencyInstance } from '../../server/mutex/instance.js';
import {
  ManagedLeaseRegistry,
  startAcquire,
  createSynchronousExecutor,
  encodeResourceKey,
} from '../../server/index.js';
import { ManagedConcurrencyService } from '../../server/services/concurrency.js';
import { resolveConcurrencyConfig } from '../../config/resolve.js';

const instances: MutexConcurrencyInstance[] = [];
function mutex(ttl?: number): MutexConcurrencyInstance {
  const instance = new MutexConcurrencyInstance({
    adapter: 'mutex',
    key: 'memory',
    namespace: 'test',
    ...(ttl === undefined ? {} : { ttl }),
  });
  instances.push(instance);
  return instance;
}
afterEach(async () => {
  for (const instance of instances.splice(0)) await instance.shutdown();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('C01/C02/C05: same-name locks and executor share native competition; other names do not', async () => {
  const { manager } = mutex();
  const left = await manager.createLock('same');
  const right = await manager.createLock('same');
  const other = await manager.createLock('other');
  const executor = await manager.createSynchronous('same');
  const held = await left.lock();
  expect(await right.tryLock()).toBeUndefined();
  expect(await executor.tryRun(() => 'wrong')).toEqual({ acquired: false });
  await (await other.lock()).release();
  await held.release();
  expect(await executor.tryRun(() => 'ok')).toEqual({
    acquired: true,
    value: 'ok',
  });
});
it('C04/C08: ordinary waits have no TTL or default wait deadline', async () => {
  vi.useFakeTimers();
  const lock = await mutex().manager.createLock('ordinary');
  const lease = await lock.lock();
  expect(vi.getTimerCount()).toBe(0);
  let delivered = false;
  const waiting = lock.lock().then((result) => {
    delivered = true;
    return result;
  });
  await vi.advanceTimersByTimeAsync(120000);
  expect(delivered).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  await lease.release();
  await (await waiting).release();
});
it('C06: native timeout does not resurrect and the native late releaser is returned', async () => {
  vi.useFakeTimers();
  const lock = await mutex().manager.createLock('timeout');
  const held = await lock.lock();
  const attempt = lock.tryLock(10);
  await vi.advanceTimersByTimeAsync(10);
  expect(await attempt).toBeUndefined();
  await held.release();
  await vi.advanceTimersByTimeAsync(0);
  const next = lock.tryLock();
  await vi.advanceTimersByTimeAsync(0);
  await (await next)!.release();
});
it('C09/C10/C13/C14: request signal is captured once, does not cancel peers or delivered leases', async () => {
  const lock = await mutex().manager.createLock('cancel');
  const held = await lock.lock();
  const original = new AbortController();
  const replacement = new AbortController();
  let current = original.signal;
  const getter = vi.fn(() => current);
  const waiting = lock.lock({
    get signal() {
      return getter();
    },
  });
  const rejected = waiting.catch((error: unknown) => error);
  current = replacement.signal;
  replacement.abort();
  const peer = lock.lock();
  original.abort();
  expect(await rejected).toBeInstanceOf(ConcurrentAbortError);
  expect(getter).toHaveBeenCalledTimes(1);
  await held.release();
  await (await peer).release();
  const after = new AbortController();
  const delivered = await lock.lock({ signal: after.signal });
  after.abort();
  expect(await lock.tryLock()).toBeUndefined();
  await delivered.release();
  await expect(
    lock.lock({ signal: AbortSignal.abort() }),
  ).rejects.toBeInstanceOf(ConcurrentAbortError);
});
it.each([undefined, 1, 2147483647])(
  'C03/C04/C08/C15/S03: local ttl %s never expires ownership or creates holding timers',
  async (ttl) => {
    vi.useFakeTimers();
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const { manager } = mutex(ttl);
    const lock = await manager.createLock('ttl', { ttl });
    const peer = await manager.createLock('ttl', { ttl: 7 });
    const lease = await lock.lock();
    expect(vi.getTimerCount()).toBe(0);
    let entered = false;
    const waiting = peer.lock().then((next) => {
      entered = true;
      return next;
    });
    await vi.advanceTimersByTimeAsync(2147483648);
    expect(entered).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    await lease.release();
    const successor = await waiting;
    await lease.release();
    let behindEntered = false;
    const behind = lock.lock().then((next) => {
      behindEntered = true;
      return next;
    });
    await vi.advanceTimersByTimeAsync(2147483648);
    expect(behindEntered).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    await successor.release();
    await (await behind).release();
    expect(schedule).not.toHaveBeenCalled();
  },
);
it.each(['resolve', 'reject'] as const)(
  'C03/C20: local executor holds beyond ttl until its runner %s',
  async (outcome) => {
    vi.useFakeTimers();
    const { manager } = mutex(5);
    const executor = await manager.createSynchronous('runner-ttl', { ttl: 10 });
    const peer = await manager.createLock('runner-ttl', { ttl: 20 });
    const peerExecutor = await manager.createSynchronous('runner-ttl', {
      ttl: 30,
    });
    const finish = Promise.withResolvers<string>();
    const started = Promise.withResolvers<void>();
    const running = executor.run(() => {
      started.resolve();
      return finish.promise;
    });
    const observed = running.catch((cause: unknown) => cause);
    await started.promise;
    let entered = false;
    const waiting = peer.lock().then((lease) => {
      entered = true;
      return lease;
    });
    const runner = vi.fn(() => 'wrong');
    const attempt = peerExecutor.tryRun(runner, 15);
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(await attempt).toEqual({ acquired: false });
    expect(runner).not.toHaveBeenCalled();
    expect(entered).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    const result = new Error('original business failure');
    if (outcome === 'resolve') finish.resolve('actual');
    else finish.reject(result);
    expect(await observed).toBe(outcome === 'resolve' ? 'actual' : result);
    await (await waiting).release();
  },
);
it('C21/C22/C26: shutdown rejects new work, interrupts waiters, releases holders, and does not drain runners', async () => {
  const instance = mutex();
  const lock = await instance.manager.createLock('close');
  const held = await lock.lock();
  const pending = lock.lock().catch((error: unknown) => error);
  const runnerDone = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();
  const executor = await instance.manager.createSynchronous('runner');
  const runner = executor.run(() => {
    started.resolve();
    return runnerDone.promise;
  });
  await started.promise;
  const closing = instance.shutdown();
  expect(instance.shutdown()).toBe(closing);
  await closing;
  expect(await pending).toBeInstanceOf(ConcurrentAbortError);
  await held.release();
  await expect(lock.lock()).rejects.toBeInstanceOf(ConcurrentAbortError);
  await expect(instance.manager.createLock('new')).rejects.toBeInstanceOf(
    ConcurrentAbortError,
  );
  runnerDone.resolve();
  await runner;
  await instance.shutdown();
});

describe('public releaser tools', () => {
  it('C07: accepts explicit native success without a second deadline', async () => {
    vi.useFakeTimers();
    const native = Promise.withResolvers<() => Promise<void>>();
    const registry = new ManagedLeaseRegistry();
    const task = startAcquire(registry, {
      signal: new AbortController().signal,
      acquire: () => native.promise,
    });
    await vi.advanceTimersByTimeAsync(120000);
    const release = vi.fn(async () => {});
    native.resolve(release);
    await (await task.result)!.release();
    expect(release).toHaveBeenCalledTimes(1);
  });
  it('C09/C11/C12/C23: pre-abort issues nothing; late success releases without TTL; late rejection is consumed', async () => {
    vi.useFakeTimers();
    const report = vi.fn();
    const registry = new ManagedLeaseRegistry(report);
    const acquire = vi.fn(async () => undefined);
    await expect(
      startAcquire(registry, { signal: AbortSignal.abort(), acquire }, report)
        .result,
    ).rejects.toBeInstanceOf(ConcurrentAbortError);
    expect(acquire).not.toHaveBeenCalled();
    const native = Promise.withResolvers<() => Promise<void>>();
    const controller = new AbortController();
    const task = startAcquire(
      registry,
      {
        signal: controller.signal,
        acquire: () => native.promise,
      },
      report,
    );
    const rejected = task.result.catch((error: unknown) => error);
    await Promise.resolve();
    controller.abort();
    expect(await rejected).toBeInstanceOf(ConcurrentAbortError);
    const release = vi.fn(async () => {});
    native.resolve(release);
    await task.completion;
    expect(release).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    const failing = Promise.withResolvers<() => Promise<void>>();
    const cancelled = new AbortController();
    const failingTask = startAcquire(
      registry,
      {
        signal: cancelled.signal,
        acquire: () => failing.promise,
      },
      report,
    );
    const error = failingTask.result.catch((cause: unknown) => cause);
    await Promise.resolve();
    cancelled.abort();
    failing.reject(new Error('native'));
    expect(await error).toBeInstanceOf(ConcurrentAbortError);
    await failingTask.completion;
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'acquire' }),
    );
  });
  it('C16: native synchronous acquisition errors are observed without phantom leases', async () => {
    vi.useFakeTimers();
    const registry = new ManagedLeaseRegistry();
    const cause = new Error('native acquire');
    const acquire = vi.fn(() => {
      throw cause;
    });
    const task = startAcquire(registry, {
      signal: new AbortController().signal,
      acquire,
    });
    await expect(task.result).rejects.toBe(cause);
    const nonError = startAcquire(registry, {
      signal: new AbortController().signal,
      acquire: () => {
        throw 'native acquire';
      },
    });
    await expect(nonError.result).rejects.toMatchObject({
      name: 'ConcurrentAcquireError',
      cause: 'native acquire',
    });
    await Promise.all([task.completion, nonError.completion]);
    await registry.releaseAll();
    expect(acquire).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('C17/C24/C27: shared release, explicit retry, failed cleanup continues, broken diagnostics are isolated', async () => {
    const report = vi.fn(() => Promise.reject(new Error('diagnostic')));
    const registry = new ManagedLeaseRegistry(report);
    const barrier = Promise.withResolvers<void>();
    const release = vi
      .fn()
      .mockImplementationOnce(() => barrier.promise)
      .mockResolvedValue(undefined);
    const lease = registry.register(release);
    const first = lease.release();
    expect(lease.release()).toBe(first);
    const rejected = first.catch((error: unknown) => error);
    barrier.reject(new Error('release'));
    expect(await rejected).toBeInstanceOf(ConcurrentReleaseError);
    await lease.release();
    await lease.release();
    expect(release).toHaveBeenCalledTimes(2);
    const failing = vi.fn(async () => {
      throw new Error('cleanup');
    });
    const good = vi.fn(async () => {});
    registry.register(failing);
    registry.register(good);
    await registry.releaseAll();
    expect(good).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalled();
    registry.clear();
  });
  it('C18/C19/C27: executor preserves sync/async business values and exact errors despite release/report failures', async () => {
    const error = new Error('business');
    const release = vi.fn(async () => {
      throw new Error('release');
    });
    const executor = createSynchronousExecutor(
      { lock: async () => ({ release }), tryLock: async () => ({ release }) },
      () => {
        throw new Error('report');
      },
    );
    expect(await executor.run(() => 42)).toBe(42);
    expect(await executor.run(async () => 43)).toBe(43);
    await expect(
      executor.run(() => {
        throw error;
      }),
    ).rejects.toBe(error);
    await expect(
      executor.run(async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(release).toHaveBeenCalledTimes(4);
  });
});
it('S02/S03/S04/S05: strict selectors, optional TTL, frozen lazy entries, namespace uniqueness', async () => {
  const config = {
    default: 'memory',
    memory: { adapter: 'mutex' },
    lazy: { adapter: 'mutex', namespace: 'other' },
    duplicate: { adapter: 'mutex' },
  };
  const snapshot = resolveConcurrencyConfig(config, 'app');
  expect(snapshot.entries.get('memory')?.ttl).toBeUndefined();
  expect(Object.isFrozen(snapshot.entries.get('lazy'))).toBe(true);
  const service = new ManagedConcurrencyService({
    appName: 'app',
    nodeEnv: 'development',
  });
  service.boot(config);
  config.lazy.namespace = 'changed';
  service.configurationChanged();
  await service.start();
  const [a, b] = await Promise.all([
    service.getManager('lazy'),
    service.getManager('lazy'),
  ]);
  expect(a).toBe(b);
  await expect(service.getManager('duplicate')).rejects.toBeInstanceOf(
    ConcurrentConfigurationError,
  );
  await expect(service.getManager('unknown')).rejects.toBeInstanceOf(
    ConcurrentConfigurationError,
  );
  for (const field of [
    'operationTimeoutMs',
    'cleanupTimeoutMs',
    'shutdownTimeoutMs',
  ])
    expect(() =>
      resolveConcurrencyConfig(
        { memory: { adapter: 'mutex', [field]: 10 } },
        'app',
      ),
    ).toThrow(ConcurrentConfigurationError);
  await service.shutdown();
});
it('resource encoding preserves tuple identity including Unicode and separators', () => {
  const tuples = [
    ['a:b', 'c'],
    ['a', 'b:c'],
    ['汉字', 'a/ b'],
    ['a', '"\\\n'],
  ];
  const keys = tuples.map(([namespace, name]) =>
    encodeResourceKey(namespace!, name!),
  );
  expect(new Set(keys).size).toBe(tuples.length);
  keys.forEach((key, i) =>
    expect(
      JSON.parse(
        Buffer.from(
          key.slice('nb-concurrency:v2:'.length),
          'base64url',
        ).toString(),
      ),
    ).toEqual(tuples[i]),
  );
});

it('C07: real withTimeout success is accepted when its timer has not fired despite elapsed wall time', async () => {
  vi.useFakeTimers();
  const lock = await mutex().manager.createLock('native-success');
  const holder = await lock.lock();
  const waiting = lock.tryLock(10);
  await Promise.resolve();
  vi.setSystemTime(Date.now() + 1000);
  await holder.release();
  const lease = await waiting;
  expect(lease).toBeDefined();
  await lease!.release();
});
it.each([
  'lock',
  'tryLock',
  'boundedLock',
  'run',
  'tryRun',
  'boundedRun',
] as const)(
  'C13/C14: %s snapshots options before asynchronous work and keeps delivered work independent',
  async (method) => {
    const instance = mutex();
    const lock = await instance.manager.createLock('snapshot-method');
    const executor =
      await instance.manager.createSynchronous('snapshot-method');
    const holder = await lock.lock();
    const controller = new AbortController();
    const replacement = new AbortController();
    const options = { signal: controller.signal };
    const runner = vi.fn(() => 'value');
    const work =
      method === 'lock'
        ? lock.lock(options)
        : method === 'tryLock'
          ? lock.tryLock(0, options)
          : method === 'boundedLock'
            ? lock.tryLock(1000, options)
            : method === 'run'
              ? executor.run(runner, options)
              : method === 'tryRun'
                ? executor.tryRun(runner, 0, options)
                : executor.tryRun(runner, 1000, options);
    const observed = work.catch((error: unknown) => error);
    options.signal = replacement.signal;
    controller.abort();
    expect(await observed).toBeInstanceOf(ConcurrentAbortError);
    expect(runner).not.toHaveBeenCalled();
    await holder.release();
  },
);
it('C16/C11: cleanup failure retains the same native releaser for explicit close cleanup', async () => {
  const report = vi.fn();
  const registry = new ManagedLeaseRegistry(report);
  const native = Promise.withResolvers<() => Promise<void>>();
  const controller = new AbortController();
  const task = startAcquire(
    registry,
    {
      signal: controller.signal,
      acquire: () => native.promise,
    },
    report,
  );
  const pending = task.result.catch((error: unknown) => error);
  await Promise.resolve();
  controller.abort();
  expect(await pending).toBeInstanceOf(ConcurrentAbortError);
  const release = vi
    .fn()
    .mockRejectedValueOnce(new Error('release'))
    .mockResolvedValue(undefined);
  native.resolve(release);
  await task.completion;
  expect(release).toHaveBeenCalledTimes(1);
  await registry.releaseAll();
  expect(release).toHaveBeenCalledTimes(2);
  expect(report).toHaveBeenCalledWith(
    expect.objectContaining({ phase: 'cleanup' }),
  );
  registry.clear();
});
it.each([null, undefined, false, 0, 'business'])(
  'C18: preserves arbitrary thrown business values (%s)',
  async (value) => {
    const executor = await mutex().manager.createSynchronous('arbitrary-error');
    await expect(
      executor.run(() => {
        throw value;
      }),
    ).rejects.toBe(value);
  },
);
it('S03: creation and acquisition reject invalid values and extra fields without accepting no-op options', async () => {
  const manager = mutex().manager;
  const lock = await manager.createLock('validation');
  for (const value of [0, -1, 0.5, NaN, Infinity, 2147483648]) {
    await expect(
      manager.createLock('validation', { ttl: value }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
  }
  for (const value of [-1, 0.5, NaN, Infinity, 2147483648]) {
    await expect(lock.tryLock(value)).rejects.toBeInstanceOf(
      ConcurrentConfigurationError,
    );
  }
  await expect(manager.createLock('')).rejects.toBeInstanceOf(
    ConcurrentConfigurationError,
  );
  await expect(
    manager.createLock('validation', { ttl: 10, extra: false } as never),
  ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
  await expect(lock.lock({ extra: undefined } as never)).rejects.toBeInstanceOf(
    ConcurrentConfigurationError,
  );
});

it('C16: a synchronous native Mutex acquisition failure preserves its cause and leaves no occupancy', async () => {
  const manager = mutex().manager;
  const lock = await manager.createLock('native-throw', { ttl: 1 });
  const cause = new Error('native acquire');
  vi.spyOn(Mutex.prototype, 'acquire').mockImplementationOnce(() => {
    throw cause;
  });
  await expect(lock.lock()).rejects.toMatchObject({
    name: 'ConcurrentAcquireError',
    cause,
  });
  await (await lock.lock()).release();
});
