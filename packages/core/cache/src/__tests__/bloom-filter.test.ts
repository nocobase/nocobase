import { BloomFilter } from '../bloom-filter';
import { CacheManager } from '../cache-manager';

describe('bloomFilter', () => {
  let bloomFilter: BloomFilter;
  let cacheManager: CacheManager;

  beforeEach(async () => {
    cacheManager = new CacheManager();
    cacheManager.registerStore({ name: 'memory', store: 'memory' });
    bloomFilter = await cacheManager.createBloomFilter({ store: 'memory' });
    await bloomFilter.reserve('bloom-test', 0.01, 1000);
  });

  afterEach(async () => {
    await cacheManager.flushAll();
  });

  it('should add and check', async () => {
    await bloomFilter.add('bloom-test', 'hello');
    expect(await bloomFilter.exists('bloom-test', 'hello')).toBeTruthy();
    expect(await bloomFilter.exists('bloom-test', 'world')).toBeFalsy();
  });
});
