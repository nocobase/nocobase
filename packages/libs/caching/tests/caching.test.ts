import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCaching, MemoryCacheProvider } from '../src/index.js';

describe('createCaching', () => {
  it('lazily creates the default provider and returns stable namespaced capabilities', async () => {
    const caching = createCaching();

    const cache = caching.getCache({ namespace: 'app' });
    expect(caching.getCache({ namespace: 'app' })).toBe(cache);
    expect(caching.getCounter({ namespace: 'rate-limit' })).toBe(
      caching.getCounter({ namespace: 'rate-limit' }),
    );
    expect(caching.getBloomFilter({ namespace: 'blocked' })).toBe(
      caching.getBloomFilter({ namespace: 'blocked' }),
    );

    await caching.dispose();
  });

  it('parses readable provider and cache TTL configuration', async () => {
    vi.useFakeTimers();
    const caching = createCaching({
      default: 'memory',
      providers: {
        memory: {
          driver: 'memory',
          defaultTtl: '30s',
        },
      },
    });
    const cache = caching.getCache({
      namespace: 'app',
      defaultTtl: '30s',
    });

    await cache.set('key', 'value');
    await vi.advanceTimersByTimeAsync(30_001);

    await expect(cache.get('key')).resolves.toBeUndefined();
    await caching.dispose();
    vi.useRealTimers();
  });

  it('rejects missing defaults and unknown drivers', () => {
    expect(() => createCaching({ default: 'missing', providers: {} })).toThrow(
      'Default cache provider "missing" is not configured.',
    );
    const caching = createCaching({
      default: 'redis',
      providers: { redis: { driver: 'redis' } },
    });
    expect(() => caching.validateDefaultProvider()).toThrow(
      'Cache provider driver "redis" is not registered.',
    );
  });

  it('supplements static provider config when the provider is first used', async () => {
    const client = {};
    const provider = new MemoryCacheProvider();
    const dispose = vi.spyOn(provider, 'dispose');
    let receivedConfig: Record<string, unknown> | undefined;
    const caching = createCaching({
      default: 'remote',
      providers: {
        remote: {
          driver: 'test',
          keyPrefix: 'nocobase',
        },
      },
    });

    caching.registerDriver({
      name: 'test',
      createProvider(config) {
        receivedConfig = config;
        return provider;
      },
    });
    expect(receivedConfig).toBeUndefined();

    const cache = caching.getCache({
      namespace: 'app',
      client,
    });
    await cache.set('key', 'value');

    expect(receivedConfig).toMatchObject({
      driver: 'test',
      keyPrefix: 'nocobase',
      client,
    });
    await expect(
      caching.getCache({ namespace: 'app' }).get('key'),
    ).resolves.toBe('value');
    expect(() => caching.getCache({ namespace: 'other', client: {} })).toThrow(
      'already initialized with a different "client" option',
    );
    expect(() =>
      caching.getCache({ namespace: 'other', keyPrefix: 'other' }),
    ).toThrow('already initialized with a different "keyPrefix" option');

    await caching.dispose();
    expect(dispose).toHaveBeenCalledOnce();
  });
});

describe('MemoryCacheProvider', () => {
  const providers: MemoryCacheProvider[] = [];

  afterEach(async () => {
    vi.useRealTimers();
    await Promise.all(
      providers.splice(0).map((provider) => provider.dispose()),
    );
  });

  function createProvider(
    options?: ConstructorParameters<typeof MemoryCacheProvider>[0],
  ) {
    const provider = new MemoryCacheProvider(options);
    providers.push(provider);
    return provider;
  }

  it('stores namespaced values with TTL and bounded memory', async () => {
    vi.useFakeTimers();
    const provider = createProvider({ maxSize: 2 });
    const first = provider.createCache({ namespace: 'first' });
    const second = provider.createCache({ namespace: 'second' });

    await first.set('ttl', 'value', 100);
    expect(await first.get('ttl')).toBe('value');
    await vi.advanceTimersByTimeAsync(101);
    expect(await first.get('ttl')).toBeUndefined();

    await first.set('one', 1);
    await first.set('two', 2);
    await first.set('three', 3);
    expect(await first.get('one')).toBeUndefined();
    expect(await second.get('three')).toBeUndefined();
  });

  it('atomically takes a value once', async () => {
    const cache = createProvider().createCache({ namespace: 'tokens' });
    await cache.set('token', 'secret');

    const values = await Promise.all([
      cache.take('token'),
      cache.take('token'),
      cache.take('token'),
    ]);

    expect(values.filter((value) => value === 'secret')).toHaveLength(1);
    expect(await cache.get('token')).toBeUndefined();
  });

  it('supports portable bulk cache operations', async () => {
    const cache = createProvider().createCache({ namespace: 'bulk' });

    await cache.setMany([
      { key: 'one', value: 1 },
      { key: 'two', value: 2 },
    ]);

    await expect(
      cache.getMany<number>(['one', 'missing', 'two']),
    ).resolves.toEqual([1, undefined, 2]);
    await expect(cache.has('one')).resolves.toBe(true);
    await expect(cache.deleteMany(['one', 'missing', 'two'])).resolves.toBe(2);
  });

  it('coalesces concurrent wrap loaders and caches falsy values', async () => {
    const cache = createProvider().createCache({ namespace: 'wrap' });
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return false;
    };

    await expect(
      Promise.all([
        cache.wrap('key', loader),
        cache.wrap('key', loader),
        cache.wrap('key', loader),
      ]),
    ).resolves.toEqual([false, false, false]);
    await expect(cache.wrap('key', loader)).resolves.toBe(false);
    expect(calls).toBe(1);
  });

  it('increments atomically without extending the original TTL', async () => {
    vi.useFakeTimers();
    const counter = createProvider().createCounter({ namespace: 'rate-limit' });

    await expect(
      Promise.all([
        counter.increment('ip', 1, 100),
        counter.increment('ip', 1, 100),
        counter.increment('ip', 1, 100),
      ]),
    ).resolves.toEqual([1, 2, 3]);

    await vi.advanceTimersByTimeAsync(80);
    await expect(counter.increment('ip', 1, 100)).resolves.toBe(4);
    await vi.advanceTimersByTimeAsync(21);
    await expect(counter.get('ip')).resolves.toBe(0);
    await expect(counter.increment('ip', 1, 100)).resolves.toBe(1);
  });

  it('provides idempotent, namespaced Bloom filters', async () => {
    const provider = createProvider();
    const first = provider.createBloomFilter({ namespace: 'first' });
    const second = provider.createBloomFilter({ namespace: 'second' });
    const options = { capacity: 100, errorRate: 0.001 };

    await first.reserve('blocked', options);
    await first.reserve('blocked', options);
    await first.addMany('blocked', ['a', 'b']);
    await expect(first.has('blocked', 'a')).resolves.toBe(true);
    await expect(first.has('blocked', 'b')).resolves.toBe(true);
    await expect(second.has('blocked', 'a')).rejects.toThrow(
      'has not been reserved',
    );
    await expect(
      first.reserve('blocked', { ...options, capacity: 200 }),
    ).rejects.toThrow('different options');
  });
});
