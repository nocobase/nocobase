import { vi } from 'vitest';
import { Cache } from '../cache';
import { CacheManager } from '../cache-manager';

describe('cache-manager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  afterEach(() => {
    cacheManager = null;
  });

  it('create with default config', async () => {
    cacheManager.registerStore({ name: 'memory', store: 'memory' });
    const cache = await cacheManager.createCache({ name: 'test', store: 'memory' });
    expect(cache).toBeDefined();
    expect(cache.name).toBe('test');
    expect(cacheManager.caches.has('test')).toBeTruthy();
  });

  it('create with custom config', async () => {
    cacheManager.registerStore({ name: 'memory', store: 'memory' });
    const cache = (await cacheManager.createCache({ name: 'test', store: 'memory', ttl: 100 })) as Cache;
    expect(cache).toBeDefined();
    expect(cache.name).toBe('test');
    expect(cacheManager.caches.has('test')).toBeTruthy();
  });

  it('should close store', async () => {
    const close = vi.fn();
    cacheManager.registerStore({
      name: 'memory',
      store: 'memory',
      close,
    });
    await cacheManager.createCache({ name: 'test', store: 'memory' });
    await cacheManager.close();
    expect(close).toBeCalled();
  });
});
