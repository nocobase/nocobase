/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { BaseRecordResource } from '../baseRecordResource';
import { ResourceError } from '../flowResource';

// 定义可实例化的最小子类
class TestRecordResource<T = any> extends BaseRecordResource<T> {
  async refresh(): Promise<void> {}
}

describe('BaseRecordResource - basic properties', () => {
  it('supportsFilter should be true', () => {
    const r = new TestRecordResource();
    expect(r.supportsFilter).toBe(true);
  });

  it('set/get resourceName & sourceId & dataSourceKey', () => {
    const r = new TestRecordResource();

    r.setResourceName('users');
    expect(r.getResourceName()).toBe('users');

    r.setSourceId(123);
    expect(r.getSourceId()).toBe(123);

    r.setDataSourceKey('ds1');
    expect(r.getDataSourceKey()).toBe('ds1');
  });
});

describe('BaseRecordResource - filters', () => {
  it('add/remove filter groups and resetFilter should update params.filter (JSON)', () => {
    const r = new TestRecordResource();

    // initially, no filter -> resetFilter leads to undefined value stored
    r.resetFilter();
    expect(r.getRequestParameter('filter')).toBeUndefined();

    // add groups
    r.addFilterGroup('g1', { status: { $eq: 'active' } });
    r.addFilterGroup('g2', { age: { $gt: 18 } });

    const filterStr = r.getRequestParameter('filter');
    expect(typeof filterStr === 'string' || filterStr === undefined).toBeTruthy();
    const parsed = JSON.parse(filterStr as string);
    expect(parsed).toEqual({ $and: [{ status: { $eq: 'active' } }, { age: { $gt: 18 } }] });

    // remove one group
    r.removeFilterGroup('g1');
    const filterStr2 = r.getRequestParameter('filter');
    const parsed2 = JSON.parse(filterStr2 as string);
    expect(parsed2).toEqual({ $and: [{ age: { $gt: 18 } }] });

    // remove last group -> filter becomes undefined
    r.removeFilterGroup('g2');
    expect(r.getRequestParameter('filter')).toBeUndefined();
  });

  it('setFilterByTk / getFilterByTk', () => {
    const r = new TestRecordResource();
    r.setFilterByTk(1);
    expect(r.getFilterByTk()).toBe(1);
  });
});

describe('BaseRecordResource - field and list params', () => {
  it('fields, sort, except, whitelist, blacklist support string or array with split', () => {
    const r = new TestRecordResource();

    r.setFields('id,name');
    expect(r.getFields()).toEqual(['id', 'name']);

    r.setSort(['-createdAt', 'name']);
    expect(r.getSort()).toEqual(['-createdAt', 'name']);

    r.setExcept('password,secret');
    expect(r.getExcept()).toEqual(['password', 'secret']);

    r.setWhitelist('id,name');
    expect(r.getWhitelist()).toEqual(['id', 'name']);

    r.setBlacklist(['secret', 'token']);
    expect(r.getBlacklist()).toEqual(['secret', 'token']);
  });
});

describe('BaseRecordResource - appends helpers', () => {
  it('setAppends / getAppends', () => {
    const r = new TestRecordResource();

    r.setAppends(['a', 'b']);
    expect(r.getAppends()).toEqual(['a', 'b']);
  });

  it('addAppends merges and dedups; removeAppends removes items', () => {
    const r = new TestRecordResource();

    r.addAppends('a,b');
    expect(r.getAppends()).toEqual(['a', 'b']);

    r.addAppends(['b', 'c']);
    expect(r.getAppends()).toEqual(['a', 'b', 'c']);

    r.removeAppends('b');
    expect(r.getAppends()).toEqual(['a', 'c']);

    r.removeAppends(['a', 'c']);
    expect(r.getAppends()).toEqual([]);
  });
});

