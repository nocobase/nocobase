import { createCache, createDefaultCacheConfig } from '@nocobase/cache';
import { sleep } from 'testUtils';

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

  it('createCache-with-single-config', async () => {
    let cacheConfigStr = '{"store":"memory","ttl":1,"max":10}';
    let cacheConfig = JSON.parse(cacheConfigStr);
    let cache = createCache(cacheConfig);
    await cache.set('name', 'Emma');
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(100);
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(1005);
    expect(await cache.get('name')).toBeUndefined();

    cacheConfigStr = '[{"store":"memory","ttl":1,"max":10}]';
    cacheConfig = JSON.parse(cacheConfigStr);
    cache = createCache(cacheConfig);
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

  // TODO: 本地运行没问题，但是 ci 环境会失败，暂时跳过
  it.skip('createCache-multi-cache', async () => {
    const cacheConfigStr =
      '[{"store":"memory","ttl":1,"max":10},{"storePackage":"cache-manager-fs-hash","ttl":10,"max":100}]';
    const cacheConfig = JSON.parse(cacheConfigStr);
    const cache = createCache(cacheConfig);

    await cache.set('name', 'Emma');
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(1005);
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(5000);
    expect(await cache.get('name')).toEqual('Emma');
    await sleep(5000);
    expect(await cache.get('name')).toBeUndefined();
  });
});
