import { CacheManager } from '../cache-manager';

describe('cache-manager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  afterEach(() => {
    cacheManager = null;
  });

  it('register', async () => {
    await cacheManager.register('memory', 'memory');
    expect(cacheManager.stores.has('memory')).toBeTruthy();
    expect(cacheManager.caches.has('memory')).toBeTruthy();
  });

  it('create with default config', async () => {
    await cacheManager.register('memory', 'memory');
    const cache = cacheManager.create('test');
    expect(cache).toBeDefined();
    expect(cache.namespace).toBe('test');
    expect(cacheManager.caches.has('test')).toBeTruthy();
  });

  it('create with custom config', async () => {
    await cacheManager.register('memory', 'memory');
    const cache = await cacheManager.create('test', 'memory', { ttl: 100 });
    expect(cache).toBeDefined();
    expect(cache.namespace).toBe('test');
    expect(cacheManager.caches.has('test')).toBeTruthy();
  });
});
