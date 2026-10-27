import { describe, it, expect, vi } from 'vitest';
import * as root from '../src/index.ts';
import * as port from '../src/backend/index.ts';
import * as testing from '../src/testing/index.ts';
import type {
  BackendGrant,
  BackendAcquireRequest,
} from '../src/backend/index.ts';
import {
  ControlledBackend,
  ManualTime,
  deferred,
} from '../src/testing/index.ts';
const {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentAbortError,
  ConcurrentConfigurationError,
  ConcurrentLeaseLostError,
  ConcurrentReleaseError,
  ConcurrentCloseError,
} = root;

async function fixture(release: () => Promise<void> = async () => {}) {
  const time = new ManualTime();
  const backend = new ControlledBackend({
    acquire: async (request) => ({
      notAfter: time.now() + request.resource.ttl,
      release,
    }),
  });
  const runtime = await createConcurrentRuntime({
    backend,
    namespace: 'test',
    clock: time,
    scheduler: time,
    logger: () => {
      throw new Error('logger');
    },
  });
  return {
    time,
    backend,
    runtime,
    lock: await runtime.manager.createLock('resource'),
    executor: await runtime.manager.createSynchronous('resource'),
  };
}
async function flush() {
  for (let i = 0; i < 20; i++) await Promise.resolve();
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
describe('public core', () => {
  it('rearms early lease timers and ignores cancelled callbacks', async () => {
    const time = new ManualTime();
    const callbacks: (() => void)[] = [];
    const scheduler: port.Scheduler = {
      setTimer(callback, delay) {
        callbacks.push(callback);
        return time.setTimer(callback, delay);
      },
    };
    const backend = new ControlledBackend({
      acquire: async () => ({ notAfter: 10, release: async () => {} }),
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'early',
      clock: time,
      scheduler,
    });
    const executor = await runtime.manager.createSynchronous('r');
    await executor
      .tryRun(({ signal }) => {
        callbacks[0]();
        expect(signal.aborted).toBe(false);
        expect(callbacks).toHaveLength(2);
        time.advance(10);
        callbacks[1]();
        expect(signal.aborted).toBe(true);
        throw signal.reason;
      })
      .then(
        () => {
          throw new Error('Expected lease loss');
        },
        (error) => {
          expect(error).toBeInstanceOf(ConcurrentLeaseLostError);
        },
      );
    const count = callbacks.length;
    callbacks[0]();
    expect(callbacks).toHaveLength(count);
    time.flush();
    await runtime.close();
  });
  it('counts wait time from entry and never retries the backend in core', async () => {
    const time = new ManualTime();
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
      namespace: 'wait',
      defaultAcquireTimeoutMs: 7,
      clock: time,
      scheduler: time,
    });
    const lock = await runtime.manager.createLock('r');
    const work = lock.lock();
    const failed = rejection(work, ConcurrentAcquireError);
    const request = await entered.promise;
    expect(request.wait).toEqual({ kind: 'bounded', deadline: 7 });
    time.advance(7);
    time.flush();
    expect(request.signal.aborted).toBe(true);
    response.resolve(undefined);
    await failed;
    expect(backend.requests).toHaveLength(1);
    await runtime.close();
  });
  it('rechecks cancellation after constructing the lease timer', async () => {
    const time = new ManualTime();
    const controller = new AbortController();
    let releases = 0;
    const scheduler: port.Scheduler = {
      setTimer(callback, delay) {
        if (delay === 30000) controller.abort();
        return time.setTimer(callback, delay);
      },
    };
    const backend = new ControlledBackend({
      acquire: async () => ({
        notAfter: 30000,
        release: async () => {
          releases++;
        },
      }),
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'gate',
      clock: time,
      scheduler,
    });
    const executor = await runtime.manager.createSynchronous('r');
    const runner = vi.fn();
    await expect(
      executor.tryRun(runner, 0, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ConcurrentAbortError);
    expect(runner).not.toHaveBeenCalled();
    expect(releases).toBe(1);
    await runtime.close();
  });
  it('runs the published deterministic fault driver', async () => {
    expect((await testing.runCoreFaultContract()).cases).toHaveLength(3);
  });
  it('re-exports identical constructors without loading a test framework', () => {
    for (const name of [
      'ConcurrentConfigurationError',
      'ConcurrentAcquireError',
      'ConcurrentAbortError',
      'ConcurrentLeaseLostError',
      'ConcurrentReleaseError',
      'ConcurrentCloseError',
    ] as const) {
      expect(root[name]).toBe(port[name]);
      expect(root[name]).toBe(testing[name]);
    }
  });
  it('encodes tuple boundaries, Unicode and kind domains without normalizing', () => {
    const inputs = [
      ['a:b', 'c'],
      ['a', 'b:c'],
      ['', 'é'],
      ['é', ''],
      ['a', 'A'],
      ['a', 'a'],
      ['a', '\ud800'],
      ['a', '�'],
    ];
    expect(
      new Set(
        inputs.map(([namespace, name]) =>
          port.encodeResourceKey({ namespace, name }),
        ),
      ).size,
    ).toBe(inputs.length);
  });
  it('opens an asynchronous session with default budgets and unique request identities', async () => {
    const f = await fixture();
    expect(f.backend.contexts[0]).toMatchObject({
      protocolVersion: 2,
      operationTimeoutMs: 5000,
      cleanupTimeoutMs: 5000,
    });
    const a = await f.lock.lock();
    await a.release();
    const b = await f.lock.tryLock();
    await b?.release();
    const [first, second] = f.backend.requests;
    expect(first.wait).toEqual({ kind: 'bounded', deadline: 30000 });
    expect(second.wait).toEqual({ kind: 'single' });
    expect(first.resource.ttl).toBe(30000);
    expect(first.token).not.toBe(second.token);
    expect(first.requestId).not.toBe(second.requestId);
    await f.runtime.close();
    expect(f.time.pendingTimers).toBe(0);
  });
  it('returns normal busy but never turns an unknown backend error into busy', async () => {
    const f = await fixture();
    const busy = new ControlledBackend({ acquire: async () => undefined });
    const runtime = await createConcurrentRuntime({
      backend: busy,
      namespace: 'busy',
    });
    const lock = await runtime.manager.createLock('r');
    expect(await lock.tryLock()).toBeUndefined();
    await expect(lock.lock()).rejects.toBeInstanceOf(ConcurrentAcquireError);
    const fail = new ControlledBackend({
      acquire: async () => {
        throw new Error('unknown');
      },
    });
    const broken = await createConcurrentRuntime({
      backend: fail,
      namespace: 'unknown',
    });
    await expect(
      (await broken.manager.createLock('r')).tryLock(),
    ).rejects.toBeInstanceOf(ConcurrentAcquireError);
    await runtime.close();
    await broken.close();
    await f.runtime.close();
  });
  it.each([NaN, Infinity, -1, 0, 1.5, 2147483648])(
    'rejects invalid positive milliseconds %s before backend effects',
    async (value) => {
      const f = await fixture();
      const count = f.backend.requests.length;
      await expect(
        f.runtime.manager.createLock('r', { ttl: value }),
      ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
      await expect(f.lock.lock({ timeoutMs: value })).rejects.toBeInstanceOf(
        ConcurrentConfigurationError,
      );
      await expect(
        createConcurrentRuntime({
          backend: f.backend,
          namespace: 'n',
          operationTimeoutMs: value,
        }),
      ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
      expect(f.backend.requests.length).toBe(count);
      await f.runtime.close();
    },
  );
  it('rejects unsupported JavaScript parameters, protocol and capabilities', async () => {
    const f = await fixture();
    for (const options of [
      { priority: 0 },
      { owner: '' },
      { autoRenew: true },
    ]) {
      await expect(
        f.runtime.manager.createSynchronous('r', options),
      ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    }
    await expect(
      f.runtime.manager.createSemaphore('r', 1),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    const session = await f.backend.openSession(f.backend.contexts[0]);
    for (const bad of [
      { ...session, protocolVersion: 1 },
      {
        ...session,
        capabilities: { ...session.capabilities, autoRenew: true },
      },
    ]) {
      const backend = { openSession: async () => bad, close: async () => {} };
      // Deliberately invalid extension input from JavaScript, not a declaration suppression.
      await expect(
        createConcurrentRuntime({
          backend: backend as port.ConcurrentBackend,
          namespace: 'bad',
        }),
      ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    }
    await f.runtime.close();
  });
  it('does not touch the backend on pre-abort and keeps explicit single distinct from zero deadline', async () => {
    const f = await fixture();
    const controller = new AbortController();
    controller.abort();
    await expect(
      f.lock.tryLock(0, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ConcurrentAbortError);
    expect(f.backend.requests).toHaveLength(0);
    const lease = await f.lock.tryLock(0);
    await lease?.release();
    await f.runtime.close();
  });
  it.each(['abort', 'deadline', 'ttl', 'closing'] as const)(
    'cleans confirmed late %s success and never invokes runner',
    async (mode) => {
      const time = new ManualTime();
      const gate = deferred<BackendGrant | undefined>();
      const entered = deferred<BackendAcquireRequest>();
      const release = vi.fn(async () => {});
      const runner = vi.fn(() => 1);
      const controller = new AbortController();
      const backend = new ControlledBackend({
        acquire: (request) => {
          entered.resolve(request);
          return gate.promise;
        },
      });
      const runtime = await createConcurrentRuntime({
        backend,
        namespace: 'late',
        clock: time,
        scheduler: time,
      });
      const executor = await runtime.manager.createSynchronous('r');
      const work = executor.run(runner, {
        timeoutMs: 5,
        signal: controller.signal,
      });
      const assertion = rejection(
        work,
        mode === 'abort' || mode === 'closing'
          ? ConcurrentAbortError
          : ConcurrentAcquireError,
      );
      await entered.promise;
      let close: Promise<void> | undefined;
      if (mode === 'abort') controller.abort();
      if (mode === 'deadline') time.advance(5);
      if (mode === 'closing') close = runtime.close();
      gate.resolve({ notAfter: mode === 'ttl' ? 0 : 30000, release });
      await assertion;
      expect(runner).not.toHaveBeenCalled();
      expect(release).toHaveBeenCalledTimes(1);
      await (close ?? runtime.close());
      expect(time.pendingTimers).toBe(0);
    },
  );
  it('does not let cancellation after synchronous runner entry control business', async () => {
    const f = await fixture();
    const controller = new AbortController();
    expect(
      await f.executor.run(
        ({ signal }) => {
          controller.abort();
          expect(signal.aborted).toBe(false);
          return 12;
        },
        { signal: controller.signal },
      ),
    ).toBe(12);
    await f.runtime.close();
  });
  it('shares in-flight release, retries the original grant and never reacquires', async () => {
    const gate = deferred<void>();
    let attempts = 0;
    const f = await fixture(async () => {
      attempts++;
      if (attempts === 1) await gate.promise;
    });
    const lease = await f.lock.lock();
    const first = lease.release();
    expect(lease.release()).toBe(first);
    const failed = rejection(first, ConcurrentReleaseError);
    gate.reject(null);
    await failed;
    await lease.release();
    await lease.release();
    expect(attempts).toBe(2);
    expect(f.backend.requests).toHaveLength(1);
    await f.runtime.close();
  });
  it.each([
    undefined,
    null,
    0,
    false,
    '',
    new Error('independent'),
    Object.assign(new Error('abort'), { name: 'AbortError' }),
  ])(
    'preserves independent business throw %s through expiry and release failure',
    async (value) => {
      let fail = true;
      const f = await fixture(async () => {
        if (fail) throw new Error('release');
      });
      let caught = false;
      try {
        await f.executor.run(() => {
          f.time.advance(30000);
          throw value;
        });
      } catch (error) {
        caught = true;
        expect(error).toBe(value);
      }
      expect(caught).toBe(true);
      fail = false;
      await f.runtime.close();
    },
  );
  it('maps only identity/cause-associated loss and survives cyclic/hostile causes', async () => {
    for (const mode of ['reason', 'cause', 'cycle', 'getter']) {
      const f = await fixture();
      let business: unknown;
      try {
        await f.executor.run(({ signal }) => {
          f.time.advance(30000);
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
        if (mode === 'reason' || mode === 'cause')
          expect(error).toBeInstanceOf(ConcurrentLeaseLostError);
        else expect(error).toBe(business);
      }
      await f.runtime.close();
    }
  });
  it('checks budget despite delayed timers, including time consumed during release', async () => {
    const f = await fixture();
    await expect(
      f.executor.run(() => {
        f.time.advance(30000);
        return 1;
      }),
    ).rejects.toBeInstanceOf(ConcurrentLeaseLostError);
    const g = await fixture(async () => {
      g.time.advance(30000);
    });
    await expect(g.executor.run(() => 1)).rejects.toBeInstanceOf(
      ConcurrentLeaseLostError,
    );
    await f.runtime.close();
    await g.runtime.close();
  });
  it('reports release failure after successful business and close retries abandoned cleanup', async () => {
    let fail = true;
    const f = await fixture(async () => {
      if (fail) throw new Error('release');
    });
    await expect(f.executor.run(() => undefined)).rejects.toBeInstanceOf(
      ConcurrentReleaseError,
    );
    fail = false;
    await f.runtime.close();
  });
  it('close times out without discarding real runner or expired manual handles', async () => {
    const f = await fixture();
    const entered = deferred<void>();
    const end = deferred<void>();
    const work = f.executor.run(() => {
      entered.resolve();
      return end.promise;
    });
    await entered.promise;
    const manual = await f.lock.lock();
    const closing = f.runtime.close({ timeoutMs: 10 });
    const assertion = rejection(closing, ConcurrentCloseError);
    f.time.advance(30000);
    f.time.flush();
    await assertion;
    await expect(f.lock.tryLock()).rejects.toBeInstanceOf(
      ConcurrentAcquireError,
    );
    await expect(f.runtime.manager.createLock('new')).rejects.toBeInstanceOf(
      ConcurrentAcquireError,
    );
    const failedWork = rejection(work, ConcurrentLeaseLostError);
    end.resolve();
    await failedWork;
    const again = f.runtime.close({ timeoutMs: 1 });
    const againAssertion = rejection(again, ConcurrentCloseError);
    f.time.advance(1);
    f.time.flush();
    await againAssertion;
    await manual.release();
    await f.runtime.close();
  });
  it('tracks visible session close beyond a timeout and permits retry', async () => {
    const f = await fixture();
    const gate = deferred<void>();
    const backend = new ControlledBackend({
      acquire: async () => undefined,
      closeSession: () => gate.promise,
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'close',
      clock: f.time,
      scheduler: f.time,
    });
    const work = runtime.close({ timeoutMs: 1 });
    const assertion = rejection(work, ConcurrentCloseError);
    await flush();
    f.time.advance(1);
    f.time.flush();
    await assertion;
    gate.resolve();
    await flush();
    await runtime.close();
    await f.runtime.close();
  });
});
