import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCaching,
  MemoryCacheProvider,
  MemoryCache,
  ManagedCacheProvider,
  resolveTtlConfig,
  type CachingConfig,
} from '../src/index.js';

const resources: Array<{ dispose(): Promise<void> }> = [];
function memory(): MemoryCacheProvider {
  const provider = new MemoryCacheProvider();
  resources.push(provider);
  return provider;
}

afterEach(async () => {
  await Promise.all(resources.splice(0).map((resource) => resource.dispose()));
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('provider lifetime and portable contracts', () => {
  it('exposes a reusable lifecycle decorator with stable capabilities and unchanged backend failures', async () => {
    const inner = new MemoryCacheProvider();
    const raw = inner.createCache({ namespace: 'decorated' });
    const failure = new Error('controlled backend failure');
    vi.spyOn(raw, 'get').mockRejectedValueOnce(failure);
    const released = vi.spyOn(inner, 'dispose');
    const provider = new ManagedCacheProvider(inner);
    resources.push(provider);
    const cache = provider.createCache({ namespace: 'decorated' });
    expect(provider.createCache({ namespace: 'decorated' })).toBe(cache);
    expect(provider.createCounter({ namespace: 'counter' })).toBe(
      provider.createCounter({ namespace: 'counter' }),
    );
    expect(provider.createBloomFilter({ namespace: 'filter' })).toBe(
      provider.createBloomFilter({ namespace: 'filter' }),
    );
    await expect(cache.get('key')).rejects.toBe(failure);
    await cache.set('key', false);
    expect(await cache.get('key')).toBe(false);
    await provider.dispose();
    await provider.dispose();
    expect(released).toHaveBeenCalledOnce();
  });

  it('allows unused unavailable driver definitions, but never falls back when selected', async () => {
    const caching = createCaching({
      default: 'local',
      providers: {
        local: { driver: 'memory' },
        reserved: { driver: 'redis', connection: 'invalid-unused-value' },
      },
    });
    resources.push(caching);
    expect(() => caching.validateDefaultProvider()).not.toThrow();
    await caching.getCache({ namespace: 'app' }).set('key', false);
    expect(() =>
      caching.getCache({ namespace: 'app', provider: 'reserved' }),
    ).toThrow('not registered');
    expect(() =>
      caching.getCounter({ namespace: 'app', provider: 'missing' }),
    ).toThrow('not configured');
  });

  it('retains a provider returned by a factory that reenters manager shutdown', async () => {
    const caching = createCaching({
      default: 'remote',
      providers: { remote: { driver: 'remote' } },
    });
    const inner = new MemoryCacheProvider();
    resources.push(inner, caching);
    const released = vi.spyOn(inner, 'dispose');
    let closing: Promise<void> | undefined;
    caching.registerDriver({
      name: 'remote',
      createProvider: () => {
        closing = caching.dispose();
        return inner;
      },
    });
    expect(() => caching.getCache({ namespace: 'never-returned' })).toThrow(
      'closed',
    );
    await closing;
    expect(released).toHaveBeenCalledOnce();
    expect(() => inner.createCache({ namespace: 'closed' })).toThrow('closed');
  });

  it('rejects recursive provider initialization and can retry after factory failure', async () => {
    const caching = createCaching({
      default: 'remote',
      providers: { remote: { driver: 'remote' } },
    });
    resources.push(caching);
    let recursive = true;
    caching.registerDriver({
      name: 'remote',
      createProvider: () => {
        if (recursive) caching.getCache({ namespace: 'recursive' });
        return new MemoryCacheProvider();
      },
    });
    expect(() => caching.getCache({ namespace: 'first' })).toThrow(
      'initialization is already in progress',
    );
    recursive = false;
    await caching.getCache({ namespace: 'retry' }).set('key', true);
  });

  it('isolates equal driver names, registrations and shutdown between instances', async () => {
    const config = {
      default: 'remote',
      providers: { remote: { driver: 'remote' } },
    };
    const a = createCaching(config);
    const b = createCaching(config);
    resources.push(a, b);
    const driver = {
      name: 'remote',
      createProvider: () => new MemoryCacheProvider(),
    };
    a.registerDriver(driver);
    expect(() => b.validateDefaultProvider()).toThrow('not registered');
    b.registerDriver(driver);
    expect(() => a.registerDriver(driver)).toThrow('already registered');
    const first = a.getCache({ namespace: 'shared' });
    const second = b.getCache({ namespace: 'shared' });
    await first.set('key', 'a');
    await second.set('key', 'b');
    await a.dispose();
    await expect(first.get('key')).rejects.toThrow('closed');
    await expect(second.get('key')).resolves.toBe('b');
    await b.getCache({ namespace: 'created-after-a-closed' }).set('key', 1);
    expect(() => a.registerDriver({ ...driver, name: 'new' })).toThrow(
      'closed',
    );
  });

  it('snapshots configuration and leaves provider-specific validation lazy', async () => {
    const definition = {
      driver: 'memory',
      defaultTtl: 10,
      nested: { marker: 1 },
    };
    const config: CachingConfig = {
      default: 'local',
      providers: { local: definition },
    };
    const caching = createCaching(config);
    resources.push(caching);
    definition.driver = 'unavailable';
    definition.defaultTtl = 20;
    config.default = 'missing';
    const cache = caching.getCache({ namespace: 'app' });
    expect(cache).toBe(caching.getCache({ namespace: 'app', defaultTtl: 10 }));
    expect(() =>
      caching.getCache({ namespace: 'app', defaultTtl: 20 }),
    ).toThrow('different default TTL');
    await cache.set('key', 1);
  });

  it('round-trips portable JSON values and preserves bulk ordering and repeated keys', async () => {
    const cache = memory().createCache({ namespace: 'json-intersection' });
    const values = [
      null,
      false,
      0,
      '',
      ['nested', null, 1],
      { nested: { enabled: true } },
    ];
    await cache.setMany(
      values.map((value, index) => ({ key: String(index), value })),
    );
    expect(await cache.getMany(['3', 'missing', '1', '0', '3'])).toEqual([
      '',
      undefined,
      false,
      null,
      '',
    ]);
    for (const [index, value] of values.entries()) {
      expect(await cache.has(String(index))).toBe(true);
      expect(await cache.take(String(index))).toEqual(value);
      expect(await cache.has(String(index))).toBe(false);
    }
    await cache.setMany([
      { key: 'repeat', value: 1 },
      { key: 'repeat', value: 2 },
    ]);
    expect(await cache.get('repeat')).toBe(2);
    expect(await cache.deleteMany(['repeat', 'repeat', 'missing'])).toBe(1);
  });

  it('does not cache failed or undefined loaders and permits a subsequent loader', async () => {
    const cache = memory().createCache({ namespace: 'loader-retry' });
    const failure = new Error('controlled loader failure');
    await expect(
      cache.wrap('key', () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(await cache.has('key')).toBe(false);
    expect(await cache.wrap('key', () => undefined)).toBeUndefined();
    expect(await cache.has('key')).toBe(false);
    expect(await cache.wrap('key', () => false)).toBe(false);
    expect(await cache.has('key')).toBe(true);
  });

  it('inherits Cache TTLs without leaking defaults or later TTLs into Counters', async () => {
    vi.useFakeTimers();
    const provider = new MemoryCacheProvider({ defaultTtl: 5 });
    resources.push(provider);
    const inherited = provider.createCache({ namespace: 'inherited' });
    const explicit = provider.createCache({
      namespace: 'explicit',
      defaultTtl: 10,
    });
    const counter = provider.createCounter({ namespace: 'independent' });
    await inherited.set('key', true);
    await explicit.set('key', true);
    await counter.increment('permanent', -0.5);
    await vi.advanceTimersByTimeAsync(6);
    expect(await inherited.has('key')).toBe(false);
    expect(await explicit.has('key')).toBe(true);
    expect(await counter.increment('permanent', 0.25, 1)).toBe(-0.25);
    await vi.advanceTimersByTimeAsync(5);
    expect(await explicit.has('key')).toBe(false);
    expect(await counter.get('permanent')).toBe(-0.25);
    await counter.increment('expiring', 1, 1.1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await counter.get('expiring')).toBe(1);
    await vi.advanceTimersByTimeAsync(2);
    expect(await counter.get('expiring')).toBe(0);
  });

  it('snapshots batch arguments before deferring admitted operations', async () => {
    const cache = memory().createCache({ namespace: 'snapshot' });
    const entries = [{ key: 'original', value: 1, ttl: 100_000 }];
    const write = cache.setMany(entries);
    entries[0].key = 'replacement';
    entries[0].ttl = -1;
    await write;
    const keys = ['original'];
    const read = cache.getMany(keys);
    keys[0] = 'replacement';
    expect(await read).toEqual([1]);
    expect(await cache.has('replacement')).toBe(false);
  });

  it('preserves Memory values outside the Redis JSON contract', async () => {
    const provider = new MemoryCacheProvider({ useClone: false });
    resources.push(provider);
    const cache = provider.createCache({ namespace: 'values' });
    const value = {
      date: new Date(0),
      missing: undefined,
      buffer: Buffer.from('memory'),
    };
    await cache.set('key', value);
    expect(await cache.get('key')).toBe(value);
  });

  it('rounds positive fractional TTL upwards and validates the whole bulk before writes', async () => {
    vi.useFakeTimers();
    expect(resolveTtlConfig('0.001s', 'TTL')).toBe(1);
    expect(resolveTtlConfig(0.1, 'TTL')).toBe(1);
    for (const ttl of [0, -1, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => resolveTtlConfig(ttl, 'TTL')).toThrow();
    }
    const provider = memory();
    const cache = provider.createCache({ namespace: 'ttl', defaultTtl: 0.1 });
    expect(cache).toBe(
      provider.createCache({ namespace: 'ttl', defaultTtl: 0.9 }),
    );
    await cache.set('key', 'value');
    await expect(
      cache.setMany([
        { key: 'first', value: 1 },
        { key: 'bad', value: 2, ttl: -1 },
      ]),
    ).rejects.toThrow();
    expect(await cache.get('first')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(2);
    expect(await cache.get('key')).toBeUndefined();
  });

  it('rejects counter overflow before changing the stored finite result', async () => {
    const counter = memory().createCounter({ namespace: 'numbers' });
    expect(await counter.increment('fraction', -0.5)).toBe(-0.5);
    expect(await counter.increment('fraction', 0.25)).toBe(-0.25);
    expect(await counter.increment('large', Number.MAX_VALUE)).toBe(
      Number.MAX_VALUE,
    );
    await expect(counter.increment('large', Number.MAX_VALUE)).rejects.toThrow(
      'finite',
    );
    expect(await counter.get('large')).toBe(Number.MAX_VALUE);
  });

  it('drains accepted loaders and writeback while rejecting all new handle operations', async () => {
    const provider = memory();
    const cache = provider.createCache({ namespace: 'loader' });
    const counter = provider.createCounter({ namespace: 'counter' });
    const filter = provider.createBloomFilter({ namespace: 'filter' });
    const entered = Promise.withResolvers<void>();
    const loader = Promise.withResolvers<string>();
    const result = cache.wrap('key', () => {
      entered.resolve();
      return loader.promise;
    });
    await entered.promise;
    const closed = provider.dispose();
    expect(provider.dispose()).toBe(closed);
    expect(() => provider.createCache({ namespace: 'new' })).toThrow('closed');
    await expect(cache.get('key')).rejects.toThrow('closed');
    await expect(counter.increment('key')).rejects.toThrow('closed');
    await expect(filter.has('key', 'value')).rejects.toThrow('closed');
    loader.resolve('loaded');
    await expect(result).resolves.toBe('loaded');
    await closed;
    await expect(cache.set('key', 'later')).rejects.toThrow('closed');
  });

  it('stops expiry timers in every Memory namespace, retaining only failed cleanup for retry', async () => {
    vi.useFakeTimers();
    const provider = new MemoryCacheProvider({ checkInterval: 5 });
    resources.push(provider);
    provider.createCache({ namespace: 'first' });
    provider.createCache({ namespace: 'second' });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    const disconnect = vi
      .spyOn(MemoryCache.prototype, 'disconnect')
      .mockRejectedValueOnce(new Error('controlled disconnect failure'));
    await expect(provider.dispose()).rejects.toThrow('cleanup failed');
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    await provider.dispose();
    expect(disconnect.mock.contexts.map((cache) => cache.namespace)).toEqual([
      'first',
      'second',
      'first',
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retains timed-out work and lets a new close observer wait for actual cleanup', async () => {
    vi.useFakeTimers();
    const provider = memory();
    const cache = provider.createCache({ namespace: 'loader' });
    const entered = Promise.withResolvers<void>();
    const loader = Promise.withResolvers<string>();
    const result = cache.wrap('key', () => {
      entered.resolve();
      return loader.promise;
    });
    await entered.promise;
    const first = provider.dispose();
    void first.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(first).rejects.toThrow('timed out');
    const retry = provider.dispose();
    loader.resolve('loaded');
    await result;
    await retry;
    expect(vi.getTimerCount()).toBe(0);
    await expect(cache.has('key')).rejects.toThrow('closed');
  });

  it('waits for every cleanup and retries failures without reopening or reclosing successes', async () => {
    const caching = createCaching({
      default: 'a',
      providers: { a: { driver: 'test' }, b: { driver: 'test' } },
    });
    resources.push(caching);
    const slow = Promise.withResolvers<void>();
    const a = new MemoryCacheProvider();
    const b = new MemoryCacheProvider();
    const releaseA = vi
      .spyOn(a, 'dispose')
      .mockRejectedValueOnce(new Error('controlled close failure'));
    const originalB = b.dispose.bind(b);
    const releaseB = vi.spyOn(b, 'dispose').mockImplementation(async () => {
      await slow.promise;
      await originalB();
    });
    caching.registerDriver({
      name: 'test',
      createProvider: (_config, context) => (context.name === 'a' ? a : b),
    });
    const cache = caching.getCache({ namespace: 'a' });
    caching.getCache({ namespace: 'b', provider: 'b' });
    let settled = false;
    const first = caching.dispose();
    void first.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    slow.resolve();
    await expect(first).rejects.toThrow('cleanup failed');
    await expect(cache.get('key')).rejects.toThrow('closed');
    const retry = caching.dispose();
    expect(caching.dispose()).toBe(retry);
    await retry;
    expect(releaseA).toHaveBeenCalledTimes(2);
    expect(releaseB).toHaveBeenCalledTimes(1);
  });
});
