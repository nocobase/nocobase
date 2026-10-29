import { describe, it, expect, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentAbortError,
} from '../src/index.ts';
import type { Scheduler } from '../src/backend/index.ts';
import {
  ManualTime,
  ControlledBackend,
  deferred,
} from '../src/testing/index.ts';

async function flush(): Promise<void> {
  for (let i = 0; i < 50; i++) await Promise.resolve();
}
describe('Confirmed grant validation failures', () => {
  for (const failure of ['clock', 'grant-expiry'] as const) {
    it.each([false, true])(
      `retains cleanup when ${failure} throws before delivery; release fails once: %s`,
      async (releaseFails) => {
        const time = new ManualTime();
        const cause = new Error('Grant validation failed');
        const release = vi.fn(async () => {
          if (releaseFails && release.mock.calls.length === 1)
            throw new Error('Release failed');
        });
        const backend = new ControlledBackend({
          acquire: async () => {
            if (failure === 'clock')
              vi.spyOn(time, 'now').mockImplementationOnce(() => {
                throw cause;
              });
            return {
              get notAfter(): number {
                if (failure === 'grant-expiry') throw cause;
                return 100;
              },
              release,
            };
          },
        });
        const runtime = await createConcurrentRuntime({
          backend,
          namespace: 'delivery-check',
          clock: time,
          scheduler: time,
        });
        await expect(
          (await runtime.manager.createLock('r')).lock(),
        ).rejects.toMatchObject({ cause });
        expect(release).toHaveBeenCalledTimes(1);
        await runtime.close();
        expect(release).toHaveBeenCalledTimes(releaseFails ? 2 : 1);
        expect(time.pendingTimers).toBe(0);
      },
    );
  }
});
describe('Acquisition deadline scheduler failures', () => {
  for (const method of ['tryLock', 'tryRun'] as const) {
    for (const outcome of [
      'busy',
      'throw',
      'grant',
      'release-retry',
    ] as const) {
      it(`${method} retains the deadline failure after backend ${outcome}`, async () => {
        const time = new ManualTime();
        const cause = new Error('Deadline rearm failed');
        const callbacks: (() => void)[] = [];
        let calls = 0;
        const scheduler: Scheduler = {
          setTimer(notify, delay) {
            callbacks.push(notify);
            if (++calls === 2) throw cause;
            return time.setTimer(notify, delay);
          },
        };
        const entered = deferred<AbortSignal>();
        const end = deferred<void>();
        const release = vi.fn(async () => {
          if (outcome === 'release-retry' && release.mock.calls.length === 1)
            throw new Error('Release failed');
        });
        const backend = new ControlledBackend({
          acquire: async (request) => {
            entered.resolve(request.signal);
            await end.promise;
            if (outcome === 'throw')
              throw new Error('Backend secondary failure');
            return outcome === 'busy' ? undefined : { notAfter: 100, release };
          },
        });
        const runtime = await createConcurrentRuntime({
          backend,
          namespace: 'deadline-failure',
          clock: time,
          scheduler,
        });
        const lock = await runtime.manager.createLock('r');
        const executor = await runtime.manager.createSynchronous('r');
        const runner = vi.fn(() => 42);
        let settled = false;
        const result = (
          method === 'tryLock' ? lock.tryLock(10) : executor.tryRun(runner, 10)
        ).then(
          (value) => {
            settled = true;
            return value;
          },
          (error) => {
            settled = true;
            return error;
          },
        );
        const signal = await entered.promise;
        time.advance(1);
        expect(() => callbacks[0]()).not.toThrow();
        await flush();
        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBeInstanceOf(ConcurrentAcquireError);
        expect(signal.reason).toHaveProperty('cause', cause);
        expect(settled).toBe(false);
        callbacks[0]();
        callbacks[1]();
        expect(calls).toBe(2);
        end.resolve();
        const error = await result;
        expect(error).toBe(signal.reason);
        expect(runner).not.toHaveBeenCalled();
        await runtime.close();
        await runtime.close();
        expect(time.pendingTimers).toBe(0);
        expect(release).toHaveBeenCalledTimes(
          outcome === 'release-retry' ? 2 : outcome === 'grant' ? 1 : 0,
        );
      });
    }
  }
  it.each(['abort', 'close'] as const)(
    'preserves %s priority over a retained deadline failure',
    async (mode) => {
      const time = new ManualTime();
      const cause = new Error('Rearm failed');
      let calls = 0;
      let notify = () => {};
      const end = deferred<void>();
      const entered = deferred<void>();
      const controller = new AbortController();
      const scheduler: Scheduler = {
        setTimer(callback, delay) {
          if (++calls === 2) throw cause;
          if (calls === 1) notify = callback;
          return time.setTimer(callback, delay);
        },
      };
      const runtime = await createConcurrentRuntime({
        backend: new ControlledBackend({
          acquire: async () => {
            entered.resolve();
            await end.promise;
            return undefined;
          },
        }),
        namespace: 'priority',
        clock: time,
        scheduler,
      });
      const work = (await runtime.manager.createLock('r'))
        .tryLock(10, { signal: controller.signal })
        .then(
          (value) => value,
          (error) => error,
        );
      await entered.promise;
      time.advance(1);
      expect(() => notify()).not.toThrow();
      let closing: Promise<void> | undefined;
      if (mode === 'abort') controller.abort();
      else closing = runtime.close();
      end.resolve();
      expect(await work).toBeInstanceOf(ConcurrentAbortError);
      await (closing ?? runtime.close());
      expect(time.pendingTimers).toBe(0);
    },
  );
  it('rejects initial deadline registration failure without calling the backend', async () => {
    const time = new ManualTime();
    const cause = new Error('Initial deadline failed');
    let calls = 0;
    const backend = new ControlledBackend({ acquire: async () => undefined });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'initial',
      clock: time,
      scheduler: {
        setTimer(callback, delay) {
          if (++calls === 1) throw cause;
          return time.setTimer(callback, delay);
        },
      },
    });
    await expect(
      (await runtime.manager.createLock('r')).tryLock(10),
    ).rejects.toMatchObject({ cause });
    expect(backend.requests).toHaveLength(0);
    await runtime.close();
    expect(time.pendingTimers).toBe(0);
  });
  it('does not crash a native Node process on early deadline rearm failure', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-transform-types',
        new URL('./fixtures/deadline-failure.mjs', import.meta.url).pathname,
      ],
      { encoding: 'utf8', timeout: 5000 },
    );
    expect(result.stderr).not.toContain('Error: Deadline rearm failed\n    at');
    expect({ status: result.status, stderr: result.stderr }).toMatchObject({
      status: 0,
    });
    expect(result.stdout).toContain('"aborted":true');
  });
});
