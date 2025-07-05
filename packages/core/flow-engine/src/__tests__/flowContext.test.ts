/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowContext } from '../flowContext';

describe('FlowContext', () => {
  it('should return static value', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('foo', { value: 123 });
    expect(ctx.foo).toBe(123);
  });

  it('should return sync value from get', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('bar', { get: () => 456 });
    expect(ctx.bar).toBe(456);
  });

  it('should return async value from get', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('baz', { get: async () => 'hello' });
    expect(await ctx.baz).toBe('hello');
  });

  it('should support context reference in get', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('a', { get: () => 'a' });
    ctx.defineProperty('b', { get: (ctx) => ctx.a + 'b' });
    expect(ctx.b).toBe('ab');
  });

  it('should support async context reference', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('c', { get: async () => 'c' });
    ctx.defineProperty('d', { get: async (ctx) => (await ctx.c) + 'd' });
    expect(await ctx.d).toBe('cd');
  });

  it('should cache get result by default', async () => {
    const ctx = new FlowContext();
    const getter = vi.fn().mockResolvedValue(789);
    ctx.defineProperty('cached', { get: getter });

    await ctx.cached;
    await ctx.cached;
    expect(getter).toHaveBeenCalledTimes(1);
  });

  it('should disable cache when cache=false', async () => {
    const ctx = new FlowContext();
    const getter = vi.fn().mockResolvedValue(101112);
    ctx.defineProperty('noCache', { get: getter, cache: false });

    await ctx.noCache;
    await ctx.noCache;
    expect(getter).toHaveBeenCalledTimes(2);
  });

  it('should support delegate contexts', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('shared', { value: 'from delegate' });

    const ctx = new FlowContext();
    ctx.delegate(delegate);
    expect(ctx.shared).toBe('from delegate');
  });

  it('should throw error when get throws', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('error', {
      get: () => {
        throw new Error('Oops');
      },
    });
    expect(() => ctx.error).toThrow('Oops');
  });

  it('should throw error when async get throws', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('errorAsync', {
      get: async () => {
        throw new Error('Async Oops');
      },
    });
    await expect(ctx.errorAsync).rejects.toThrow('Async Oops');
  });

  it('should fallback to parent delegate chain', () => {
    const root = new FlowContext();
    root.defineProperty('deep', { value: 42 });

    const mid = new FlowContext();
    mid.delegate(root);

    const ctx = new FlowContext();
    ctx.delegate(mid);

    expect(ctx.deep).toBe(42);
  });

  it('should allow overriding delegate properties', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('foo', { value: 'delegate' });

    const ctx = new FlowContext();
    ctx.delegate(delegate);
    ctx.defineProperty('foo', { value: 'local' });

    expect(ctx.foo).toBe('local');
  });

  it('should handle accessing undefined properties', () => {
    const ctx = new FlowContext();
    expect(ctx.nonExistent).toBeUndefined();
  });

  it('should override previously defined property', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('dup', { value: 1 });
    ctx.defineProperty('dup', { value: 2 });

    expect(ctx.dup).toBe(2);
  });

  it('should return property meta tree for flat and nested meta', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('foo', {
      meta: { type: 'string', title: 'Foo' },
    });
    ctx.defineProperty('bar', {
      meta: {
        type: 'object',
        title: 'Bar',
        properties: {
          baz: { type: 'number', title: 'Baz' },
          qux: { type: 'string', title: 'Qux' },
        },
      },
    });
    const tree = ctx.getPropertyMetaTree();
    expect(tree).toEqual([
      {
        name: 'foo',
        title: 'Foo',
        type: 'string',
        interface: undefined,
        uiSchema: undefined,
        children: undefined,
      },
      {
        name: 'bar',
        title: 'Bar',
        type: 'object',
        interface: undefined,
        uiSchema: undefined,
        children: [
          {
            name: 'baz',
            title: 'Baz',
            type: 'number',
            interface: undefined,
            uiSchema: undefined,
            children: undefined,
          },
          {
            name: 'qux',
            title: 'Qux',
            type: 'string',
            interface: undefined,
            uiSchema: undefined,
            children: undefined,
          },
        ],
      },
    ]);
  });

  it('should merge meta from delegates and allow override', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('foo', {
      meta: { type: 'string', title: 'Delegate Foo', interface: 'text', uiSchema: { 'ui:widget': 'text' } },
    });
    delegate.defineProperty('bar', {
      meta: { type: 'number', title: 'Delegate Bar', interface: 'number', uiSchema: { 'ui:widget': 'number' } },
    });
    const ctx = new FlowContext();
    ctx.delegate(delegate);
    ctx.defineProperty('bar', {
      meta: {
        type: 'object',
        title: 'Local Bar',
        interface: 'object',
        uiSchema: { 'ui:widget': 'object' },
        properties: {
          x: { type: 'string', title: 'X', interface: 'text', uiSchema: { 'ui:widget': 'text' } },
        },
      },
    });
    const tree = ctx.getPropertyMetaTree();
    expect(tree).toEqual([
      {
        name: 'foo',
        title: 'Delegate Foo',
        type: 'string',
        interface: 'text',
        uiSchema: { 'ui:widget': 'text' },
      },
      {
        name: 'bar',
        title: 'Local Bar',
        type: 'object',
        interface: 'object',
        uiSchema: { 'ui:widget': 'object' },
        children: [
          {
            name: 'x',
            title: 'X',
            type: 'string',
            interface: 'text',
            uiSchema: { 'ui:widget': 'text' },
          },
        ],
      },
    ]);
  });
  it('should define and call method on context', () => {
    const ctx = new FlowContext();
    ctx.defineMethod('hello', function (name: string) {
      return `Hello, ${name}!`;
    });
    expect(ctx.hello('World')).toBe('Hello, World!');
  });

  it('should support delegate method lookup and binding', () => {
    const delegate = new FlowContext();
    delegate.defineMethod('add', function (a: number, b: number) {
      // this 指向 delegate
      return a + b + (this.extra || 0);
    });
    delegate.extra = 10;

    const ctx = new FlowContext();
    ctx.delegate(delegate);

    expect(ctx.add(1, 2)).toBe(13); // 1 + 2 + 10
    // 确认 this 绑定到 delegate
    delegate.extra = 100;
    expect(ctx.add(1, 2)).toBe(103);
  });

  it('should allow overriding delegate methods with local defineMethod', () => {
    const delegate = new FlowContext();
    delegate.defineMethod('greet', function (name: string) {
      return `Hello from delegate, ${name}`;
    });

    const ctx = new FlowContext();
    ctx.delegate(delegate);

    // 覆盖 delegate 的 greet 方法
    ctx.defineMethod('greet', function (name: string) {
      return `Hello from local, ${name}`;
    });

    expect(ctx.greet('Copilot')).toBe('Hello from local, Copilot');
    // delegate 仍然保持原方法
    expect(delegate.greet('Copilot')).toBe('Hello from delegate, Copilot');
  });
});
