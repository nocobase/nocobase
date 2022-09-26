import { createCache, createDefaultCacheConfig } from '@nocobase/cache';

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('cache', () => {
  it('createCache-with-mem', async () => {
    const cacheConfig = createDefaultCacheConfig();
    cacheConfig.ttl = 1;
    const cache = createCache(cacheConfig);
    await cache.set('name', 'Emma');
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(100);
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(1005);
    expect(await cache.get('name')).toBeUndefined();
  });

  it('createCache-with-default-cache-manager-fs-hash', async () => {
    const cacheConfig = createDefaultCacheConfig();
    cacheConfig.ttl = 1;
    cacheConfig.storePackage = 'cache-manager-fs-hash';
    const cache = createCache(cacheConfig);
    await cache.set('name', 'Emma');
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(100);
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(1005);
    expect(await cache.get('name')).toBeUndefined();
  });
});
