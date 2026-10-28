import { afterEach, describe, it, expect, vi } from 'vitest';
import { Mutex } from 'async-mutex';
import { spawnSync } from 'node:child_process';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentAbortError,
} from '@nocobase/concurrency';
import type { BackendContext, Scheduler } from '@nocobase/concurrency/backend';
import { ManualTime } from '@nocobase/concurrency/testing';
import { LocalConcurrentBackend } from '../src/index.ts';
import { LocalResourceRegistry } from '../src/registry.ts';
async function flush(): Promise<void> {
  for (let i = 0; i < 60; i++) await Promise.resolve();
}
afterEach(() => vi.restoreAllMocks());
describe('Retry timer failures', () => {
  it.each(['timer', 'abort', 'close'] as const)(
    'settles acquisition when cancellation throws during %s',
    async (mode) => {
      const time = new ManualTime();
      const callbacks: (() => void)[] = [];
      let calls = 0;
      const cause = new Error('Retry cancellation failed');
      const scheduler: Scheduler = {
        setTimer(notify, delay) {
          callbacks.push(notify);
          const cancel = time.setTimer(notify, delay);
          if (++calls !== 3) return cancel;
          return () => {
            cancel();
            throw cause;
          };
        },
      };
      const runtime = await createConcurrentRuntime({
        backend: new LocalConcurrentBackend(),
        namespace: 'retry',
        clock: time,
        scheduler,
      });
      const lock = await runtime.manager.createLock('r', { ttl: 100 });
      const held = await lock.lock();
      const controller = new AbortController();
      let settled = false;
      const pending = lock.lock({ signal: controller.signal }).then(
        () => {
          settled = true;
          return null;
        },
        (error) => {
          settled = true;
          return error;
        },
      );
      await flush();
      expect(calls).toBe(3);
      let closing: Promise<void> | undefined;
      if (mode === 'timer') expect(() => callbacks[2]()).not.toThrow();
      else if (mode === 'abort') expect(() => controller.abort()).not.toThrow();
      else closing = runtime.close();
      await flush();
      expect(settled).toBe(true);
      const error = await pending;
      expect(error).toBeInstanceOf(
        mode === 'timer' ? ConcurrentAcquireError : ConcurrentAbortError,
      );
      if (mode === 'timer') expect(error).toHaveProperty('cause', cause);
      const count = calls;
      callbacks[2]();
      expect(calls).toBe(count);
      await held.release();
      await (closing ?? runtime.close());
      expect(time.pendingTimers).toBe(0);
    },
  );
  it.each(['timer', 'abort', 'deadline'])(
    'does not crash a native Node process on retry %s cancellation',
    (mode) => {
      const result = spawnSync(
        process.execPath,
        [
          '--experimental-transform-types',
          new URL('./fixtures/retry-failure.mjs', import.meta.url).pathname,
          mode,
        ],
        { encoding: 'utf8', timeout: 5000 },
      );
      expect({ status: result.status, stderr: result.stderr }).toMatchObject({
        status: 0,
      });
      expect(result.stdout).toContain('"settled":true');
    },
  );
});
describe('Confirmed Mutex grant after deadline failure', () => {
  for (const method of ['tryLock', 'tryRun'] as const) {
    it.each([false, true])(
      `${method} returns the grant for cleanup; first release fails: %s`,
      async (releaseFails) => {
        const time = new ManualTime();
        const cause = new Error('Deadline rearm failed');
        let calls = 0;
        let deadlineNotify = () => {};
        const scheduler: Scheduler = {
          setTimer(notify, delay) {
            const call = ++calls;
            if (call === 1) deadlineNotify = notify;
            if (call === 2) {
              time.advance(1);
              deadlineNotify();
            }
            if (call === 3) {
              if (releaseFails)
                vi.spyOn(Mutex.prototype, 'acquire').mockRejectedValueOnce(
                  new Error('Release gate failed'),
                );
              throw cause;
            }
            return time.setTimer(notify, delay);
          },
        };
        const runtime = await createConcurrentRuntime({
          backend: new LocalConcurrentBackend(),
          namespace: 'known-grant',
          clock: time,
          scheduler,
        });
        const lock = await runtime.manager.createLock('r', { ttl: 100 });
        const executor = await runtime.manager.createSynchronous('r', {
          ttl: 100,
        });
        const runner = vi.fn(() => 42);
        const error = await (
          method === 'tryLock' ? lock.tryLock(10) : executor.tryRun(runner, 10)
        ).then(
          () => null,
          (error) => error,
        );
        expect(error).toBeInstanceOf(ConcurrentAcquireError);
        expect(error).toHaveProperty('cause', cause);
        expect(runner).not.toHaveBeenCalled();
        await runtime.close();
        await runtime.close();
        expect(time.pendingTimers).toBe(0);
      },
    );
  }
});
describe('Retry registration boundaries', () => {
  it.each([
    'registration',
    'abort-during-registration',
    'notify-during-registration',
  ] as const)('cleans abort listeners and settles after %s', async (mode) => {
    const added = vi.spyOn(AbortSignal.prototype, 'addEventListener');
    const removed = vi.spyOn(AbortSignal.prototype, 'removeEventListener');
    const time = new ManualTime();
    const controller = new AbortController();
    const cause = new Error('Retry timer setup failed');
    let calls = 0;
    const scheduler: Scheduler = {
      setTimer(notify, delay) {
        if (++calls !== 3) return time.setTimer(notify, delay);
        if (mode === 'registration') throw cause;
        const cancel = time.setTimer(notify, delay);
        if (mode === 'abort-during-registration') controller.abort();
        else notify();
        return () => {
          cancel();
          throw cause;
        };
      },
    };
    const runtime = await createConcurrentRuntime({
      backend: new LocalConcurrentBackend(),
      namespace: 'registration',
      clock: time,
      scheduler,
    });
    const lock = await runtime.manager.createLock('r', { ttl: 100 });
    const held = await lock.lock();
    const error = await lock.lock({ signal: controller.signal }).then(
      () => null,
      (error) => error,
    );
    expect(error).toBeInstanceOf(
      mode === 'abort-during-registration'
        ? ConcurrentAbortError
        : ConcurrentAcquireError,
    );
    await held.release();
    await runtime.close();
    expect(time.pendingTimers).toBe(0);
    for (const [index, [type, listener]] of added.mock.calls.entries()) {
      if (type === 'abort')
        expect(
          removed.mock.calls.some(
            ([removedType, removedListener], i) =>
              removedType === type &&
              removedListener === listener &&
              removed.mock.contexts[i] === added.mock.contexts[index],
          ),
        ).toBe(true);
    }
  });
});
describe('Initial backend resource timer registration', () => {
  it('allows immediate same-name retry after the backend timer fails before a grant is delivered', async () => {
    const time = new ManualTime();
    const cause = new Error('Resource timer registration failed');
    let calls = 0;
    const scheduler: Scheduler = {
      setTimer(notify, delay) {
        if (++calls === 1) throw cause;
        return time.setTimer(notify, delay);
      },
    };
    const runtime = await createConcurrentRuntime({
      backend: new LocalConcurrentBackend(),
      namespace: 'initial-resource',
      clock: time,
      scheduler,
    });
    const lock = await runtime.manager.createLock('r', { ttl: 100 });
    await expect(lock.lock()).rejects.toMatchObject({ cause });
    const lease = await lock.tryLock();
    expect(lease).toBeDefined();
    await lease?.release();
    time.advance(101);
    time.flush();
    await runtime.close();
    expect(time.pendingTimers).toBe(0);
  });
  it('rolls back the original ticket and never lets its callback affect a later holder', async () => {
    const time = new ManualTime();
    const callbacks: (() => void)[] = [];
    let calls = 0;
    const cause = new Error('First resource timer failed');
    const context: BackendContext = {
      protocolVersion: 1,
      managerId: 'test',
      namespace: 'registry',
      operationTimeoutMs: 100,
      cleanupTimeoutMs: 100,
      clock: time,
      scheduler: {
        setTimer(notify, delay) {
          callbacks.push(notify);
          if (++calls === 1) throw cause;
          return time.setTimer(notify, delay);
        },
      },
    };
    const registry = new LocalResourceRegistry(context);
    await expect(
      registry.transition('r', (state, effects) =>
        registry.grant(state, 'old', 100, effects),
      ),
    ).rejects.toBe(cause);
    expect(registry.size).toBe(0);
    expect(time.pendingTimers).toBe(0);
    await registry.transition('r', (state, effects) =>
      registry.grant(state, 'new', 100, effects),
    );
    callbacks[0]();
    await flush();
    expect(registry.size).toBe(1);
    expect(calls).toBe(2);
    await registry.transition('r', (state, effects) => {
      expect(state.holder?.token).toBe('new');
      registry.clear(state, effects);
    });
    time.advance(101);
    time.flush();
    await registry.drain();
    expect(registry.size).toBe(0);
    expect(time.pendingTimers).toBe(0);
  });
});

