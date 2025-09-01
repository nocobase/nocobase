/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { ServerBaseContext, GlobalContext, HttpRequestContext } from '../template/contexts';

describe('ServerBaseContext', () => {
  it('defineProperty: value', () => {
    const ctx = new ServerBaseContext();
    (ctx as any).defineProperty('foo', { value: 123 });
    expect((ctx as any).foo).toBe(123);
    expect('foo' in (ctx as any)).toBe(true);
    expect('bar' in (ctx as any)).toBe(false);
  });

  it('defineProperty: getter with cache (default) caches value', () => {
    const ctx = new ServerBaseContext();
    let n = 0;
    (ctx as any).defineProperty('num', { get: () => ++n });
    expect((ctx as any).num).toBe(1);
    expect((ctx as any).num).toBe(1);
  });

  it('defineProperty: getter with cache=false recomputes', () => {
    const ctx = new ServerBaseContext();
    let n = 0;
    (ctx as any).defineProperty('num', { get: () => ++n, cache: false });
    expect((ctx as any).num).toBe(1);
    expect((ctx as any).num).toBe(2);
  });

  it('defineProperty: once keeps the first definition', () => {
    const ctx = new ServerBaseContext();
    (ctx as any).defineProperty('foo', { value: 1, once: true });
    (ctx as any).defineProperty('foo', { value: 2 });
    expect((ctx as any).foo).toBe(1);
  });

  it('defineMethod: accessible and bound', () => {
    const ctx = new ServerBaseContext();
    (ctx as any).defineMethod('add', function (a: number, b: number) {
      return a + b;
    });
    expect((ctx as any).add(2, 3)).toBe(5);
    expect('add' in (ctx as any)).toBe(true);
  });

  it('delegate: property lookup falls back to delegates', () => {
    const parent = new ServerBaseContext();
    (parent as any).defineProperty('foo', { value: 42 });
    const child = new ServerBaseContext();
    (child as any).delegate(parent as any);
    expect((child as any).foo).toBe(42);
    expect('foo' in (child as any)).toBe(true);
  });

  it('delegate: getter receives top-level proxy as ctx', () => {
    const parent = new ServerBaseContext();
    const child = new ServerBaseContext();
    (child as any).defineMethod('hello', () => 'ok');
    (parent as any).defineProperty('x', {
      get: (ctx: any) => ctx.hello(),
    });
    (child as any).delegate(parent as any);
    expect((child as any).x).toBe('ok');
  });

  it('delegate: must be ServerBaseContext instance', () => {
    const ctx = new ServerBaseContext();
    expect(() => (ctx as any).delegate({} as any)).toThrowError();
  });

  it('createProxy returns stable proxy instance', () => {
    const ctx = new ServerBaseContext();
    const p1 = (ctx as any).createProxy();
    const p2 = (ctx as any).createProxy();
    expect(p1).toBe(p2);
  });
});

describe('GlobalContext', () => {
  it('filters env and exposes now/timestamp/date', () => {
    const env = {
      PUBLIC_FOO: 'x',
      NEXT_PUBLIC_BAR: 'y',
      NCB_PUBLIC_Z: 'z',
      SECRET_TOKEN: 'hidden',
    } as any;
    const g = new GlobalContext(env) as any;
    expect(g.env).toEqual({ PUBLIC_FOO: 'x', NEXT_PUBLIC_BAR: 'y', NCB_PUBLIC_Z: 'z' });
    expect(typeof g.timestamp).toBe('number');
    expect(typeof g.now).toBe('string');
    // date variables: shape exists, with at least today and dayBeforeYesterday
    expect(typeof g.date).toBe('object');
    expect('today' in g.date).toBe(true);
    expect('dayBeforeYesterday' in g.date).toBe(true);
  });
});

describe('HttpRequestContext', () => {
  it('maps koa-like request/auth info to context properties', async () => {
    const koa: any = {
      auth: { user: { id: 1, name: 'Alice' }, role: 'root' },
      getCurrentLocale: () => 'en-US',
      state: { clientIp: '1.2.3.4' },
      headers: { 'x-req-id': 'abc' },
      request: { ip: '5.6.7.8', query: { a: 1 } },
      action: { params: { foo: 'bar' } },
    };
    const r = new HttpRequestContext(koa) as any;
    // user (cached), role, locale, ip, headers, query, params
    const user1 = await r.user;
    const user2 = await r.user;
    expect(user1).toEqual({ id: 1, name: 'Alice' });
    expect(user2).toEqual({ id: 1, name: 'Alice' });
    expect(r.roleName).toBe('root');
    expect(r.locale).toBe('en-US');
    expect(r.ip).toBe('1.2.3.4');
    expect(r.headers).toEqual({ 'x-req-id': 'abc' });
    expect(r.query).toEqual({ a: 1 });
    expect(r.params).toEqual({ foo: 'bar' });
  });
});
