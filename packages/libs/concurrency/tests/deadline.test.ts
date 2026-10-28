import { describe, expect, it } from 'vitest';
import {
  createConcurrentRuntime,
  ConcurrentAbortError,
  ConcurrentAcquireError,
} from '../src/index.ts';
import type {
  BackendAcquireRequest,
  BackendGrant,
  Scheduler,
} from '../src/backend/index.ts';
import {
  ControlledBackend,
  ManualTime,
  deferred,
} from '../src/testing/index.ts';

describe('bounded acquisition deadlines', () => {
  for (const method of ['lock', 'run'] as const) {
    it(`${method} returns busy when the budget elapses before backend admission`, async () => {
      const time = new ManualTime();
      const backend = new ControlledBackend({
        acquire: async () => {
          throw new Error('Must not enter the backend');
        },
      });
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
      expect(backend.requests).toHaveLength(0);
      expect(ran).toBe(false);
      await runtime.close();
      expect(time.pendingTimers).toBe(0);
    });

    it(`${method} rearms early notifications and ignores stale deadline callbacks`, async () => {
      const time = new ManualTime();
      const callbacks: { notify: () => void; delay: number }[] = [];
      const scheduler: Scheduler = {
        setTimer(notify, delay) {
          callbacks.push({ notify, delay });
          return time.setTimer(notify, delay);
        },
      };
      const entered = deferred<BackendAcquireRequest>();
      const response = deferred<BackendGrant | undefined>();
      const backend = new ControlledBackend({
        acquire: (request) => {
          entered.resolve(request);
          return response.promise;
        },
      });
      const runtime = await createConcurrentRuntime({
        backend,
        namespace: 'early',
        clock: time,
        scheduler,
      });
      const lock = await runtime.manager.createLock('r');
      const executor = await runtime.manager.createSynchronous('r');
      let ran = false;
      const work =
        method === 'lock'
          ? lock.tryLock(10).then(async (lease) => {
              expect(lease).toBeDefined();
              await lease?.release();
            })
          : executor
              .tryRun(() => {
                ran = true;
                return 42;
              }, 10)
              .then((result) => {
                expect(result).toEqual({ acquired: true, value: 42 });
              });
      const request = await entered.promise;
      expect(callbacks[0].delay).toBe(10);
      time.advance(8.25);
      callbacks[0].notify();
      expect(request.signal.aborted).toBe(false);
      expect(callbacks).toHaveLength(2);
      expect(callbacks[1].delay).toBe(2);
      expect(time.pendingTimers).toBe(1);
      time.advance(0.5);
      callbacks[0].notify();
      expect(callbacks).toHaveLength(2);
      callbacks[1].notify();
      expect(request.signal.aborted).toBe(false);
      expect(callbacks).toHaveLength(3);
      const stale = callbacks[2].notify;
      time.advance(0.25);
      response.resolve({ notAfter: time.now() + 100, release: async () => {} });
      await work;
      expect(ran).toBe(method === 'run');
      expect(backend.requests).toHaveLength(1);
      expect(time.pendingTimers).toBe(0);
      const count = callbacks.length;
      time.advance(20);
      stale();
      expect(callbacks).toHaveLength(count);
      expect(request.signal.aborted).toBe(false);
      await runtime.close();
      expect(time.pendingTimers).toBe(0);
    });

    it(`${method} cancels at the true deadline after an early notification`, async () => {
      const time = new ManualTime();
      const callbacks: (() => void)[] = [];
      const scheduler: Scheduler = {
        setTimer(callback, delay) {
          callbacks.push(callback);
          return time.setTimer(callback, delay);
        },
      };
      const entered = deferred<BackendAcquireRequest>();
      const backend = new ControlledBackend({
        acquire: async (request) => {
          entered.resolve(request);
          await new Promise<void>((resolve) =>
            request.signal.addEventListener('abort', () => resolve(), {
              once: true,
            }),
          );
          return undefined;
        },
      });
      const runtime = await createConcurrentRuntime({
        backend,
        namespace: 'deadline',
        clock: time,
        scheduler,
      });
      const lock = await runtime.manager.createLock('r');
      const executor = await runtime.manager.createSynchronous('r');
      const work =
        method === 'lock' ? lock.tryLock(10) : executor.tryRun(() => 1, 10);
      const request = await entered.promise;
      time.advance(9.5);
      callbacks[0]();
      expect(request.signal.aborted).toBe(false);
      time.advance(0.5);
      callbacks[1]();
      expect(request.signal.aborted).toBe(true);
      expect(request.signal.reason).toBeInstanceOf(ConcurrentAcquireError);
      expect(await work).toEqual(
        method === 'lock' ? undefined : { acquired: false },
      );
      await runtime.close();
      expect(time.pendingTimers).toBe(0);
    });

    it.each(['abort', 'close'] as const)(
      `${method} does not turn pre-admission %s into busy`,
      async (mode) => {
        const time = new ManualTime();
        const backend = new ControlledBackend({
          acquire: async () => undefined,
        });
        const runtime = await createConcurrentRuntime({
          backend,
          namespace: 'cancel',
          clock: time,
          scheduler: time,
        });
        const lock = await runtime.manager.createLock('r');
        const executor = await runtime.manager.createSynchronous('r');
        const controller = new AbortController();
        const work =
          method === 'lock'
            ? lock.tryLock(10, { signal: controller.signal })
            : executor.tryRun(() => 1, 10, { signal: controller.signal });
        const observed = work.then(
          () => {
            throw new Error('Expected cancellation or closing failure');
          },
          (error: unknown) => error,
        );
        time.advance(10);
        if (mode === 'abort') controller.abort();
        const closing = mode === 'close' ? runtime.close() : undefined;
        expect(await observed).toBeInstanceOf(
          mode === 'abort' ? ConcurrentAbortError : ConcurrentAcquireError,
        );
        expect(backend.requests).toHaveLength(0);
        await (closing ?? runtime.close());
        expect(time.pendingTimers).toBe(0);
      },
    );
  }
});