describe('Failed grant compensation', () => {
  function context(time: ManualTime, scheduler: Scheduler): BackendContext {
    return {
      protocolVersion: 1,
      managerId: 'compensation',
      namespace: 'registry',
      operationTimeoutMs: 100,
      cleanupTimeoutMs: 100,
      clock: time,
      scheduler,
    };
  }
  it('retains rollback for retryable drain when the rollback gate also fails', async () => {
    const time = new ManualTime();
    const cause = new Error('Registration failed');
    const cleanup = new Error('Rollback gate failed');
    let calls = 0;
    const registry = new LocalResourceRegistry(
      context(time, {
        setTimer(notify, delay) {
          if (++calls === 1) {
            vi.spyOn(Mutex.prototype, 'acquire')
              .mockRejectedValueOnce(cleanup)
              .mockRejectedValueOnce(cleanup);
            throw cause;
          }
          return time.setTimer(notify, delay);
        },
      }),
    );
    await expect(
      registry.transition('r', (state, effects) =>
        registry.grant(state, 'old', 100, effects),
      ),
    ).rejects.toBe(cause);
    expect(registry.size).toBe(1);
    await expect(registry.drain()).rejects.toBe(cleanup);
    await registry.drain();
    expect(registry.size).toBe(0);
    expect(time.pendingTimers).toBe(0);
  });
  it('does not roll back a successor token while retrying old compensation', async () => {
    const time = new ManualTime();
    const cause = new Error('Registration failed');
    let calls = 0;
    const registry = new LocalResourceRegistry(
      context(time, {
        setTimer(notify, delay) {
          if (++calls === 1) {
            vi.spyOn(Mutex.prototype, 'acquire').mockRejectedValueOnce(
              new Error('Rollback gate failed'),
            );
            throw cause;
          }
          return time.setTimer(notify, delay);
        },
      }),
    );
    await expect(
      registry.transition('r', (state, effects) =>
        registry.grant(state, 'old', 100, effects),
      ),
    ).rejects.toBe(cause);
    await registry.transition('r', (state, effects) => {
      registry.clear(state, effects);
      registry.grant(state, 'new', 100, effects);
    });
    await registry.drain();
    await registry.transition('r', (state, effects) => {
      expect(state.holder?.token).toBe('new');
      registry.clear(state, effects);
    });
    expect(registry.size).toBe(0);
    expect(time.pendingTimers).toBe(0);
  });
  it('rolls back the new grant even when an earlier cancellation effect caused transition failure', async () => {
    const time = new ManualTime();
    const cause = new Error('Old cancellation failed');
    let calls = 0;
    const registry = new LocalResourceRegistry(
      context(time, {
        setTimer(notify, delay) {
          const cancel = time.setTimer(notify, delay);
          if (++calls !== 1) return cancel;
          return () => {
            cancel();
            throw cause;
          };
        },
      }),
    );
    await registry.transition('r', (state, effects) =>
      registry.grant(state, 'old', 10, effects),
    );
    time.advance(11);
    await expect(
      registry.transition('r', (state, effects) => {
        registry.purge(state, effects);
        registry.grant(state, 'new', 100, effects);
      }),
    ).rejects.toBe(cause);
    await registry.drain();
    expect(registry.size).toBe(0);
    expect(time.pendingTimers).toBe(0);
  });
});
