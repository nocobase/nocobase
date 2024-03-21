import { Cache as BasicCache, Milliseconds } from 'cache-manager';

export class Cache {
  name: string;
  prefix?: string;
  store: BasicCache;

  constructor({ name, prefix, store }: { name: string; store: BasicCache; prefix?: string }) {
    this.name = name;
    this.prefix = prefix;
    this.store = store;
  }

  key(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  async set(key: string, value: unknown, ttl?: Milliseconds): Promise<void> {
    await this.store.set(this.key(key), value, ttl);
  }

  async get<T>(key: string): Promise<T> {
    return await this.store.get(this.key(key));
  }

  async del(key: string): Promise<void> {
    await this.store.del(this.key(key));
  }

  async reset(): Promise<void> {
    await this.store.reset();
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: Milliseconds): Promise<T> {
    return await this.store.wrap(this.key(key), fn, ttl);
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
    await this.store.store.mset(
      args.map(([key, value]) => [this.key(key), value]),
      ttl,
    );
  }

  async mget(...args: string[]): Promise<unknown[]> {
    args = args.map((key) => this.key(key));
    return await this.store.store.mget(...args);
  }

  async mdel(...args: string[]): Promise<void> {
    args = args.map((key) => this.key(key));
    await this.store.store.mdel(...args);
  }

  async keys(pattern?: string): Promise<string[]> {
    const keys = await this.store.store.keys(pattern);
    return keys.map((key) => key.replace(`${this.name}:`, ''));
  }

  async ttl(key: string): Promise<number> {
    return await this.store.store.ttl(this.key(key));
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

  async delValueInObject(key: string, objectKey: string) {
    const object = (await this.get(key)) || {};
    delete object[objectKey];
    await this.set(key, object);
  }
}
