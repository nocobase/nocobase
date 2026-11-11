import { describe, expect, it, vi } from 'vitest';
import { createCaching, MemoryCacheProvider } from '../src/index.js';

describe('instance driver injection', () => {
  it('isolates same-named drivers and preserves the registered factory and receiver', async () => {
    const config = {
      default: 'shared',
      providers: { shared: { driver: 'custom' } },
    };
    const a = createCaching(config);
    const b = createCaching(config);
    const pa = new MemoryCacheProvider();
    const pb = new MemoryCacheProvider();
    const driver = {
      name: 'custom',
      provider: pa,
      createProvider() {
        return this.provider;
      },
    };
    a.registerDriver(driver);
    for (const select of [
      () => b.getCache({ namespace: 'same' }),
      () => b.getCounter({ namespace: 'same' }),
      () => b.getBloomFilter({ namespace: 'same' }),
    ]) {
      expect(select).toThrow('not registered');
    }
    b.registerDriver({ name: 'custom', createProvider: () => pb });
    expect(() => a.registerDriver(driver)).toThrow('already registered');
    driver.name = 'changed';
    driver.createProvider = () => pb;
    const ca = a.getCache({ namespace: 'same' });
    const cb = b.getCache({ namespace: 'same' });
    await ca.set('key', 'a');
    expect(await cb.get('key')).toBeUndefined();
    await Promise.all([a.dispose(), b.dispose()]);
  });

  it('rejects unavailable drivers only when selected and keeps registration lazy', async () => {
    const caching = createCaching({
      default: 'memory',
      providers: { memory: { driver: 'memory' }, unused: { driver: 'absent' } },
    });
    for (const select of [
      () => caching.getCache({ namespace: 'x', provider: 'unused' }),
      () => caching.getCounter({ namespace: 'x', provider: 'unused' }),
      () => caching.getBloomFilter({ namespace: 'x', provider: 'unused' }),
    ]) {
      expect(select).toThrow('not registered');
    }
    for (const provider of ['missing', 'toString', '__proto__']) {
      expect(() => caching.getCache({ namespace: 'x', provider })).toThrow(
        'not configured',
      );
    }
    const factory = vi.fn(() => new MemoryCacheProvider());
    caching.registerDriver({ name: 'absent', createProvider: factory });
    expect(factory).not.toHaveBeenCalled();
    caching.getCache({ namespace: 'x', provider: 'unused' });
    caching.getCounter({ namespace: 'x', provider: 'unused' });
    caching.getBloomFilter({ namespace: 'x', provider: 'unused' });
    expect(factory).toHaveBeenCalledOnce();
    await caching.dispose();
  });

  it('does not treat inherited default names as definitions', () => {
    expect(() => createCaching({ default: 'toString', providers: {} })).toThrow(
      'not configured',
    );
  });

  it('keeps dispose nonterminal and does not unregister drivers', async () => {
    const caching = createCaching({
      default: 'shared',
      providers: { shared: { driver: 'custom' } },
    });
    const factory = vi.fn(() => new MemoryCacheProvider());
    caching.registerDriver({ name: 'custom', createProvider: factory });
    caching.getCache({ namespace: 'x' });
    await caching.dispose();
    caching.getCache({ namespace: 'x' });
    expect(factory).toHaveBeenCalledTimes(2);
    await caching.dispose();
  });
});
