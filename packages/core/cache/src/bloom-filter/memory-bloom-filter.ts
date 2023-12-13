import { BloomFilter as IBloomFilter } from '.';
import { Cache } from '../cache';
import { BloomFilter } from 'bloom-filters';

export class MemoryBloomFilter implements IBloomFilter {
  cache: Cache;
  constructor(cache: Cache) {
    this.cache = cache;
  }

  async reserve(key: string, errorRate: number, capacity: number) {
    const filter = BloomFilter.create(capacity, errorRate);
    await this.cache.set(key, filter);
  }

  async add(key: string, value: string) {
    const filter = (await this.cache.get(key)) as BloomFilter;
    if (!filter) {
      return;
    }
    filter.add(value);
  }

  async mAdd(key: string, values: string[]) {
    const filter = (await this.cache.get(key)) as BloomFilter;
    if (!filter) {
      return;
    }
    values.forEach((value) => filter.add(value));
  }

  async exists(key: string, value: string) {
    const filter = (await this.cache.get(key)) as BloomFilter;
    if (!filter) {
      return false;
    }
    return filter.has(value);
  }
}
