import { describe, it, expect, vi } from 'vitest';
import {
  createConcurrentRuntime,
  ConcurrentLeaseLostError,
} from '../src/index.ts';
import type { Clock, Scheduler } from '../src/backend/index.ts';
import { ControlledBackend, ManualTime } from '../src/testing/index.ts';

describe('Executor finalization lease checks', () => {
  for (const method of ['run', 'tryRun'] as const)
    for (const phase of ['before-release', 'after-release'] as const)
      for (const businessFails of [false, true]) {
        it.each([false, true])(
          `${method} ${phase}, business fails: ${businessFails}, release fails once: %s`,
          async (releaseFails) => {
            const time = new ManualTime();
            const cause = new Error('Final lease clock failed');
            const business = new Error('Independent business failure');
            const cleanup = new Error('Release failed');
            let failClock = false;
            let signal: AbortSignal | undefined;
            const clock: Clock = {
              now() {
                if (failClock) {
                  failClock = false;
                  throw cause;
                }
                return time.now();
              },
            };
            const release = vi.fn(async () => {
              if (phase === 'after-release' && release.mock.calls.length === 1)
                failClock = true;
              if (releaseFails && release.mock.calls.length === 1)
                throw cleanup;
            });
            const logger = vi.fn(() => {
              throw new Error('Diagnostic failure');
            });
            const runtime = await createConcurrentRuntime({
              backend: new ControlledBackend({
                acquire: async () => ({ notAfter: 100, release }),
              }),
              namespace: 'finalize',
              clock,
              scheduler: time,
              logger,
            });
            const executor = await runtime.manager.createSynchronous('r', {
              ttl: 100,
            });
            const runner = (context: { signal: AbortSignal }): number => {
              signal = context.signal;
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
            expect(release).toHaveBeenCalledTimes(1);
            if (businessFails) expect(error).toBe(business);
            else {
              expect(error).toBeInstanceOf(ConcurrentLeaseLostError);
              expect(error).toHaveProperty('cause', cause);
            }
            expect(signal?.aborted).toBe(true);
            expect(signal?.reason).toBeInstanceOf(ConcurrentLeaseLostError);
            expect(signal?.reason).toHaveProperty('cause', cause);
            time.advance(101);
            time.flush();
            await runtime.close();
            await runtime.close();
            expect(release).toHaveBeenCalledTimes(releaseFails ? 2 : 1);
            expect(time.pendingTimers).toBe(0);
          },
        );
      }
});

describe('Synchronous loss before lease delivery', () => {
  for (const method of [
    'lock',
    'tryLock',
    'boundedLock',
    'run',
    'tryRun',
    'boundedRun',
  ] as const) {
    it.each([false, true])(
      `${method} rejects startup loss without delivery; release fails once: %s`,
      async (releaseFails) => {
        const time = new ManualTime();
        const cause = new Error('Nested lease registration failed');
        const callbacks: (() => void)[] = [];
        let monitorCalls = 0;
        const scheduler: Scheduler = {
          setTimer(notify, delay) {
            callbacks.push(notify);
            if (delay === 100) {
              const call = ++monitorCalls;
              if (call === 1) notify();
              else if (call === 2) throw cause;
            }
            return time.setTimer(notify, delay);
          },
        };
        const release = vi.fn(async () => {
          if (releaseFails && release.mock.calls.length === 1)
            throw new Error('Release failed');
        });
        const runtime = await createConcurrentRuntime({
          backend: new ControlledBackend({
            acquire: async () => ({ notAfter: 100, release }),
          }),
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
              : method === 'boundedLock'
                ? lock.tryLock(10)
                : method === 'run'
                  ? executor.run(runner)
                  : method === 'tryRun'
                    ? executor.tryRun(runner)
                    : executor.tryRun(runner, 10);
        const error = await work.then(
          () => null,
          (error) => error,
        );
        expect(runner).not.toHaveBeenCalled();
        expect(error).toBeInstanceOf(ConcurrentLeaseLostError);
        expect(error).toHaveProperty('cause', cause);
        expect(release).toHaveBeenCalledTimes(1);
        await runtime.close();
        await runtime.close();
        expect(release).toHaveBeenCalledTimes(releaseFails ? 2 : 1);
        expect(time.pendingTimers).toBe(0);
        const count = callbacks.length;
        for (const notify of callbacks) notify();
        expect(callbacks).toHaveLength(count);
        expect(time.pendingTimers).toBe(0);
      },
    );
  }
});
