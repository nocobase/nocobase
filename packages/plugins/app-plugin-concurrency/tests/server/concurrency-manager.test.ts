import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConcurrentConfigurationError } from '@nocobase/concurrency';
import { ManagedConcurrencyService } from '../../server/services/concurrency.js';

async function service(
  config: unknown = { default: 'memory', memory: { adapter: 'mutex' } },
) {
  const host = new ManagedConcurrencyService({
    appName: 'crm',
    nodeEnv: 'development',
  });
  host.boot(config);
  await host.start();
  return host;
}
afterEach(() => vi.useRealTimers());
describe('concurrency manager facade', () => {
  it('S03/C03: validates resource ttl but ignores both resource and configuration durations', async () => {
    vi.useFakeTimers();
    const host = await service({
      default: 'memory',
      memory: { adapter: 'mutex', ttl: 1000 },
    });
    try {
      const manager = await host.getManager();
      const lock = await manager.createLock('override', { ttl: 5 });
      const executor = await manager.createSynchronous('override', {
        ttl: 1000,
      });
      const lease = await lock.lock();
      try {
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(10000);
        const attempt = executor.tryRun(() => 'wrong', 10);
        await vi.advanceTimersByTimeAsync(10);
        expect(await attempt).toEqual({ acquired: false });
      } finally {
        await lease.release();
      }
      expect(await executor.run(() => 'released')).toBe('released');
    } finally {
      await host.shutdown();
    }
  });
  it('shares same-item initialization and returns only core business factories', async () => {
    const host = await service();
    try {
      const managers = await Promise.all(
        Array.from({ length: 20 }, () => host.getManager('memory')),
      );
      expect(new Set(managers).size).toBe(1);
      expect(Object.keys(managers[0]!)).toEqual([
        'createLock',
        'createSynchronous',
      ]);
      expect(managers[0]).not.toHaveProperty('close');
    } finally {
      await host.shutdown();
    }
  });
  it('rejects explicit unknown names instead of falling back', async () => {
    const host = await service();
    try {
      for (const name of ['missing', '', 'default', 'Memory', ' memory'])
        await expect(host.getManager(name)).rejects.toBeInstanceOf(
          ConcurrentConfigurationError,
        );
    } finally {
      await host.shutdown();
    }
  });
  it('reserves mutex namespace before concurrent initialization, including the fallback', async () => {
    const host = await service({
      a: { adapter: 'mutex' },
      b: { adapter: 'mutex', namespace: 'other' },
    });
    try {
      await expect(host.getManager('a')).rejects.toThrow('owns this namespace');
      const manager = await host.getManager('b');
      const lock = await manager.createLock('resource');
      const lease = await lock.tryLock();
      expect(lease).toBeDefined();
      await lease!.release();
    } finally {
      await host.shutdown();
    }
    const explicit = await service({
      default: 'base',
      base: { adapter: 'mutex', namespace: 'base' },
      a: { adapter: 'mutex' },
      b: { adapter: 'mutex' },
    });
    try {
      const results = await Promise.allSettled([
        explicit.getManager('a'),
        explicit.getManager('b'),
      ]);
      expect(results.map((result) => result.status)).toEqual([
        'fulfilled',
        'rejected',
      ]);
    } finally {
      await explicit.shutdown();
    }
  });
  it('reads ttl once, ignores the configured duration and rejects unrecognized creation options', async () => {
    vi.useFakeTimers();
    const host = await service({
      default: 'memory',
      memory: { adapter: 'mutex', ttl: 5 },
    });
    const manager = await host.getManager();
    const ttl = vi.fn(() => undefined);
    const lock = await manager.createLock('resource', {
      get ttl() {
        return ttl();
      },
    });
    expect(ttl).toHaveBeenCalledOnce();
    const lease = await lock.lock();
    try {
      await vi.advanceTimersByTimeAsync(20);
      expect(vi.getTimerCount()).toBe(0);
      const attempt = lock.tryLock(10);
      await vi.advanceTimersByTimeAsync(10);
      expect(await attempt).toBeUndefined();
      await expect(
        manager.createLock('bad', { timeoutMs: 1 } as never),
      ).rejects.toBeInstanceOf(ConcurrentConfigurationError);
    } finally {
      await lease.release().catch(() => {});
      await host.shutdown();
    }
  });
  it('does not switch even uninitialized configurations when caller config changes', async () => {
    const config = {
      default: 'memory',
      memory: { adapter: 'mutex' },
      later: { adapter: 'mutex', namespace: 'later', ttl: 10 },
    };
    const host = await service(config);
    try {
      config.default = 'later';
      config.later.namespace = 'crm';
      expect(await host.getManager()).toBe(await host.getManager('memory'));
      await expect(host.getManager('later')).resolves.toBeDefined();
    } finally {
      await host.shutdown();
    }
  });
});
