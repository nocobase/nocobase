/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '../cache';
import { CacheManager } from '../cache-manager';
import lodash from 'lodash';

describe('cache', () => {
  let cache: Cache;

  beforeEach(async () => {
    const cacheManager = new CacheManager();
    cacheManager.registerStore({ name: 'memory', store: 'memory' });
    cache = await cacheManager.createCache({ name: 'test', store: 'memory' });
  });

  afterEach(async () => {
    await cache.reset();
  });

  it('should set and get value', async () => {
    await cache.set('key', 'value');
    const value = await cache.get('key');
    expect(value).toBe('value');
  });

  it('should del value', async () => {
    await cache.set('key', 'value');
    await cache.del('key');
    const value = await cache.get('key');
    expect(value).toBeUndefined();
  });

  it('should mset and mget values', async () => {
    await cache.mset([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);
    const values = await cache.mget('key1', 'key2');
    expect(values).toMatchObject(['value1', 'value2']);
  });

  it('should mdel values', async () => {
    await cache.mset([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);
    await cache.mdel('key1', 'key2');
    const values = await cache.mget('key1', 'key2');
    expect(values).toMatchObject([undefined, undefined]);
  });

  it('should get all keys', async () => {
    await cache.mset([
      [`key1`, 'value1'],
      [`key2`, 'value2'],
    ]);
    const keys = await cache.keys();
    expect(keys.length).toBe(2);
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });

  it('should set and get value in object', async () => {
    const value = { a: 1 };
    await cache.set('key', value);
    const cacheA = await cache.getValueInObject('key', 'a');
    expect(cacheA).toEqual(1);

    await cache.setValueInObject('key', 'a', 2);
    const cacheVal2 = await cache.getValueInObject('key', 'a');
    expect(cacheVal2).toEqual(2);
  });

  it('should del value in object', async () => {
    const value = { a: 1, b: 2 };
    await cache.set('key', value);
    await cache.delValueInObject('key', 'a');
    const cacheA = await cache.getValueInObject('key', 'a');
    expect(cacheA).toBeUndefined();
    const cacheB = await cache.getValueInObject('key', 'b');
    expect(cacheB).toEqual(2);
  });

  it('wrap with condition, useCache', async () => {
    const obj = {};
    const get = () => obj;
    const val = await cache.wrapWithCondition('key', get, {
      useCache: false,
    });
    expect(val).toBe(obj);
    expect(await cache.get('key')).toBeUndefined();
    const val2 = await cache.wrapWithCondition('key', get);
    expect(val2).toBe(obj);
    expect(await cache.get('key')).toMatchObject(obj);
  });

  it('wrap with condition, isCacheable', async () => {
    let obj = {};
    const get = () => obj;
    const isCacheable = (val: any) => !lodash.isEmpty(val);
    const val = await cache.wrapWithCondition('key', get, {
      isCacheable,
    });
    expect(val).toBe(obj);
    expect(await cache.get('key')).toBeUndefined();
    obj = { a: 1 };
    const val2 = await cache.wrapWithCondition('key', get, {
      isCacheable,
    });
    expect(val2).toBe(obj);
    expect(await cache.get('key')).toMatchObject(obj);
  });

  it('redis cache wrap null throw error', async () => {
    if (!process.env.CACHE_REDIS_URL) {
      return;
    }
    const cacheManager = new CacheManager({
      stores: {
        redis: {
          url: process.env.CACHE_REDIS_URL,
        },
      },
    });
    const c = await cacheManager.createCache({ name: 'test', store: 'redis' });
    expect(async () => c.wrap('test', async () => null)).rejects.toThrowError('"null" is not a cacheable value');
  });
});
