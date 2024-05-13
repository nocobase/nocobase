/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BloomFilter as IBloomFilter } from '.';
import { Cache } from '../cache';
import { BloomFilter } from 'bloom-filters';

/**
 * @experimental
 */
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
