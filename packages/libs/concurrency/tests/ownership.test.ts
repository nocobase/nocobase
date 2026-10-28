import { describe, expect, it, vi } from 'vitest';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentCloseError,
  ConcurrentConfigurationError,
} from '../src/index.ts';
import {
  ControlledBackend,
  ManualTime,
  deferred,
} from '../src/testing/index.ts';

async function flush(): Promise<void> {
  for (let i = 0; i < 40; i++) await Promise.resolve();
}

describe('Runtime-owned backends', () => {
  it('owns one backend and closes it exactly once, without application backend cleanup', async () => {
    const close = vi.fn(async () => {});
    const backend = new ControlledBackend({
      acquire: async () => undefined,
      close,
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'one',
    });
    expect(backend.contexts).toHaveLength(1);
    expect(backend).not.toHaveProperty('openSession');
    expect(runtime).not.toHaveProperty('session');
    await expect(
      createConcurrentRuntime({ backend, namespace: 'other' }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    expect(close).not.toHaveBeenCalled();
    const lock = await runtime.manager.createLock('still-open');
    expect(await lock.tryLock()).toBeUndefined();
    await Promise.all([runtime.close(), runtime.close()]);
    await runtime.close();
    expect(close).toHaveBeenCalledTimes(1);
    await expect(
      createConcurrentRuntime({ backend, namespace: 'closed' }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('claims the backend before asynchronous initialization and does not close another owner', async () => {
    const entered = deferred<void>();
    const gate = deferred<void>();
    const close = vi.fn(async () => {});
    const backend = new ControlledBackend({
      acquire: async () => undefined,
      close,
    });
    const initialize = backend.initialize.bind(backend);
    const spy = vi
      .spyOn(backend, 'initialize')
      .mockImplementationOnce(async (context) => {
        entered.resolve();
        await gate.promise;
        await initialize(context);
      });
    const creating = createConcurrentRuntime({ backend, namespace: 'one' });
    await entered.promise;
    await expect(
      createConcurrentRuntime({ backend, namespace: 'two' }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    gate.resolve();
    const runtime = await creating;
    await runtime.close();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('does not claim or close a backend when runtime options are invalid', async () => {
    const close = vi.fn(async () => {});
    const backend = new ControlledBackend({
      acquire: async () => undefined,
      close,
    });
    await expect(
      createConcurrentRuntime({
        backend,
        namespace: 'invalid',
        operationTimeoutMs: 0,
      }),
    ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    expect(backend.contexts).toHaveLength(0);
    expect(close).not.toHaveBeenCalled();
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'valid',
    });
    await runtime.close();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it.each(['clean', 'cleanup failure', 'logger failure'] as const)(
    'cleans a failed initialization and preserves its error: %s',
    async (mode) => {
      const initialization = new Error('Initialization failed');
      const cleanup = new Error('Cleanup failed');
      const close = vi.fn(async () => {});
      if (mode !== 'clean') close.mockRejectedValueOnce(cleanup);
      const logger = vi.fn(() => {
        if (mode === 'logger failure') throw new Error('Diagnostic failed');
      });
      const backend = new ControlledBackend({
        acquire: async () => undefined,
        close,
      });
      const initialize = vi
        .spyOn(backend, 'initialize')
        .mockRejectedValueOnce(initialization);
      await expect(
        createConcurrentRuntime({ backend, namespace: 'failed', logger }),
      ).rejects.toBe(initialization);
      expect(close).toHaveBeenCalledTimes(1);
      if (mode !== 'clean') {
        expect(logger).toHaveBeenCalledWith({
          phase: 'cleanup',
          error: cleanup,
        });
        // Startup did not return a runtime: the original backend permits exceptional cleanup recovery.
        await backend.close();
        expect(close).toHaveBeenCalledTimes(2);
      } else expect(logger).not.toHaveBeenCalled();
      await expect(
        createConcurrentRuntime({ backend, namespace: 'reused' }),
      ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
      expect(initialize).toHaveBeenCalledTimes(1);
    },
  );

  it('reports one backend close failure to all concurrent waiters and retries only on another close call', async () => {
    const time = new ManualTime();
    const cause = new Error('Backend close failed');
    const close = vi.fn(async () => {}).mockRejectedValueOnce(cause);
    const backend = new ControlledBackend({
      acquire: async () => undefined,
      close,
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'retry',
      clock: time,
      scheduler: time,
    });
    const failures: unknown[] = [];
    const observe = (work: Promise<void>) =>
      work.catch((error: unknown) => {
        failures.push(error);
        return error;
      });
    const first = observe(runtime.close({ timeoutMs: 1 }));
    const second = observe(runtime.close({ timeoutMs: 10 }));
    await flush();
    expect(failures).toHaveLength(2);
    expect(failures[0]).toBeInstanceOf(ConcurrentCloseError);
    expect(failures[0]).toHaveProperty('cause', cause);
    expect(failures[1]).toBe(failures[0]);
    expect(close).toHaveBeenCalledTimes(1);
    await Promise.all([first, second]);
    await expect(runtime.manager.createLock('new')).rejects.toBeInstanceOf(
      ConcurrentAcquireError,
    );
    await runtime.close();
    expect(close).toHaveBeenCalledTimes(2);
    expect(time.pendingTimers).toBe(0);
  });

  it('retains an in-flight backend close across independent caller timeouts', async () => {
    const time = new ManualTime();
    const gate = deferred<void>();
    const close = vi.fn(() => gate.promise);
    const backend = new ControlledBackend({
      acquire: async () => undefined,
      close,
    });
    const runtime = await createConcurrentRuntime({
      backend,
      namespace: 'timeout',
      clock: time,
      scheduler: time,
    });
    const observe = async (work: Promise<void>): Promise<void> => {
      try {
        await work;
      } catch (error) {
        expect(error).toBeInstanceOf(ConcurrentCloseError);
        return;
      }
      throw new Error('Expected close timeout');
    };
    const first = observe(runtime.close({ timeoutMs: 1 }));
    const second = observe(runtime.close({ timeoutMs: 10 }));
    await flush();
    time.advance(1);
    time.flush();
    await first;
    expect(close).toHaveBeenCalledTimes(1);
    time.advance(9);
    time.flush();
    await second;
    expect(close).toHaveBeenCalledTimes(1);
    gate.resolve();
    await flush();
    await runtime.close();
    expect(close).toHaveBeenCalledTimes(1);
    expect(time.pendingTimers).toBe(0);
  });
});
