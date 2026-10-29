import { describe, expect, it, vi } from 'vitest';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentAbortError,
  ConcurrentCloseError,
  ConcurrentLeaseLostError,
} from '../src/index.ts';
import type { Scheduler } from '../src/backend/index.ts';
import {
  ControlledBackend,
  ManualTime,
  deferred,
} from '../src/testing/index.ts';

async function flush(): Promise<void> {
  for (let i = 0; i < 40; i++) await Promise.resolve();
}
function failure(work: Promise<unknown>): Promise<unknown> {
  return work.then(
    () => {
      throw new Error('Expected failure');
    },
    (error: unknown) => error,
  );
}

describe('Confirmed grants and scheduler failures', () => {
  for (const method of ['lock', 'tryLock', 'run', 'tryRun'] as const) {
    it.each([false, true])(
      `${method} retains a grant when monitoring registration fails; release fails once: %s`,
      async (releaseFails) => {
        const time = new ManualTime();
        const cause = new Error('Lease timer registration failed');
        const callbacks: (() => void)[] = [];
        let attempts = 0;
        const scheduler: Scheduler = {
          setTimer(notify, delay) {
            callbacks.push(notify);
            if (++attempts === 1) throw cause;
            return time.setTimer(notify, delay);
          },
        };
        let held = false;
        const release = vi.fn(async () => {
          if (releaseFails && release.mock.calls.length === 1)
            throw new Error('Release failed');
          held = false;
        });
        const close = vi.fn(async () => {
          if (held) throw new ConcurrentCloseError('Unreturned grant');
        });
        const backend = new ControlledBackend({
          acquire: async () => {
            held = true;
            return { notAfter: time.now() + 100, release };
          },
          close,
        });
        const runtime = await createConcurrentRuntime({
          backend,
          namespace: 'timer-failure',
          clock: time,
          scheduler,
        });
        const lock = await runtime.manager.createLock('r');
        const executor = await runtime.manager.createSynchronous('r');
        const runner = vi.fn(() => 42);
        const work =
          method === 'lock'
            ? lock.lock()
            : method === 'tryLock'
              ? lock.tryLock()
              : method === 'run'
                ? executor.run(runner)
                : executor.tryRun(runner);
        const error = await failure(work);
        expect(error).toBeInstanceOf(ConcurrentAcquireError);
        expect(error).toHaveProperty('cause', cause);
        expect(runner).not.toHaveBeenCalled();
        expect(release).toHaveBeenCalledTimes(1);
        const count = attempts;
        callbacks[0]();
        expect(attempts).toBe(count);
        time.advance(101);
        time.flush();
        await runtime.close();
        await runtime.close();
        expect(release).toHaveBeenCalledTimes(releaseFails ? 2 : 1);
        expect(close).toHaveBeenCalledTimes(1);
        expect(held).toBe(false);
        expect(time.pendingTimers).toBe(0);
        callbacks[0]();
        expect(time.pendingTimers).toBe(0);
      },
    );
  }

  it('reports monitoring loss rather than throwing from an early callback when rearming fails', async () => {
    const time = new ManualTime();
    const callbacks: (() => void)[] = [];
    const cause = new Error('Rearm failed');
    let calls = 0;
    const scheduler: Scheduler = {
      setTimer(notify, delay) {
        callbacks.push(notify);
        if (++calls === 2) throw cause;
        return time.setTimer(notify, delay);
      },
    };
    const release = vi.fn(async () => {});
    const backend = new ControlledBackend({
      acquire: async () => ({ notAfter: 100, release }),
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'rearm',
      clock: time,
      scheduler,
    });
    const end = deferred<void>();
    const entered = deferred<AbortSignal>();
    const executor = await runtime.manager.createSynchronous('r');
    const result = failure(
      executor.run(async ({ signal }) => {
        entered.resolve(signal);
        await end.promise;
      }),
    );
    const signal = await entered.promise;
    time.advance(1);
    expect(() => callbacks[0]()).not.toThrow();
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeInstanceOf(ConcurrentLeaseLostError);
    expect(signal.reason).toHaveProperty('cause', cause);
    end.resolve();
    expect(await result).toBe(signal.reason);
    expect(release).toHaveBeenCalledTimes(1);
    await runtime.close();
    expect(time.pendingTimers).toBe(0);
  });

  it('does not let a timer cancellation failure prevent grant release', async () => {
    const time = new ManualTime();
    const cause = new Error('Cancellation failed');
    let calls = 0;
    const scheduler: Scheduler = {
      setTimer(notify, delay) {
        const cancel = time.setTimer(notify, delay);
        if (++calls !== 1) return cancel;
        return () => {
          cancel();
          throw cause;
        };
      },
    };
    const logger = vi.fn();
    const release = vi.fn(async () => {});
    const runtime = await createConcurrentRuntime({
      backend: new ControlledBackend({
        acquire: async () => ({ notAfter: 100, release }),
      }),
      namespace: 'cancel',
      clock: time,
      scheduler,
      logger,
    });
    const lease = await (await runtime.manager.createLock('r')).lock();
    await lease.release();
    await runtime.close();
    expect(release).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith({ phase: 'cleanup', error: cause });
    expect(time.pendingTimers).toBe(0);
  });
});

