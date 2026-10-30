import { describe, expect, it, vi } from 'vitest';
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
describe('concurrency manager facade', () => {
  it('allows an explicit TTL override without wrapping the returned Lock acquisition methods', async () => {
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
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(await executor.tryRun(() => 'after-expiry')).toEqual({
          acquired: true,
          value: 'after-expiry',
        });
      } finally {
        await lease.release().catch(() => {});
      }
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
  it('reads ttl once, supplies its default and rejects unrecognized creation options', async () => {
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
      await new Promise((resolve) => setTimeout(resolve, 20));
      const replacement = await lock.tryLock();
      expect(replacement).toBeDefined();
      await replacement!.release();
      expect(() =>
        manager.createLock('bad', { timeoutMs: 1 } as never),
      ).toThrow(ConcurrentConfigurationError);
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
