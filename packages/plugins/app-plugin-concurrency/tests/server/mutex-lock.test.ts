import { afterEach, expect, it, vi } from 'vitest';
import { Mutex } from 'async-mutex';
import {
  ConcurrentAbortError,
  ConcurrentConfigurationError,
} from '@nocobase/concurrency';
import { MutexConcurrencyInstance } from '../../server/mutex/instance.js';

const instances: MutexConcurrencyInstance[] = [];
function instance(): MutexConcurrencyInstance {
  const value = new MutexConcurrencyInstance({
    adapter: 'mutex',
    key: 'memory',
    namespace: 'test',
  });
  instances.push(value);
  return value;
}
afterEach(async () => {
  for (const value of instances.splice(0)) await value.shutdown();
  vi.restoreAllMocks();
});

it('keeps Lock methods callable without a receiver', async () => {
  const { lock, tryLock } = await instance().manager.createLock('detached');
  const lease = await lock();
  expect(await tryLock()).toBeUndefined();
  await lease.release();
  await (await tryLock())!.release();
});

it('captures the acquisition signal synchronously and reads it once', async () => {
  const lock = await instance().manager.createLock('snapshot');
  const acquire = vi.spyOn(Mutex.prototype, 'acquire');
  const controller = new AbortController();
  const signal = vi.fn(() => controller.signal);
  const result = lock.lock({
    get signal() {
      return signal();
    },
  });
  const observed = result.catch((cause: unknown) => cause);
  expect(signal).toHaveBeenCalledOnce();
  expect(acquire).not.toHaveBeenCalled();
  controller.abort();
  expect(await observed).toBeInstanceOf(ConcurrentAbortError);
  expect(acquire).not.toHaveBeenCalled();
  expect(signal).toHaveBeenCalledOnce();
});

it('validates before allocating and preserves whitespace resource identity', async () => {
  const manager = instance().manager;
  const ttl = vi.fn(() => 0);
  await expect(
    manager.createLock('resource', {
      get ttl() {
        return ttl();
      },
    }),
  ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
  expect(ttl).toHaveBeenCalledOnce();
  const plain = await manager.createLock('resource');
  const spaced = await manager.createLock(' resource ');
  const held = await plain.lock();
  await (await spaced.tryLock())!.release();
  await held.release();
});

it('checks instance closure before reading creation options', async () => {
  const value = instance();
  await value.shutdown();
  const ttl = vi.fn(() => 0);
  await expect(
    value.manager.createLock('', {
      get ttl() {
        return ttl();
      },
    }),
  ).rejects.toBeInstanceOf(ConcurrentAbortError);
  expect(ttl).not.toHaveBeenCalled();
});

it('drains an observation cancelled before its native microtask starts', async () => {
  const value = instance();
  const lock = await value.manager.createLock('before-native');
  const acquire = vi.spyOn(Mutex.prototype, 'acquire');
  const pending = lock.lock().catch((cause: unknown) => cause);
  const closing = value.shutdown();
  expect(await pending).toBeInstanceOf(ConcurrentAbortError);
  await closing;
  expect(acquire).not.toHaveBeenCalled();
});

it('shutdown waits for a late native grant and releases its original releaser', async () => {
  const value = instance();
  const lock = await value.manager.createLock('late-native');
  const grant = Promise.withResolvers<() => void>();
  vi.spyOn(Mutex.prototype, 'acquire').mockImplementationOnce(
    () => grant.promise,
  );
  const pending = lock.lock().catch((cause: unknown) => cause);
  await Promise.resolve();
  let closed = false;
  const closing = value.shutdown();
  void closing.then(() => {
    closed = true;
  });
  expect(value.shutdown()).toBe(closing);
  expect(await pending).toBeInstanceOf(ConcurrentAbortError);
  expect(closed).toBe(false);
  const release = vi.fn();
  grant.resolve(release);
  await closing;
  expect(release).toHaveBeenCalledOnce();
  expect(closed).toBe(true);
});
