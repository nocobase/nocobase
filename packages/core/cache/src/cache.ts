import { Cache as CacheType, Milliseconds } from 'cache-manager';

export class Cache {
  namespace: string;
  cache: CacheType;

  constructor({ namespace, cache }: { namespace: string; cache: CacheType }) {
    this.namespace = namespace;
    this.cache = cache;
  }

  async set(key: string, value: unknown, ttl?: Milliseconds): Promise<void> {
    await this.cache.set(`${this.namespace}:${key}`, value, ttl);
  }

  async get<T>(key: string): Promise<T> {
    return await this.cache.get(`${this.namespace}:${key}`);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(`${this.namespace}:${key}`);
  }

  async reset(): Promise<void> {
    await this.cache.reset();
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: Milliseconds): Promise<T> {
    return await this.cache.wrap(`${this.namespace}:${key}`, fn, ttl);
  }

  async wrapWithCondition<T>(
    key: string,
    fn: () => T | Promise<T>,
    options?: {
      useCache?: boolean;
      isCacheable?: (val: unknown) => boolean | Promise<boolean>;
      ttl?: Milliseconds;
    },
  ): Promise<T> {
    const { useCache, isCacheable, ttl } = options || {};
    if (useCache === false) {
      return await fn();
    }
    const value = await this.get<T>(key);
    if (value) {
      return value;
    }
    const result = await fn();
    const cacheable = isCacheable ? await isCacheable(result) : result;
    if (!cacheable) {
      return result;
    }
    await this.set(key, result, ttl);
    return result;
  }

  async mset(args: [string, unknown][], ttl?: Milliseconds): Promise<void> {
    await this.cache.store.mset(
      args.map(([key, value]) => [`${this.namespace}:${key}`, value]),
      ttl,
    );
  }

  async mget(...args: string[]): Promise<unknown[]> {
    args = args.map((key) => `${this.namespace}:${key}`);
    return await this.cache.store.mget(...args);
  }

  async mdel(...args: string[]): Promise<void> {
    args = args.map((key) => `${this.namespace}:${key}`);
    await this.cache.store.mdel(...args);
  }

  async keys(pattern?: string): Promise<string[]> {
    const keys = await this.cache.store.keys(pattern);
    return keys.map((key) => key.replace(`${this.namespace}:`, ''));
  }

  async ttl(key: string): Promise<number> {
    return await this.cache.store.ttl(`${this.namespace}:${key}`);
  }

  async setValueInObject(key: string, objectKey: string, value: unknown) {
    const object = (await this.get(key)) || {};
    object[objectKey] = value;
    await this.set(key, object);
  }

  async getValueInObject(key: string, objectKey: string) {
    const object = (await this.get(key)) || {};
    return object[objectKey];
  }
}
