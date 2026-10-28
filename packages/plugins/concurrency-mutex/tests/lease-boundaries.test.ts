import { afterEach, describe, it, expect, vi } from 'vitest';
import { Mutex } from 'async-mutex';
import {
  createConcurrentRuntime,
  ConcurrentLeaseLostError,
} from '@nocobase/concurrency';
import type { Clock, Scheduler } from '@nocobase/concurrency/backend';
import { ManualTime } from '@nocobase/concurrency/testing';
import { LocalConcurrentBackend } from '../src/index.ts';
afterEach(() => vi.restoreAllMocks());

describe('Mutex executor finalization', () => {
  for (const method of ['run', 'tryRun'] as const)
    for (const phase of ['before-release', 'after-release'] as const)
      for (const businessFails of [false, true]) {
        it.each([false, true])(
          `${method} ${phase}, business fails: ${businessFails}, release gate fails once: %s`,
          async (releaseFails) => {
            const time = new ManualTime();
            const cause = new Error('Final lease clock failed');
            const business = new Error('Independent business failure');
            let failClock = false;
            let releases = 0;
            const clock: Clock = {
              now() {
                if (failClock) {
                  failClock = false;
                  throw cause;
                }
                return time.now();
              },
            };
            const backend = new LocalConcurrentBackend();
            const acquire = backend.acquire.bind(backend);
            vi.spyOn(backend, 'acquire').mockImplementation(async (request) => {
              const grant = await acquire(request);
              if (!grant) return undefined;
              return {
                notAfter: grant.notAfter,
                release: async () => {
                  const call = ++releases;
                  try {
                    await grant.release();
                  } finally {
                    if (phase === 'after-release' && call === 1)
                      failClock = true;
                  }
                },
              };
            });
            const runtime = await createConcurrentRuntime({
              backend,
              namespace: 'finalize',
              clock,
              scheduler: time,
            });
            const executor = await runtime.manager.createSynchronous('r', {
              ttl: 100,
            });
            const runner = (): number => {
              if (releaseFails)
                vi.spyOn(Mutex.prototype, 'acquire').mockRejectedValueOnce(
                  new Error('Release gate failed'),
                );
              if (phase === 'before-release') failClock = true;
              if (businessFails) throw business;
              return 42;
            };
            const error = await (
              method === 'run' ? executor.run(runner) : executor.tryRun(runner)
            ).then(
              () => null,
              (error) => error,
            );
            expect(releases).toBe(1);
            if (businessFails) expect(error).toBe(business);
            else {
              expect(error).toBeInstanceOf(ConcurrentLeaseLostError);
              expect(error).toHaveProperty('cause', cause);
            }
            time.advance(101);
            time.flush();
            await runtime.close();
            await runtime.close();
            expect(releases).toBe(releaseFails ? 2 : 1);
            expect(time.pendingTimers).toBe(0);
          },
        );
      }
});
describe('Mutex startup monitor loss', () => {
  for (const method of ['lock', 'tryLock', 'run', 'tryRun'] as const) {
    it.each([false, true])(
      `${method} never delivers a synchronously lost lease; release gate fails once: %s`,
      async (releaseFails) => {
        const time = new ManualTime();
        const cause = new Error('Nested core monitor failed');
        const callbacks: (() => void)[] = [];
        let registrations = 0;
        const scheduler: Scheduler = {
          setTimer(notify, delay) {
            callbacks.push(notify);
            const call = ++registrations;
            if (call === 2) notify();
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
          namespace: 'startup-loss',
          clock: time,
          scheduler,
        });
        const lock = await runtime.manager.createLock('r', { ttl: 100 });
        const executor = await runtime.manager.createSynchronous('r', {
          ttl: 100,
        });
        const runner = vi.fn(() => 42);
        const work =
          method === 'lock'
            ? lock.lock()
            : method === 'tryLock'
              ? lock.tryLock()
              : method === 'run'
                ? executor.run(runner)
                : executor.tryRun(runner);
        const error = await work.then(
          () => null,
          (error) => error,
        );
        expect(runner).not.toHaveBeenCalled();
        expect(error).toBeInstanceOf(ConcurrentLeaseLostError);
        expect(error).toHaveProperty('cause', cause);
        time.advance(101);
        time.flush();
        await runtime.close();
        await runtime.close();
        expect(time.pendingTimers).toBe(0);
        const count = callbacks.length;
        for (const notify of callbacks) notify();
        expect(callbacks).toHaveLength(count);
        expect(time.pendingTimers).toBe(0);
      },
    );
  }
});
