import { describe, it, expect } from 'vitest';
import {
  createConcurrentRuntime,
  ConcurrentAbortError,
  ConcurrentAcquireError,
  ConcurrentConfigurationError,
} from '../src/index.ts';
import type {
  BackendAcquireRequest,
  BackendGrant,
} from '../src/backend/index.ts';
import {
  ControlledBackend,
  ManualTime,
  deferred,
} from '../src/testing/index.ts';

describe('ordinary acquisition contract', () => {
  for (const method of ['lock', 'run'] as const) {
    it.each(['grant', 'abort', 'close', 'error'] as const)(
      `${method} keeps waiting beyond 30 seconds and handles %s`,
      async (outcome) => {
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
          namespace: 'ordinary',
          clock: time,
          scheduler: time,
        });
        const lock = await runtime.manager.createLock('r');
        const executor = await runtime.manager.createSynchronous('r');
        const controller = new AbortController();
        let ran = false;
        let settled = false;
        const work =
          method === 'lock'
            ? lock
                .lock({ signal: controller.signal })
                .then((lease) => lease.release())
            : executor.run(
                () => {
                  ran = true;
                },
                { signal: controller.signal },
              );
        // Observe rejection before deliberately settling the controlled backend.
        const observed = work.then(
          () => {
            settled = true;
            return { ok: true as const };
          },
          (error: unknown) => {
            settled = true;
            return { ok: false as const, error };
          },
        );
        const request = await entered.promise;
        expect(request.wait).toEqual({ kind: 'unbounded' });
        expect(time.pendingTimers).toBe(0);
        time.advance(60000);
        time.flush();
        await Promise.resolve();
        expect(request.signal.aborted).toBe(false);
        expect(settled).toBe(false);
        expect(ran).toBe(false);
        expect(backend.requests).toHaveLength(1);
        let closing: Promise<void> | undefined;
        const failure = new Error('Command failed');
        if (outcome === 'abort') controller.abort('cancel');
        if (outcome === 'close') closing = runtime.close();
        if (outcome === 'error') response.reject(failure);
        else if (outcome === 'grant')
          response.resolve({
            notAfter: time.now() + 100,
            release: async () => {},
          });
        else {
          expect(request.signal.aborted).toBe(true);
          response.resolve(undefined);
        }
        const result = await observed;
        if (outcome === 'grant') {
          expect(result.ok).toBe(true);
          expect(ran).toBe(method === 'run');
        } else {
          expect(result.ok).toBe(false);
          if (result.ok) throw new Error('Expected failure');
          expect(result.error).toBeInstanceOf(
            outcome === 'error' ? ConcurrentAcquireError : ConcurrentAbortError,
          );
          if (
            result.error instanceof ConcurrentAcquireError &&
            outcome === 'error'
          )
            expect(result.error.cause).toBe(failure);
          expect(ran).toBe(false);
        }
        await (closing ?? runtime.close());
        expect(time.pendingTimers).toBe(0);
      },
    );
  }

  it.each([undefined, 0, 10, Infinity])(
    'rejects a removed JavaScript timeout option %s before acquisition',
    async (timeoutMs) => {
      const backend = new ControlledBackend({
        acquire: async () => {
          throw new Error('Must not acquire');
        },
      });
      const runtime = await createConcurrentRuntime({
        backend,
        namespace: 'invalid',
      });
      const lock = await runtime.manager.createLock('r');
      const executor = await runtime.manager.createSynchronous('r');
      const options = { signal: new AbortController().signal, timeoutMs };
      await expect(lock.lock(options)).rejects.toBeInstanceOf(
        ConcurrentConfigurationError,
      );
      await expect(executor.run(() => 1, options)).rejects.toBeInstanceOf(
        ConcurrentConfigurationError,
      );
      await expect(lock.tryLock(1, options)).rejects.toBeInstanceOf(
        ConcurrentConfigurationError,
      );
      await expect(executor.tryRun(() => 1, 1, options)).rejects.toBeInstanceOf(
        ConcurrentConfigurationError,
      );
      expect(backend.requests).toHaveLength(0);
      await runtime.close();
    },
  );

  it.each([undefined, 0, 30000])(
    'rejects removed global acquisition budgets %s before claiming a backend',
    async (defaultAcquireTimeoutMs) => {
      const backend = new ControlledBackend({ acquire: async () => undefined });
      const options = {
        backend,
        namespace: 'invalid',
        defaultAcquireTimeoutMs,
      };
      await expect(createConcurrentRuntime(options)).rejects.toBeInstanceOf(
        ConcurrentConfigurationError,
      );
      expect(backend.contexts).toHaveLength(0);
    },
  );

  it('rejects and closes an owned backend with an unsupported protocol version', async () => {
    let closed = 0;
    const backend = new ControlledBackend({
      acquire: async () => undefined,
      close: async () => {
        closed++;
      },
    });
    Object.defineProperty(backend, 'protocolVersion', { value: 2 });
    await expect(
      createConcurrentRuntime({ backend, namespace: 'bad-protocol' }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    expect(closed).toBe(1);
    expect(backend.requests).toHaveLength(0);
  });
});
