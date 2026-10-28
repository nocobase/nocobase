import { describe, expect, it } from 'vitest';
import { createConcurrentRuntime } from '@nocobase/concurrency';
import type { Scheduler } from '@nocobase/concurrency/backend';
import { ManualTime } from '@nocobase/concurrency/testing';
import { LocalConcurrentBackend } from '../src/index.ts';

async function flush(): Promise<void> {
  for (let i = 0; i < 50; i++) await Promise.resolve();
}

describe('Mutex bounded acquisition deadlines', () => {
  for (const method of ['lock', 'run'] as const) {
    it(`${method} can acquire at 9ms after an early deadline notification`, async () => {
      const time = new ManualTime();
      const callbacks: { notify: () => void; delay: number }[] = [];
      const scheduler: Scheduler = {
        setTimer(notify, delay) {
          callbacks.push({ notify, delay });
          return time.setTimer(notify, delay);
        },
      };
      const backend = new LocalConcurrentBackend({ retryIntervalMs: 1 });
      const options = { backend, namespace: 'early', clock: time, scheduler };
      const owner = await createConcurrentRuntime(options);
      const waiter = await createConcurrentRuntime(options);
      const held = await (
        await owner.manager.createLock('r', { ttl: 100 })
      ).lock();
      const lock = await waiter.manager.createLock('r');
      const executor = await waiter.manager.createSynchronous('r');
      let settled = false;
      const work =
        method === 'lock'
          ? lock.tryLock(10).then(async (lease) => {
              expect(lease).toBeDefined();
              await lease?.release();
              settled = true;
            })
          : executor
              .tryRun(() => 42, 10)
              .then((result) => {
                expect(result).toEqual({ acquired: true, value: 42 });
                settled = true;
              });
      await flush();
      const deadline = callbacks.find((callback) => callback.delay === 10);
      expect(deadline).toBeDefined();
      time.advance(8.25);
      deadline?.notify();
      await flush();
      expect(settled).toBe(false);
      time.advance(0.75);
      await held.release();
      time.flush();
      await work;
      expect(settled).toBe(true);
      await owner.close();
      await waiter.close();
      await backend.close();
      expect(time.pendingTimers).toBe(0);
    });

    it(`${method} returns busy for an exhausted pre-admission budget and does not acquire a free resource`, async () => {
      const time = new ManualTime();
      const backend = new LocalConcurrentBackend();
      const runtime = await createConcurrentRuntime({
        backend,
        namespace: 'queued',
        clock: time,
        scheduler: time,
      });
      const lock = await runtime.manager.createLock('r');
      const executor = await runtime.manager.createSynchronous('r');
      let ran = false;
      const work =
        method === 'lock'
          ? lock.tryLock(10)
          : executor.tryRun(() => {
              ran = true;
            }, 10);
      time.advance(10);
      expect(await work).toEqual(
        method === 'lock' ? undefined : { acquired: false },
      );
      expect(ran).toBe(false);
      const lease = await lock.tryLock();
      expect(lease).toBeDefined();
      await lease?.release();
      await runtime.close();
      await backend.close();
      expect(time.pendingTimers).toBe(0);
    });
  }
});
