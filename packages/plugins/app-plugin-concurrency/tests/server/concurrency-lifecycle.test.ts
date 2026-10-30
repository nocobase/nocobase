import { describe, expect, it, vi } from 'vitest';
import {
  ConcurrentAcquireError,
  ConcurrentCloseError,
  ConcurrentConfigurationError,
} from '@nocobase/concurrency';
import { LocalConcurrentBackend } from '../../server/index.ts';
import { ManagedConcurrencyService } from '../../server/services/concurrency.js';

describe('concurrency host lifecycle', () => {
  it('runs one lazy factory for concurrent consumers and retains a failed item without request-driven retries', async () => {
    const host = new ManagedConcurrencyService({
      appName: 'crm',
      nodeEnv: 'development',
    });
    const gate = Promise.withResolvers<void>();
    const create = vi.fn(async () => {
      await gate.promise;
      return {
        backend: new LocalConcurrentBackend(),
        dispose: () => Promise.resolve(),
      };
    });
    const failedCreate = vi.fn(() =>
      Promise.reject(new Error('factory-failed')),
    );
    host.registerImplementation('test', { validate: () => {}, create });
    host.registerImplementation('failed', {
      validate: () => {},
      create: failedCreate,
    });
    host.boot({ lazy: { adapter: 'test' }, failure: { adapter: 'failed' } });
    await host.start();
    const consumers = Array.from({ length: 20 }, () => host.getManager('lazy'));
    await Promise.resolve();
    expect(create).toHaveBeenCalledOnce();
    gate.resolve();
    expect(new Set(await Promise.all(consumers)).size).toBe(1);
    const firstError = await host
      .getManager('failure')
      .catch((error: unknown) => error);
    const secondError = await host
      .getManager('failure')
      .catch((error: unknown) => error);
    expect(firstError).toBeInstanceOf(ConcurrentConfigurationError);
    expect(secondError).toBe(firstError);
    expect(failedCreate).toHaveBeenCalledOnce();
    await host.shutdown();
  });
  it('does not report a successful start after shutdown overtakes default initialization', async () => {
    const host = new ManagedConcurrencyService({ appName: 'crm' });
    const gate = Promise.withResolvers<void>();
    const backend = new LocalConcurrentBackend();
    const dispose = vi.fn(() => Promise.resolve());
    host.registerImplementation('test', {
      validate: () => {},
      create: async () => {
        await gate.promise;
        return { backend, dispose };
      },
    });
    host.boot({
      default: 'main',
      main: { adapter: 'test', shutdownTimeoutMs: 10 },
    });
    const starting = host.start().then(
      () => {
        throw new Error('Startup must reject after shutdown.');
      },
      (error: unknown) => {
        expect(error).toBeInstanceOf(ConcurrentAcquireError);
      },
    );
    await expect(host.shutdown()).rejects.toBeInstanceOf(ConcurrentCloseError);
    gate.resolve();
    await starting;
    await host.shutdown();
    expect(dispose).toHaveBeenCalledOnce();
  });
  it('rejects early access, late/duplicate registrations and replacement of mutex', async () => {
    const host = new ManagedConcurrencyService({ appName: 'crm' });
    const implementation = { validate: vi.fn(), create: vi.fn() };
    await expect(host.getManager()).rejects.toBeInstanceOf(
      ConcurrentAcquireError,
    );
    expect(() => host.registerImplementation('mutex', implementation)).toThrow(
      ConcurrentConfigurationError,
    );
    host.registerImplementation('test', implementation);
    expect(() => host.registerImplementation('test', implementation)).toThrow(
      ConcurrentConfigurationError,
    );
    host.boot(undefined);
    expect(implementation.create).not.toHaveBeenCalled();
    expect(() => host.registerImplementation('late', implementation)).toThrow(
      ConcurrentConfigurationError,
    );
    await host.shutdown();
  });
  it('does not declare a TTL-expired unreturned lease drained and can retry the original runtime', async () => {
    const host = new ManagedConcurrencyService({
      appName: 'crm',
      nodeEnv: 'development',
    });
    host.boot({
      default: 'memory',
      memory: { adapter: 'mutex', ttl: 5, shutdownTimeoutMs: 10 },
    });
    await host.start();
    const manager = await host.getManager();
    const lock = await manager.createLock('resource');
    const lease = await lock.lock();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await expect(host.shutdown()).rejects.toBeInstanceOf(ConcurrentCloseError);
    await expect(host.getManager()).rejects.toBeInstanceOf(
      ConcurrentAcquireError,
    );
    await lease.release().catch(() => {});
    await host.shutdown();
  });
  it('waits for a real runner and shares a single original backend across concurrent consumers', async () => {
    const host = new ManagedConcurrencyService({ appName: 'crm' });
    const backend = new LocalConcurrentBackend();
    const close = vi.spyOn(backend, 'close');
    const dispose = vi.fn(() => Promise.resolve());
    const create = vi.fn(() => Promise.resolve({ backend, dispose }));
    host.registerImplementation('test', { validate: () => {}, create });
    host.boot({
      default: 'main',
      main: { adapter: 'test', shutdownTimeoutMs: 10 },
    });
    await host.start();
    const managers = await Promise.all([
      host.getManager(),
      host.getManager('main'),
    ]);
    expect(managers[0]).toBe(managers[1]);
    const executor = await managers[0]!.createSynchronous('runner');
    const ready = Promise.withResolvers<void>();
    const finished = Promise.withResolvers<void>();
    const running = executor.run(async () => {
      ready.resolve();
      await finished.promise;
    });
    await ready.promise;
    await expect(host.shutdown()).rejects.toBeInstanceOf(ConcurrentCloseError);
    expect(close).not.toHaveBeenCalled();
    expect(dispose).not.toHaveBeenCalled();
    finished.resolve();
    await running;
    await Promise.all([host.shutdown(), host.shutdown()]);
    expect(create).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
  });
  it('retains late initialization and closes it without handing a manager to the caller', async () => {
    const host = new ManagedConcurrencyService({
      appName: 'crm',
      nodeEnv: 'development',
    });
    const gate = Promise.withResolvers<void>();
    const backend = new LocalConcurrentBackend();
    const dispose = vi.fn(() => Promise.resolve());
    const create = vi.fn(async () => {
      await gate.promise;
      return { backend, dispose };
    });
    host.registerImplementation('test', { validate: () => {}, create });
    host.boot({ lazy: { adapter: 'test', shutdownTimeoutMs: 10 } });
    await host.start();
    const manager = host.getManager('lazy');
    const rejectedManager = manager.then(
      () => {
        throw new Error('A late manager must not be delivered.');
      },
      (error: unknown) => {
        expect(error).toBeInstanceOf(ConcurrentAcquireError);
      },
    );
    await expect(host.shutdown()).rejects.toBeInstanceOf(ConcurrentCloseError);
    gate.resolve();
    await rejectedManager;
    await host.shutdown();
    expect(create).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
  });
  it('retains failed initialization and retries saved backend cleanup before dispose', async () => {
    const host = new ManagedConcurrencyService({ appName: 'crm' });
    const original = new Error('initialize');
    const cleanup = new Error('cleanup');
    const backend = new LocalConcurrentBackend();
    vi.spyOn(backend, 'initialize').mockRejectedValue(original);
    const close = vi
      .spyOn(backend, 'close')
      .mockRejectedValueOnce(cleanup)
      .mockRejectedValueOnce(cleanup);
    const dispose = vi.fn(() => Promise.resolve());
    const create = vi.fn(() => Promise.resolve({ backend, dispose }));
    host.registerImplementation('test', { validate: () => {}, create });
    host.boot({ default: 'main', main: { adapter: 'test' } });
    await expect(host.start()).rejects.toMatchObject({ cause: original });
    await expect(host.shutdown()).rejects.toBeInstanceOf(ConcurrentCloseError);
    expect(dispose).not.toHaveBeenCalled();
    await host.shutdown();
    expect(close).toHaveBeenCalledTimes(3);
    expect(create).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
  });
  it('retries dispose without reclosing the runtime or creating replacement resources', async () => {
    const host = new ManagedConcurrencyService({ appName: 'crm' });
    const backend = new LocalConcurrentBackend();
    const close = vi.spyOn(backend, 'close');
    const dispose = vi
      .fn()
      .mockRejectedValueOnce(new Error('dispose'))
      .mockResolvedValue(undefined);
    const create = vi.fn(() => Promise.resolve({ backend, dispose }));
    host.registerImplementation('test', { validate: () => {}, create });
    host.boot({ default: 'main', main: { adapter: 'test' } });
    await host.start();
    await expect(host.shutdown()).rejects.toBeInstanceOf(ConcurrentCloseError);
    await host.shutdown();
    expect(close).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledTimes(2);
  });
});
