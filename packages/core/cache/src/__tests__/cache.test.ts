import { Cache } from '../cache';
import { CacheManager } from '../cache-manager';

describe('cache', () => {
  let cache: Cache;

  beforeEach(async () => {
    const cacheManager = new CacheManager();
    await cacheManager.register('memory', 'memory');
    cache = cacheManager.create('test');
  });

  afterEach(async () => {
    await cache.reset();
  });

  it('should set and get value', async () => {
    await cache.set('key', 'value');
    const value = await cache.get('key');
    expect(value).toBe('value');
  });

  it('set and get value in object', async () => {
    const value = { a: 1 };
    await cache.set('key', value);
    const cacheA = await cache.getValueInObject('key', 'a');
    expect(cacheA).toEqual(1);

    await cache.setValueInObject('key', 'a', 2);
    const cacheVal2 = await cache.getValueInObject('key', 'a');
    expect(cacheVal2).toEqual(2);
  });
});
