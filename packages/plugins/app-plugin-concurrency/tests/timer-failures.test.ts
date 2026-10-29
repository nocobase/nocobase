import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mutex } from 'async-mutex';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
} from '@nocobase/concurrency';
import type { Scheduler } from '@nocobase/concurrency/backend';
import { ManualTime, deferred } from '@nocobase/concurrency/testing';
import { LocalConcurrentBackend } from '../server/index.ts';

async function flush(): Promise<void> {
  for (let i = 0; i < 50; i++) await Promise.resolve();
}
afterEach(() => vi.restoreAllMocks());

describe('Mutex grant and close timers', () => {
  for (const method of ['lock', 'run'] as const) {
    it.each([false, true])(
      `${method} returns an undelivered grant after core timer registration fails; release fails once: %s`,
      async (releaseFails) => {
        const time = new ManualTime();
        const cause = new Error('Core lease timer registration failed');
        let calls = 0;
        const scheduler: Scheduler = {
          setTimer(notify, delay) {
            if (++calls === 2) {
              if (releaseFails)
                vi.spyOn(Mutex.prototype, 'acquire').mockRejectedValueOnce(
                  new Error('Release gate failed'),
                );
              throw cause;
            }
            return time.setTimer(notify, delay);
          },
        };
        const backend = new LocalConcurrentBackend();
        const runtime = await createConcurrentRuntime({
          backend,
          namespace: 'timer-failure',
          clock: time,
          scheduler,
        });
        const lock = await runtime.manager.createLock('r', { ttl: 100 });
        const executor = await runtime.manager.createSynchronous('r', {
          ttl: 100,
        });
        const runner = vi.fn(() => 42);
        const error = await (
          method === 'lock' ? lock.lock() : executor.run(runner)
        ).then(
          () => {
            throw new Error('Expected monitoring failure');
          },
          (error: unknown) => error,
        );
        expect(error).toBeInstanceOf(ConcurrentAcquireError);
        expect(error).toHaveProperty('cause', cause);
        expect(runner).not.toHaveBeenCalled();
        time.advance(101);
        time.flush();
        await flush();
        await runtime.close();
        await runtime.close();
        expect(time.pendingTimers).toBe(0);
      },
    );
  }

  it('finishes close after an early notification when a real runner completes within budget', async () => {
    const time = new ManualTime();
    const callbacks: { notify: () => void; delay: number }[] = [];
    const scheduler: Scheduler = {
      setTimer(notify, delay) {
        callbacks.push({ notify, delay });
        return time.setTimer(notify, delay);
      },
    };
    const runtime = await createConcurrentRuntime({
      backend: new LocalConcurrentBackend(),
      namespace: 'early-close',
      clock: time,
      scheduler,
    });
    const executor = await runtime.manager.createSynchronous('r', { ttl: 100 });
    const entered = deferred<void>();
    const end = deferred<void>();
    const work = executor.run(async () => {
      entered.resolve();
      await end.promise;
    });
    await entered.promise;
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
    const timer = callbacks.find((callback) => callback.delay === 10);
    expect(timer).toBeDefined();
    time.advance(9.25);
    timer?.notify();
    await flush();
    expect(settled).toBe(false);
    end.resolve();
    await work;
    expect(await closing).toBeUndefined();
    const count = callbacks.length;
    for (const callback of callbacks) callback.notify();
    expect(callbacks).toHaveLength(count);
    expect(time.pendingTimers).toBe(0);
  });
});
