import { RedisStore } from 'cache-manager-redis-yet';
import { BloomFilter } from '.';
import { Cache } from '../cache';

export class RedisBloomFilter implements BloomFilter {
  cache: Cache;
  constructor(cache: Cache) {
    this.cache = cache;
  }

  getStore() {
    return this.cache.store.store as RedisStore;
  }

  async reserve(key: string, errorRate: number, capacity: number) {
    const store = this.getStore();
    await store.client.bf.reserve(key, errorRate, capacity);
  }

  async add(key: string, value: string) {
    const store = this.getStore();
    await store.client.bf.add(key, value);
  }

  async mAdd(key: string, values: string[]) {
    const store = this.getStore();
    await store.client.bf.mAdd(key, values);
  }

  async exists(key: string, value: string) {
    const store = this.getStore();
    return await store.client.bf.exists(key, value);
  }
}