describe('BaseRecordResource - runAction and URL building', () => {
  it('runAction builds URL from resourceName and action; merges configs', async () => {
    const r = new TestRecordResource<any>();
    const api = { request: vi.fn().mockResolvedValue({ data: { data: { ok: 1 }, meta: { total: 10 } } }) };
    r.setAPIClient(api as any);

    r.setResourceName('users');

    r.setDataSourceKey('dsA');
    r.setRunActionOptions('custom', { headers: { 'X-From-Option': 'A' }, timeout: 1000 });

    const result = await r.runAction('custom', { headers: { 'X-From-Option': 'B' }, params: { q: 1 } });

    expect(result).toEqual({ data: { ok: 1 }, meta: { total: 10 } });

    expect(api.request).toHaveBeenCalledTimes(1);
    const cfg = api.request.mock.calls[0][0];
    expect(cfg.method).toBe('post');
    expect(cfg.url).toBe('users:custom');
    expect(cfg.headers['X-From-Option']).toBe('B');
    expect(cfg.headers['X-Data-Source']).toBe('dsA');
    expect(cfg.timeout).toBe(1000);
    expect(cfg.params.q).toBe(1);
  });

  it('nested resourceName with sourceId builds parent/{id}/child:action', async () => {
    const r = new TestRecordResource<any>();
    const api = { request: vi.fn().mockResolvedValue({ data: { data: { ok: 1 } } }) };
    r.setAPIClient(api as any);

    r.setResourceName('users.tags').setSourceId(5);
    await r.runAction('list', {});

    const cfg = api.request.mock.calls[0][0];
    expect(cfg.url).toBe('users/5/tags:list');
  });

  it('when response has no "data" wrapper, returns raw response', async () => {
    const r = new TestRecordResource<any>();
    const api = { request: vi.fn().mockResolvedValue({ data: { ok: 1 } }) };
    r.setAPIClient(api as any);

    r.setResourceName('users');
    const ret = await r.runAction('ping', {});
    expect(ret).toEqual({ ok: 1 });
  });
});

describe('BaseRecordResource - updateAssociationValues', () => {
  it('getUpdateAssociationValues returns [] by default; addUpdateAssociationValues merges and dedups', () => {
    const r = new TestRecordResource();

    expect(r.getUpdateAssociationValues()).toEqual([]);

    r.addUpdateAssociationValues('roles,groups');
    expect(r.getUpdateAssociationValues()).toEqual(['roles', 'groups']);

    r.addUpdateAssociationValues(['groups', 'tags']);
    expect(r.getUpdateAssociationValues()).toEqual(['roles', 'groups', 'tags']);
  });

  it('create-like actions include updateAssociationValues in request params', async () => {
    const r = new TestRecordResource<any>();
    const api = { request: vi.fn().mockResolvedValue({ data: { data: {} } }) };
    r.setAPIClient(api as any);
    r.setResourceName('users');

    r.addUpdateAssociationValues(['roles', 'groups']);
    await r.runAction('create', { params: { q: 1 } });

    const cfg = api.request.mock.calls[0][0];
    expect(cfg.params).toMatchObject({ q: 1, updateAssociationValues: ['roles', 'groups'] });
  });
});

describe('BaseRecordResource - runAction error', () => {
  it('throws ResourceError on API failure', async () => {
    const r = new TestRecordResource<any>();
    const api = { request: vi.fn().mockRejectedValue({ response: { data: { error: { message: 'boom' } } } }) };
    r.setAPIClient(api as any).setResourceName('users');
    await expect(r.runAction('create', {})).rejects.toBeInstanceOf(ResourceError);
  });
});

describe('BaseRecordResource - mergeRequestConfig', () => {
  it('deep merges params; later overrides earlier for scalars', () => {
    const r = new TestRecordResource();

    const merged = r.mergeRequestConfig(
      { params: { a: 'a', x: 1, nested: { p: 1 } } },
      { params: { b: 'b', x: 2, nested: { q: 2 } } },
    );

    expect(merged.params).toEqual({ a: 'a', b: 'b', x: 2, nested: { p: 1, q: 2 } });
  });

  it('deep merges data; arrays are replaced by later config', () => {
    const r = new TestRecordResource();

    const merged = r.mergeRequestConfig(
      { data: { list: [1, 2], obj: { a: 1 } } as any },
      { data: { list: [3], obj: { b: 2 } } as any },
    );

    expect(merged.data).toEqual({ list: [3], obj: { a: 1, b: 2 } });
  });

  it('skips undefined values when merging params/data', () => {
    const r = new TestRecordResource();

    const merged = r.mergeRequestConfig(
      { params: { a: 1, b: 2 }, data: { x: 1, y: 2 } as any },
      { params: { a: undefined, c: 3 }, data: { x: undefined, z: 9 } as any },
    );

    expect(merged.params).toEqual({ a: 1, b: 2, c: 3 });
    expect(merged.data).toEqual({ x: 1, y: 2, z: 9 });
  });

  it('params.obj.nested should be replaced (not merged)', () => {
    const r = new TestRecordResource();

    const merged = r.mergeRequestConfig(
      { params: { obj: { nested: { a: 1 }, arr: [1, 2], keep: { x: 1 } } } },
      { params: { obj: { nested: { b: 2 } }, arr: [3, 4] } },
    );

    // nested 被后者整体覆盖，仅保留 { b: 2 }
    expect(merged.params.obj.nested).toEqual({ b: 2 });

    // 数组被后者替换
    expect(merged.params.arr).toEqual([3, 4]);

    // 其它键不受影响
    expect(merged.params.obj.keep).toEqual({ x: 1 });
  });
});
