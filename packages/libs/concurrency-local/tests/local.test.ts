import { describe, it, expect, vi, afterEach } from 'vitest';
import { setImmediate } from 'node:timers/promises';
import { Mutex } from 'async-mutex';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentAbortError,
  ConcurrentLeaseLostError,
  ConcurrentReleaseError,
  ConcurrentCloseError,
  ConcurrentConfigurationError,
} from '@nocobase/concurrency';
import {
  ManualTime,
  deferred,
  runBackendContract,
  runCoreFaultContract,
} from '@nocobase/concurrency/testing';
import type {
  Clock,
  Scheduler,
  BackendContext,
} from '@nocobase/concurrency/backend';
import { LocalConcurrentBackend } from '../src/index.ts';
import { LocalResourceRegistry, type ResourceState } from '../src/registry.ts';

async function flush() {
  for (let i = 0; i < 40; i++) await Promise.resolve();
}
function rejection(
  work: Promise<unknown>,
  expected: new (message?: string) => Error,
): Promise<void> {
  return work.then(
    () => {
      throw new Error('Expected rejection');
    },
    (error) => {
      expect(error).toBeInstanceOf(expected);
    },
  );
}
async function fixture(schedulerOverride?: Scheduler) {
  const time = new ManualTime();
  const backend = new LocalConcurrentBackend();
  const options = {
    backend,
    namespace: 'test',
    clock: time,
    scheduler: schedulerOverride ?? time,
  };
  const a = await createConcurrentRuntime(options);
  const b = await createConcurrentRuntime(options);
  return {
    time,
    backend,
    a,
    b,
    lock: await a.manager.createLock('shared'),
    contender: await b.manager.createLock('shared'),
    async close() {
      await a.close();
      await b.close();
      await backend.close();
    },
  };
}
afterEach(() => vi.restoreAllMocks());