describe('Reentrant scheduler cleanup', () => {
  it.each(['abort', 'close'] as const)(
    'retains cancellation priority when timer registration triggers %s and throws',
    async (mode) => {
      const time = new ManualTime();
      const controller = new AbortController();
      const cause = new Error('Registration failed after cancellation');
      let calls = 0;
      const stop = (): Promise<void> => runtime.close();
      let closing: Promise<void> | undefined;
      const scheduler: Scheduler = {
        setTimer(notify, delay) {
          if (++calls === 1) {
            if (mode === 'abort') controller.abort();
            else closing = stop();
            throw cause;
          }
          return time.setTimer(notify, delay);
        },
      };
      const release = vi.fn(async () => {});
      const runtime = await createConcurrentRuntime({
        backend: new ControlledBackend({
          acquire: async () => ({ notAfter: 100, release }),
        }),
        namespace: 'reentrant',
        clock: time,
        scheduler,
      });
      const lock = await runtime.manager.createLock('r');
      const error = await failure(lock.lock({ signal: controller.signal }));
      expect(error).toBeInstanceOf(ConcurrentAbortError);
      expect(release).toHaveBeenCalledTimes(1);
      await (closing ?? runtime.close());
      expect(time.pendingTimers).toBe(0);
    },
  );

  it('publishes the release promise before invoking a reentrant timer cancellation', async () => {
    const time = new ManualTime();
    const again = (): Promise<void> => lease.release();
    let nested: Promise<void> | undefined;
    const scheduler: Scheduler = {
      setTimer(notify, delay) {
        const cancel = time.setTimer(notify, delay);
        return () => {
          cancel();
          if (delay === 100) nested = again();
        };
      },
    };
    const release = vi.fn(async () => {});
    const runtime = await createConcurrentRuntime({
      backend: new ControlledBackend({
        acquire: async () => ({ notAfter: 100, release }),
      }),
      namespace: 'reentrant-release',
      clock: time,
      scheduler,
    });
    const lease = await (await runtime.manager.createLock('r')).lock();
    const work = lease.release();
    expect(nested).toBe(work);
    await work;
    await runtime.close();
    expect(release).toHaveBeenCalledTimes(1);
    expect(time.pendingTimers).toBe(0);
  });
});
describe('Close wait deadlines', () => {
  it.each(['complete', 'timeout'] as const)(
    'rechecks monotonic time after early/stale notifications: %s',
    async (outcome) => {
      const time = new ManualTime();
      const callbacks: { notify: () => void; delay: number }[] = [];
      const scheduler: Scheduler = {
        setTimer(notify, delay) {
          callbacks.push({ notify, delay });
          return time.setTimer(notify, delay);
        },
      };
      const gate = deferred<void>();
      const close = vi.fn(() => gate.promise);
      const runtime = await createConcurrentRuntime({
        backend: new ControlledBackend({
          acquire: async () => undefined,
          close,
        }),
        namespace: 'close',
        clock: time,
        scheduler,
      });
      let settled = false;
      const closing = runtime.close({ timeoutMs: 10 }).then(
        () => {
          settled = true;
          return undefined;
        },
        (error: unknown) => {
          settled = true;
          return error;
        },
      );
      await flush();
      expect(callbacks[0].delay).toBe(10);
      time.advance(9.25);
      callbacks[0].notify();
      await flush();
      expect(settled).toBe(false);
      expect(callbacks[1].delay).toBe(1);
      expect(time.pendingTimers).toBe(1);
      callbacks[0].notify();
      expect(callbacks).toHaveLength(2);
      time.advance(0.25);
      callbacks[1].notify();
      await flush();
      expect(settled).toBe(false);
      expect(callbacks[2].delay).toBe(1);
      if (outcome === 'complete') {
        gate.resolve();
        expect(await closing).toBeUndefined();
      } else {
        time.advance(0.5);
        callbacks[2].notify();
        expect(await closing).toBeInstanceOf(ConcurrentCloseError);
        gate.resolve();
        await flush();
        await runtime.close();
      }
      expect(close).toHaveBeenCalledTimes(1);
      const count = callbacks.length;
      for (const callback of callbacks) callback.notify();
      expect(callbacks).toHaveLength(count);
      expect(time.pendingTimers).toBe(0);
    },
  );

  it('invalidates a timed-out wait without cancelling or expiring a later close wait', async () => {
    const time = new ManualTime();
    const callbacks: (() => void)[] = [];
    const scheduler: Scheduler = {
      setTimer(notify, delay) {
        callbacks.push(notify);
        return time.setTimer(notify, delay);
      },
    };
    const gate = deferred<void>();
    const close = vi.fn(() => gate.promise);
    const runtime = await createConcurrentRuntime({
      backend: new ControlledBackend({ acquire: async () => undefined, close }),
      namespace: 'retry',
      clock: time,
      scheduler,
    });
    const first = failure(runtime.close({ timeoutMs: 10 }));
    await flush();
    time.advance(10);
    callbacks[0]();
    expect(await first).toBeInstanceOf(ConcurrentCloseError);
    let settled = false;
    const second = runtime.close({ timeoutMs: 10 }).then(() => {
      settled = true;
    });
    callbacks[0]();
    time.advance(9.25);
    callbacks[1]();
    await flush();
    expect(settled).toBe(false);
    gate.resolve();
    await second;
    expect(close).toHaveBeenCalledTimes(1);
    for (const callback of callbacks) callback();
    expect(time.pendingTimers).toBe(0);
  });

  it.each([1, 2])(
    'removes its observer after close timer registration fails on call %s',
    async (failAt) => {
      const time = new ManualTime();
      const callbacks: (() => void)[] = [];
      const cause = new Error('Close timer registration failed');
      let calls = 0;
      const scheduler: Scheduler = {
        setTimer(notify, delay) {
          callbacks.push(notify);
          if (++calls === failAt) throw cause;
          return time.setTimer(notify, delay);
        },
      };
      const gate = deferred<void>();
      const close = vi.fn(() => gate.promise);
      const runtime = await createConcurrentRuntime({
        backend: new ControlledBackend({
          acquire: async () => undefined,
          close,
        }),
        namespace: 'registration',
        clock: time,
        scheduler,
      });
      const result = failure(runtime.close({ timeoutMs: 10 }));
      await flush();
      if (failAt === 2) {
        time.advance(9.25);
        callbacks[0]();
      }
      const error = await result;
      expect(error).toBeInstanceOf(ConcurrentCloseError);
      expect(error).toHaveProperty('cause', cause);
      const count = callbacks.length;
      for (const callback of callbacks) callback();
      expect(callbacks).toHaveLength(count);
      gate.resolve();
      await flush();
      expect(close).toHaveBeenCalledTimes(failAt === 1 ? 0 : 1);
      await runtime.close();
      expect(close).toHaveBeenCalledTimes(1);
      expect(time.pendingTimers).toBe(0);
    },
  );
});
