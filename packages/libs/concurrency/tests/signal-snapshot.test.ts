import { getEventListeners } from 'node:events';
import { describe, it, expect } from 'vitest';
import {
  createConcurrentRuntime,
  ConcurrentAbortError,
  ConcurrentAcquireError,
} from '../src/index.ts';
import type { AcquireOptions, Lease } from '../src/index.ts';
import type { BackendAcquireRequest } from '../src/backend/index.ts';
import {
  ControlledBackend,
  ManualTime,
  deferred,
} from '../src/testing/index.ts';
function makeBackend() {
  return new ControlledBackend({
    acquire: async (request, context) =>
      request.signal.aborted
        ? undefined
        : {
            notAfter: context.clock.now() + request.resource.ttl,
            release: async () => {},
          },
  });
}

describe('per-call cancellation signal', () => {
  for (const method of [
    'lock',
    'tryLock',
    'boundedLock',
    'run',
    'tryRun',
    'boundedRun',
  ] as const)
    for (const timing of ['entry', 'waiting'] as const)
      for (const cancelled of ['original', 'replacement', 'neither'] as const)
        it(`${method} snapshots its signal at ${timing} when cancelling ${cancelled}`, async () => {
          const time = new ManualTime();
          const backend = makeBackend();
          const runtime = await createConcurrentRuntime({
            backend,
            namespace: 'signal-snapshot',
            clock: time,
            scheduler: time,
          });
          const lock = await runtime.manager.createLock('r', { ttl: 1000 });
          const executor = await runtime.manager.createSynchronous('r', {
            ttl: 1000,
          });
          const holder = await lock.lock();
          const original = new AbortController();
          const replacement = new AbortController();
          const originalReason = new Error('Original request cancelled');
          const replacementReason = new Error('Replacement request cancelled');
          const external = () => {};
          const externalReplacement = () => {};
          original.signal.addEventListener('abort', external);
          replacement.signal.addEventListener('abort', externalReplacement);
          const options: AcquireOptions = { signal: original.signal };
          const entered = deferred<BackendAcquireRequest>();
          const gate = deferred<void>();
          const acquire = backend.acquire.bind(backend);
          backend.acquire = async (request) => {
            entered.resolve(request);
            await gate.promise;
            return acquire(request);
          };
          let acquired = false;
          let runs = 0;
          const runner = () => {
            runs++;
            return 42;
          };
          const release = async (lease: Lease | undefined) => {
            if (lease) {
              acquired = true;
              await lease.release();
            }
          };
          const work =
            method === 'lock'
              ? lock.lock(options).then(release)
              : method === 'tryLock'
                ? lock.tryLock(0, options).then(release)
                : method === 'boundedLock'
                  ? lock.tryLock(10, options).then(release)
                  : method === 'run'
                    ? executor.run(runner, options).then(() => {
                        acquired = true;
                      })
                    : (method === 'tryRun'
                        ? executor.tryRun(runner, 0, options)
                        : executor.tryRun(runner, 10, options)
                      ).then((result) => {
                        acquired = result.acquired;
                      });
          const observed = work.then(
            () => ({ ok: true as const }),
            (error: unknown) => ({ ok: false as const, error }),
          );
          if (timing === 'waiting') await entered.promise;
          options.signal = replacement.signal;
          if (cancelled === 'original') original.abort(originalReason);
          else if (cancelled === 'replacement')
            replacement.abort(replacementReason);
          await holder.release();
          gate.resolve();
          const result = await observed;
          await runtime.close();
          if (cancelled === 'original') {
            expect(result.ok).toBe(false);
            if (result.ok)
              throw new Error('Expected original signal cancellation');
            expect(result.error).toBeInstanceOf(ConcurrentAbortError);
            if (!(result.error instanceof ConcurrentAbortError))
              throw result.error;
            const cause =
              result.error.cause instanceof ConcurrentAbortError
                ? result.error.cause.cause
                : result.error.cause;
            expect(cause).toBe(originalReason);
            expect(acquired).toBe(false);
            expect(runs).toBe(0);
          } else {
            expect(result).toEqual({ ok: true });
            expect(acquired).toBe(true);
            expect(runs).toBe(
              method === 'run' || method === 'tryRun' || method === 'boundedRun'
                ? 1
                : 0,
            );
          }
          expect(getEventListeners(original.signal, 'abort')).toEqual([
            external,
          ]);
          expect(getEventListeners(replacement.signal, 'abort')).toEqual([
            externalReplacement,
          ]);
          expect(time.pendingTimers).toBe(0);
        });

  it('reads a signal getter only once per call', async () => {
    const time = new ManualTime();
    const runtime = await createConcurrentRuntime({
      backend: makeBackend(),
      namespace: 'getter',
      clock: time,
      scheduler: time,
    });
    const lock = await runtime.manager.createLock('r');
    const original = new AbortController();
    const replacement = new AbortController();
    replacement.abort(new Error('Unrelated signal'));
    let reads = 0;
    const options = {
      get signal() {
        return ++reads === 1 ? original.signal : replacement.signal;
      },
    };
    const observed = lock.tryLock(10, options).then(
      async (lease) => {
        if (lease) await lease.release();
        return Boolean(lease);
      },
      (error: unknown) => error,
    );
    const result = await observed;
    await runtime.close();
    expect(result).toBe(true);
    expect(reads).toBe(1);
    expect(getEventListeners(original.signal, 'abort')).toEqual([]);
    expect(getEventListeners(replacement.signal, 'abort')).toEqual([]);
    expect(time.pendingTimers).toBe(0);
  });

  it('does not adopt a signal added after a call without one', async () => {
    const time = new ManualTime();
    const runtime = await createConcurrentRuntime({
      backend: makeBackend(),
      namespace: 'no-signal',
      clock: time,
      scheduler: time,
    });
    const lock = await runtime.manager.createLock('r');
    const options: AcquireOptions = {};
    const replacement = new AbortController();
    const observed = lock.tryLock(10, options).then(
      async (lease) => {
        if (lease) await lease.release();
        return Boolean(lease);
      },
      (error: unknown) => error,
    );
    options.signal = replacement.signal;
    replacement.abort(new Error('Later signal'));
    const result = await observed;
    await runtime.close();
    expect(result).toBe(true);
    expect(getEventListeners(replacement.signal, 'abort')).toEqual([]);
    expect(time.pendingTimers).toBe(0);
  });

  it('captures before a reentrant clock can replace the option', async () => {
    const time = new ManualTime();
    const original = new AbortController();
    const replacement = new AbortController();
    replacement.abort(new Error('Later signal'));
    const options: AcquireOptions = { signal: original.signal };
    let mutate = false;
    const clock = {
      now() {
        if (mutate) options.signal = replacement.signal;
        return time.now();
      },
    };
    const runtime = await createConcurrentRuntime({
      backend: makeBackend(),
      namespace: 'reentrant-clock',
      clock,
      scheduler: time,
    });
    const lock = await runtime.manager.createLock('r');
    mutate = true;
    const result = await lock.tryLock(10, options).then(
      async (lease) => {
        if (lease) await lease.release();
        return Boolean(lease);
      },
      (error: unknown) => error,
    );
    await runtime.close();
    expect(result).toBe(true);
    expect(options.signal).toBe(replacement.signal);
    expect(getEventListeners(original.signal, 'abort')).toEqual([]);
    expect(getEventListeners(replacement.signal, 'abort')).toEqual([]);
    expect(time.pendingTimers).toBe(0);
  });

  for (const cancelled of ['original', 'replacement'] as const) {
    it(`keeps backend-error classification when cancelling ${cancelled}`, async () => {
      const time = new ManualTime();
      const failure = new Error('Backend failure');
      const entered = deferred<BackendAcquireRequest>();
      const response = deferred<void>();
      const backend = new ControlledBackend({
        acquire: async (request) => {
          entered.resolve(request);
          await response.promise;
          throw failure;
        },
      });
      const runtime = await createConcurrentRuntime({
        backend,
        namespace: 'backend-failure',
        clock: time,
        scheduler: time,
      });
      const lock = await runtime.manager.createLock('r');
      const original = new AbortController();
      const replacement = new AbortController();
      const options = { signal: original.signal };
      const reason = new Error('Selected cancellation');
      const observed = lock.tryLock(10, options).then(
        () => null,
        (error: unknown) => error,
      );
      const request = await entered.promise;
      options.signal = replacement.signal;
      (cancelled === 'original' ? original : replacement).abort(reason);
      response.resolve();
      const error = await observed;
      await runtime.close();
      expect(error).toBeInstanceOf(
        cancelled === 'original'
          ? ConcurrentAbortError
          : ConcurrentAcquireError,
      );
      if (!(error instanceof Error)) throw new Error('Expected error');
      expect(error.cause).toBe(failure);
      if (cancelled === 'original') {
        expect(request.signal.reason).toBeInstanceOf(ConcurrentAbortError);
        if (request.signal.reason instanceof ConcurrentAbortError)
          expect(request.signal.reason.cause).toBe(reason);
      }
      expect(getEventListeners(original.signal, 'abort')).toEqual([]);
      expect(getEventListeners(replacement.signal, 'abort')).toEqual([]);
      expect(time.pendingTimers).toBe(0);
    });

    it(`keeps startup-error classification when cancelling ${cancelled}`, async () => {
      const time = new ManualTime();
      const failure = new Error('Monitor registration failed');
      const original = new AbortController();
      const replacement = new AbortController();
      const options = { signal: original.signal };
      let releases = 0;
      const backend = new ControlledBackend({
        acquire: async (request, context) => ({
          notAfter: context.clock.now() + request.resource.ttl,
          release: async () => {
            releases++;
          },
        }),
      });
      const scheduler = {
        setTimer(notify: () => void, delay: number) {
          if (delay === 1000) {
            options.signal = replacement.signal;
            (cancelled === 'original' ? original : replacement).abort(
              'selected',
            );
            throw failure;
          }
          return time.setTimer(notify, delay);
        },
      };
      const runtime = await createConcurrentRuntime({
        backend,
        namespace: 'startup-failure',
        clock: time,
        scheduler,
      });
      const lock = await runtime.manager.createLock('r', { ttl: 1000 });
      const error = await lock.tryLock(10, options).then(
        () => null,
        (error: unknown) => error,
      );
      await runtime.close();
      expect(error).toBeInstanceOf(
        cancelled === 'original'
          ? ConcurrentAbortError
          : ConcurrentAcquireError,
      );
      if (!(error instanceof Error)) throw new Error('Expected error');
      expect(error.cause).toBe(failure);
      expect(releases).toBe(1);
      expect(getEventListeners(original.signal, 'abort')).toEqual([]);
      expect(getEventListeners(replacement.signal, 'abort')).toEqual([]);
      expect(time.pendingTimers).toBe(0);
    });
  }
});