describe('Local public integration', () => {
  it('runs public adapter and core fault contracts without private core imports', async () => {
    expect(
      (
        await runBackendContract({
          createBackend: () => new LocalConcurrentBackend(),
        })
      ).cases.length,
    ).toBeGreaterThan(5);
    expect((await runCoreFaultContract()).cases).toHaveLength(3);
  });
  it('shares backend/namespace, separates instances/namespaces, and shares executor lock kind', async () => {
    const f = await fixture();
    const c = await createConcurrentRuntime({
      backend: f.backend,
      namespace: 'other',
      clock: f.time,
      scheduler: f.time,
    });
    const separate = new LocalConcurrentBackend();
    const d = await createConcurrentRuntime({
      backend: separate,
      namespace: 'test',
    });
    const held = await f.lock.lock();
    expect(await f.contender.tryLock()).toBeUndefined();
    expect(
      await (await f.b.manager.createSynchronous('shared')).tryRun(() => 1),
    ).toEqual({ acquired: false });
    const independent = await (await c.manager.createLock('shared')).lock();
    const other = await (await d.manager.createLock('shared')).lock();
    await independent.release();
    await other.release();
    await held.release();
    await c.close();
    await d.close();
    await separate.close();
    await f.close();
  });
  it('uses cancellable 10ms bounded retries and single performs no retry', async () => {
    const f = await fixture();
    const held = await f.lock.lock();
    const acquire = vi.spyOn(Mutex.prototype, 'acquire');
    expect(await f.contender.tryLock()).toBeUndefined();
    expect(acquire).toHaveBeenCalledTimes(1);
    const work = f.contender.tryLock(100);
    await flush();
    expect(acquire).toHaveBeenCalledTimes(2);
    await held.release();
    f.time.advance(9);
    f.time.flush();
    await flush();
    expect(acquire).toHaveBeenCalledTimes(3);
    f.time.advance(1);
    f.time.flush();
    const next = await work;
    expect(next).toBeDefined();
    await next?.release();
    await f.close();
    expect(f.time.pendingTimers).toBe(0);
  });
  it('defaults to finite 30000ms and honors explicit wait/abort without leaking listeners', async () => {
    const f = await fixture();
    const held = await f.lock.lock();
    const work = f.contender.lock();
    const failed = rejection(work, ConcurrentAcquireError);
    await flush();
    f.time.advance(30000);
    f.time.flush();
    await failed;
    await held.release();
    const second = await f.lock.lock();
    const controller = new AbortController();
    const add = vi.spyOn(controller.signal, 'addEventListener');
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const waiting = f.contender.lock({
      timeoutMs: 100,
      signal: controller.signal,
    });
    const cancelled = rejection(waiting, ConcurrentAbortError);
    await flush();
    controller.abort();
    await cancelled;
    expect(add.mock.calls.length).toBe(remove.mock.calls.length);
    await second.release();
    await f.close();
    expect(f.time.pendingTimers).toBe(0);
  });
  it('does not enter async-mutex on pre-cancel and isolates cancellation from other requests', async () => {
    const f = await fixture();
    const spy = vi.spyOn(Mutex.prototype, 'acquire');
    const controller = new AbortController();
    controller.abort();
    await expect(
      f.lock.tryLock(0, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ConcurrentAbortError);
    expect(spy).not.toHaveBeenCalled();
    const held = await f.lock.lock();
    const abort = new AbortController();
    const a = f.contender.lock({ signal: abort.signal });
    const failed = rejection(a, ConcurrentAbortError);
    const b = f.contender.lock({ timeoutMs: 100 });
    await flush();
    abort.abort();
    await failed;
    await held.release();
    f.time.advance(10);
    f.time.flush();
    const granted = await b;
    await granted.release();
    await f.close();
  });
  it('rechecks abort after real Mutex gate wait without cancelling the shared gate', async () => {
    const f = await fixture();
    const entered = deferred<void>();
    const resume = deferred<void>();
    const original = Mutex.prototype.acquire;
    vi.spyOn(Mutex.prototype, 'acquire').mockImplementationOnce(async function (
      this: Mutex,
    ) {
      const unlock = await original.call(this);
      entered.resolve();
      await resume.promise;
      return unlock;
    });
    const controller = new AbortController();
    const work = f.lock.tryLock(0, { signal: controller.signal });
    const failed = rejection(work, ConcurrentAbortError);
    await entered.promise;
    controller.abort();
    resume.resolve();
    await failed;
    const lease = await f.contender.tryLock();
    expect(lease).toBeDefined();
    await lease?.release();
    await f.close();
  });
  it('cleans authorization cancelled during post-gate timer publication', async () => {
    const time = new ManualTime();
    const controller = new AbortController();
    const backend = new LocalConcurrentBackend();
    const scheduler: Scheduler = {
      setTimer(callback, delay) {
        if (delay === 20) controller.abort();
        return time.setTimer(callback, delay);
      },
    };
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'cancel',
      clock: time,
      scheduler,
    });
    const executor = await runtime.manager.createSynchronous('r', { ttl: 20 });
    const runner = vi.fn();
    await expect(
      executor.tryRun(runner, 0, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ConcurrentAbortError);
    expect(runner).not.toHaveBeenCalled();
    const lease = await (await runtime.manager.createLock('r')).tryLock();
    expect(lease).toBeDefined();
    await lease?.release();
    await runtime.close();
    await backend.close();
    expect(time.pendingTimers).toBe(0);
  });
  it('does not propagate acquisition cancellation after runner entry', async () => {
    const f = await fixture();
    const controller = new AbortController();
    const executor = await f.a.manager.createSynchronous('shared');
    expect(
      await executor.run(
        ({ signal }) => {
          controller.abort();
          expect(signal.aborted).toBe(false);
          return 7;
        },
        { signal: controller.signal },
      ),
    ).toBe(7);
    await f.close();
  });
  it('lazily expires delayed timers; old releases and timer callbacks cannot remove new tokens', async () => {
    const time = new ManualTime();
    const callbacks: (() => void)[] = [];
    const scheduler: Scheduler = {
      setTimer(callback, delay) {
        callbacks.push(callback);
        return time.setTimer(callback, delay);
      },
    };
    const backend = new LocalConcurrentBackend();
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'ttl',
      clock: time,
      scheduler,
    });
    const lock = await runtime.manager.createLock('r', { ttl: 10 });
    const old = await lock.lock();
    const oldCallbacks = [...callbacks];
    time.advance(10);
    const next = await lock.tryLock();
    expect(next).toBeDefined();
    await old.release();
    for (const callback of oldCallbacks) callback();
    await flush();
    expect(await lock.tryLock()).toBeUndefined();
    await next?.release();
    await runtime.close();
    await backend.close();
    expect(time.pendingTimers).toBe(0);
  });
  it('lets new work enter after TTL without forcibly stopping an expired runner', async () => {
    const f = await fixture();
    const executor = await f.a.manager.createSynchronous('shared', { ttl: 10 });
    const started = deferred<void>();
    const end = deferred<void>();
    let stopped = false;
    const work = executor.run(async () => {
      started.resolve();
      await end.promise;
      stopped = true;
    });
    const failed = rejection(work, ConcurrentLeaseLostError);
    await started.promise;
    f.time.advance(10);
    f.time.flush();
    const next = await f.contender.tryLock();
    expect(next).toBeDefined();
    expect(stopped).toBe(false);
    await next?.release();
    end.resolve();
    await failed;
    await f.close();
  });
  it('shares concurrent release and retries failed gate entry with the original identity', async () => {
    const f = await fixture();
    const old = await f.lock.lock();
    const original = Mutex.prototype.acquire;
    vi.spyOn(Mutex.prototype, 'acquire').mockRejectedValueOnce(
      new Error('injected gate failure'),
    );
    const first = old.release();
    expect(old.release()).toBe(first);
    await expect(first).rejects.toBeInstanceOf(ConcurrentReleaseError);
    f.time.advance(30000);
    const next = await f.contender.tryLock();
    expect(next).toBeDefined();
    await old.release();
    expect(await f.lock.tryLock()).toBeUndefined();
    await next?.release();
    await old.release();
    expect(Mutex.prototype.acquire).not.toBe(original);
    await f.close();
  });
  it.each([
    undefined,
    null,
    0,
    false,
    '',
    new Error('business'),
    Object.assign(new Error('abort'), { name: 'AbortError' }),
  ])(
    'preserves synchronous business throw %s despite expiry, cleanup and hostile logger',
    async (value) => {
      const time = new ManualTime();
      const backend = new LocalConcurrentBackend();
      const runtime = await createConcurrentRuntime({
        backend,
        namespace: 'error',
        clock: time,
        scheduler: time,
        logger: () => {
          throw new Error('logger');
        },
      });
      const executor = await runtime.manager.createSynchronous('r', {
        ttl: 10,
      });
      let caught = false;
      try {
        await executor.run(() => {
          time.advance(10);
          vi.spyOn(Mutex.prototype, 'acquire').mockRejectedValueOnce(
            new Error('secondary release failure'),
          );
          throw value;
        });
      } catch (error) {
        caught = true;
        expect(error).toBe(value);
      }
      expect(caught).toBe(true);
      await runtime.close();
      await backend.close();
    },
  );
  it('maps only reason/cause loss and tolerates cyclic or throwing cause getters', async () => {
    for (const mode of ['reason', 'cause', 'cycle', 'getter']) {
      const f = await fixture();
      const executor = await f.a.manager.createSynchronous('shared', {
        ttl: 10,
      });
      let business: unknown;
      let caught = false;
      try {
        await executor.run(({ signal }) => {
          f.time.advance(10);
          f.time.flush();
          if (mode === 'reason') business = signal.reason;
          if (mode === 'cause')
            business = new Error('wrapped', { cause: signal.reason });
          if (mode === 'cycle') {
            const cycle: { cause?: unknown } = {};
            cycle.cause = cycle;
            business = cycle;
          }
          if (mode === 'getter')
            business = Object.defineProperty({}, 'cause', {
              get() {
                throw new Error('hostile');
              },
            });
          throw business;
        });
      } catch (error) {
        caught = true;
        if (mode === 'reason' || mode === 'cause')
          expect(error).toBeInstanceOf(ConcurrentLeaseLostError);
        else expect(error).toBe(business);
      }
      expect(caught).toBe(true);
      await f.close();
    }
  });
  it('close times out, retains expired manual leases, and only cancels its own session', async () => {
    const f = await fixture();
    const held = await f.contender.lock();
    const waiting = f.lock.lock();
    const aborted = rejection(waiting, ConcurrentAbortError);
    await flush();
    await f.a.close();
    await aborted;
    expect(await f.contender.tryLock()).toBeUndefined();
    const closing = f.b.close({ timeoutMs: 1 });
    const failed = rejection(closing, ConcurrentCloseError);
    f.time.advance(30000);
    f.time.flush();
    await failed;
    await held.release();
    await f.b.close();
    await f.backend.close();
  });
  it('close waits for a real runner and retries executor cleanup failures', async () => {
    const f = await fixture();
    const executor = await f.a.manager.createSynchronous('shared');
    const started = deferred<void>();
    const end = deferred<void>();
    const work = executor.run(() => {
      started.resolve();
      return end.promise;
    });
    await started.promise;
    const closing = f.a.close({ timeoutMs: 1 });
    const failed = rejection(closing, ConcurrentCloseError);
    f.time.advance(1);
    f.time.flush();
    await failed;
    vi.spyOn(Mutex.prototype, 'acquire').mockRejectedValueOnce(
      new Error('release gate'),
    );
    const releaseFailed = rejection(work, ConcurrentReleaseError);
    end.resolve();
    await releaseFailed;
    await f.a.close();
    await f.b.close();
    await f.backend.close();
  });
  it('reports backend faults as errors rather than normal busy', async () => {
    const f = await fixture();
    vi.spyOn(Mutex.prototype, 'acquire').mockRejectedValueOnce(
      new Error('gate acquisition failure'),
    );
    await expect(f.lock.tryLock()).rejects.toBeInstanceOf(
      ConcurrentAcquireError,
    );
    const lease = await f.lock.tryLock();
    expect(lease).toBeDefined();
    await lease?.release();
    await f.close();
  });
  it('tracks direct v2 grants until return even after resource expiry', async () => {
    const time = new ManualTime();
    const backend = new LocalConcurrentBackend();
    const context: BackendContext = {
      protocolVersion: 2,
      managerId: 'direct',
      namespace: 'direct',
      clock: time,
      scheduler: time,
      operationTimeoutMs: 5000,
      cleanupTimeoutMs: 5000,
    };
    const session = await backend.openSession(context);
    await expect(
      session.validateResource({
        namespace: 'wrong',
        name: 'r',
        kind: 'lock',
        ttl: 10,
      }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    const grant = await session.acquire({
      resource: { namespace: 'direct', name: 'r', kind: 'lock', ttl: 10 },
      token: 'one',
      requestId: 'request',
      wait: { kind: 'single' },
      signal: new AbortController().signal,
    });
    expect(grant).toBeDefined();
    time.advance(10);
    time.flush();
    await flush();
    await expect(session.close()).rejects.toBeInstanceOf(ConcurrentCloseError);
    await grant?.release();
    await session.close();
    await backend.close();
  });
  it('rejects unsupported capabilities, invalid timings and mismatched clock domains', async () => {
    const f = await fixture();
    for (const options of [{ owner: '' }, { priority: 0 }, { autoRenew: true }])
      await expect(
        f.a.manager.createSynchronous('r', options),
      ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    await expect(f.a.manager.createSemaphore('s', 2)).rejects.toBeInstanceOf(
      ConcurrentConfigurationError,
    );
    for (const value of [0, -1, 1.1, NaN, Infinity, 2147483648])
      expect(
        () => new LocalConcurrentBackend({ retryIntervalMs: value }),
      ).toThrow(ConcurrentConfigurationError);
    await expect(
      createConcurrentRuntime({ backend: f.backend, namespace: 'wrong' }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    await expect(f.backend.close()).rejects.toBeInstanceOf(
      ConcurrentCloseError,
    );
    await f.close();
    await expect(
      createConcurrentRuntime({ backend: f.backend, namespace: 'closed' }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
  });
  it('recycles dynamic names and all visible resource timers after release, expiry and cancellation', async () => {
    const spy = vi.spyOn(LocalResourceRegistry.prototype, 'transition');
    const f = await fixture();
    for (let i = 0; i < 300; i++) {
      const lock = await f.a.manager.createLock(`dynamic:${i}`, { ttl: 5 });
      const held = await lock.lock();
      if (i % 2 === 0) {
        f.time.advance(5);
        f.time.flush();
        await flush();
      }
      const abort = new AbortController();
      const waiting = lock.lock({ signal: abort.signal });
      const failed = rejection(waiting, ConcurrentAbortError);
      abort.abort();
      await failed;
      await held.release();
    }
    await flush();
    for (const registry of spy.mock.contexts)
      expect(registry).toHaveProperty('size', 0);
    expect(f.time.pendingTimers).toBe(0);
    await f.close();
  });
  it('serializes real event-loop callbacks through the actual async-mutex integration', async () => {
    const backend = new LocalConcurrentBackend();
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'real',
    });
    const executor = await runtime.manager.createSynchronous('r');
    let active = 0;
    let max = 0;
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        executor.run(async () => {
          active++;
          max = Math.max(max, active);
          await setImmediate();
          active--;
          return i;
        }),
      ),
    );
    expect(max).toBe(1);
    expect(results).toHaveLength(20);
    await runtime.close();
    await backend.close();
  });
});

describe('internal registry reference and effect invariants', () => {
  function context(time: Clock & Scheduler): BackendContext {
    return {
      protocolVersion: 2,
      managerId: 'unit',
      namespace: 'unit',
      operationTimeoutMs: 5000,
      cleanupTimeoutMs: 5000,
      clock: time,
      scheduler: time,
    };
  }
  it('rearms early resource timers and collects an idle expired state without a new acquisition', async () => {
    const time = new ManualTime();
    const callbacks: (() => void)[] = [];
    const ctx = context(time);
    const scheduler: Scheduler = {
      setTimer(callback, delay) {
        callbacks.push(callback);
        return time.setTimer(callback, delay);
      },
    };
    const registry = new LocalResourceRegistry({ ...ctx, scheduler });
    await registry.transition('r', (state, effects) =>
      registry.grant(state, 'token', 10, effects),
    );
    callbacks[0]();
    await registry.drain();
    expect(registry.size).toBe(1);
    expect(callbacks).toHaveLength(2);
    time.advance(10);
    time.flush();
    await registry.drain();
    expect(registry.size).toBe(0);
    expect(time.pendingTimers).toBe(0);
  });
  it('publishes all effects after unlock even when an earlier effect throws', async () => {
    const time = new ManualTime();
    const registry = new LocalResourceRegistry(context(time));
    let published = false;
    const marker = new Error('effect failure');
    await expect(
      registry.transition('r', (state, effects) => {
        effects.push(() => {
          expect(state.gate.isLocked()).toBe(false);
          throw marker;
        });
        effects.push(() => {
          published = true;
        });
      }),
    ).rejects.toBe(marker);
    expect(published).toBe(true);
    expect(registry.size).toBe(0);
    await registry.drain();
  });
  it('pins real gate waiters, publishes outside the gate, and reclaims only the current state', async () => {
    const time = new ManualTime();
    const registry = new LocalResourceRegistry(context(time));
    let state!: ResourceState;
    await registry.transition('r', (current, effects) => {
      state = current;
      registry.grant(current, 'first', 10, effects);
      effects.push(() => {
        expect(current.gate.isLocked()).toBe(false);
      });
    });
    const unlock = await state.gate.acquire();
    const released = registry.transition('r', (current, effects) =>
      registry.clear(current, effects),
    );
    const next = registry.transition('r', (current, effects) => {
      expect(current).toBe(state);
      registry.grant(current, 'second', 20, effects);
    });
    expect(state.references).toBe(2);
    expect(registry.size).toBe(1);
    unlock();
    await released;
    await next;
    await registry.transition('r', (current, effects) =>
      registry.clear(current, effects),
    );
    expect(registry.size).toBe(0);
    await registry.transition('r', (current, effects) =>
      registry.grant(current, 'third', 30, effects),
    );
    await registry.transition(
      'r',
      (current, effects) => registry.clear(current, effects),
      state,
    );
    expect(registry.size).toBe(1);
    await registry.transition('r', (current, effects) =>
      registry.clear(current, effects),
    );
    await registry.drain();
    expect(registry.size).toBe(0);
    expect(time.pendingTimers).toBe(0);
  });
});
