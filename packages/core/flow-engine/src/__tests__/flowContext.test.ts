/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, ForkFlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { FlowContext } from '../flowContext';

describe('FlowContext properties and methods', () => {
  it('should return static property value', () => {
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

  it('should support async context reference in get', async () => {
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

  it('should not cache get result when cache=false', async () => {
    const ctx = new FlowContext();
    const getter = vi.fn().mockResolvedValue(101112);
    ctx.defineProperty('noCache', { get: getter, cache: false });

    await ctx.noCache;
    await ctx.noCache;
    expect(getter).toHaveBeenCalledTimes(2);
  });

  it('should support delegate context property', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('shared', { value: 'from delegate' });

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);
    expect(ctx.shared).toBe('from delegate');
  });

  it('should throw sync error in get', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('error', {
      get: () => {
        throw new Error('Oops');
      },
    });
    expect(() => ctx.error).toThrow('Oops');
  });

  it('should throw async error in get', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('errorAsync', {
      get: async () => {
        throw new Error('Async Oops');
      },
    });
    await expect(ctx.errorAsync).rejects.toThrow('Async Oops');
  });

  it('should find property in multi-level delegate chain', () => {
    const root = new FlowContext();
    root.defineProperty('deep', { value: 42 });

    const mid = new FlowContext();
    mid.addDelegate(root);

    const ctx = new FlowContext();
    ctx.addDelegate(mid);

    expect(ctx.deep).toBe(42);
  });

  it('should allow local property to override delegate property', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('foo', { value: 'delegate' });

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);
    ctx.defineProperty('foo', { value: 'local' });

    expect(ctx.foo).toBe('local');
  });

  it('should return undefined for undefined property', () => {
    const ctx = new FlowContext();
    expect(ctx.nonExistent).toBeUndefined();
  });

  it('should override property when redefined', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('dup', { value: 1 });
    ctx.defineProperty('dup', { value: 2 });

    expect(ctx.dup).toBe(2);
  });

  it('should support flat and nested meta in getPropertyMetaTree', () => {
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

  it('should support delegate meta and local override in getPropertyMetaTree', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('foo', {
      meta: { type: 'string', title: 'Delegate Foo', interface: 'text', uiSchema: { 'ui:widget': 'text' } },
    });
    delegate.defineProperty('bar', {
      meta: { type: 'number', title: 'Delegate Bar', interface: 'number', uiSchema: { 'ui:widget': 'number' } },
    });
    const ctx = new FlowContext();
    ctx.addDelegate(delegate);
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
  it('should define and call instance method with defineMethod', () => {
    const ctx = new FlowContext();
    ctx.defineMethod('hello', function (name: string) {
      return `Hello, ${name}!`;
    });
    expect(ctx.hello('World')).toBe('Hello, World!');
  });

  it('should support method lookup and this binding in delegate chain', () => {
    const delegate = new FlowContext();
    delegate.defineMethod('add', function (a: number, b: number) {
      // this 指向 delegate
      return a + b + (this.extra || 0);
    });
    delegate.extra = 10;

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);

    expect(ctx.add(1, 2)).toBe(13); // 1 + 2 + 10
    // 确认 this 绑定到 delegate
    delegate.extra = 100;
    expect(ctx.add(1, 2)).toBe(103);
  });

  it('should allow local defineMethod to override delegate method', () => {
    const delegate = new FlowContext();
    delegate.defineMethod('greet', function (name: string) {
      return `Hello from delegate, ${name}`;
    });

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);

    // 覆盖 delegate 的 greet 方法
    ctx.defineMethod('greet', function (name: string) {
      return `Hello from local, ${name}`;
    });

    expect(ctx.greet('Copilot')).toBe('Hello from local, Copilot');
    // delegate 仍然保持原方法
    expect(delegate.greet('Copilot')).toBe('Hello from delegate, Copilot');
  });

  it('should support addDelegate and removeDelegate for multiple delegates', () => {
    const d1 = new FlowContext();
    d1.defineProperty('foo', { value: 'from d1' });

    const d2 = new FlowContext();
    d2.defineProperty('bar', { value: 'from d2' });

    const ctx = new FlowContext();
    ctx.addDelegate(d1);
    ctx.addDelegate(d2);

    // 能查到 d1 和 d2 的属性
    expect(ctx.foo).toBe('from d1');
    expect(ctx.bar).toBe('from d2');

    // 移除 d1 后，foo 查不到
    ctx.removeDelegate(d1);
    expect(ctx.foo).toBeUndefined();
    expect(ctx.bar).toBe('from d2');

    // 移除 d2 后，bar 也查不到
    ctx.removeDelegate(d2);
    expect(ctx.bar).toBeUndefined();
  });

  it('should respect delegate priority: later addDelegate has higher priority', () => {
    const d1 = new FlowContext();
    d1.defineProperty('foo', { value: 'from d1' });

    const d2 = new FlowContext();
    d2.defineProperty('foo', { value: 'from d2' });

    const ctx = new FlowContext();
    ctx.addDelegate(d1);
    ctx.addDelegate(d2);

    // d2 优先
    expect(ctx.foo).toBe('from d2');

    // 移除 d2 后，d1 生效
    ctx.removeDelegate(d2);
    expect(ctx.foo).toBe('from d1');

    // 再移除 d1，查不到
    ctx.removeDelegate(d1);
    expect(ctx.foo).toBeUndefined();

    // 重新添加 d2，再添加 d1，d1 优先
    ctx.addDelegate(d2);
    ctx.addDelegate(d1);
    expect(ctx.foo).toBe('from d1');
  });
});

describe('FlowEngine context', () => {
  it('should support defineProperty on FlowEngine.context', () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('appName', { value: 'NocoBase' });
    expect(engine.context.appName).toBe('NocoBase');
  });
});

describe('ForkFlowModel context inheritance and isolation', () => {
  let engine: FlowEngine;
  class TestModel extends FlowModel {}

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ TestModel });
    engine.context.defineProperty('appName', { value: 'NocoBase' });
  });

  it('should inherit engine.context property in FlowModel.context', () => {
    const model = engine.createModel({ use: 'TestModel' });
    expect(model.context.appName).toBe('NocoBase');
  });

  it('should inherit model.context property in ForkFlowModel.context', () => {
    const model = engine.createModel({ use: 'TestModel' });
    const fork = model.createFork();
    expect(fork.context.appName).toBe('NocoBase');
  });

  it('should inherit latest value after model.context property changes in fork.context', () => {
    const model = engine.createModel({ use: 'TestModel' });
    model.context.defineProperty('appName', { value: 'NocoBase2' });
    const fork = model.createFork();
    expect(fork.context.appName).toBe('NocoBase2');
  });

  it('should not affect model.context when fork.context property changes', () => {
    const model = engine.createModel({ use: 'TestModel' });
    model.context.defineProperty('appName', { value: 'NocoBase2' });
    const fork = model.createFork();
    fork.context.defineProperty('appName', { value: 'NocoBase3' });
    expect(fork.context.appName).toBe('NocoBase3');
  });

  it('should isolate fork.context property changes from subModel.context when subModel delegates to parent', () => {
    const model = engine.createModel({
      use: 'TestModel',
      subModels: {
        sub: { uid: 'sub1', use: 'TestModel' },
      },
    });
    model.context.defineProperty('appName', { value: 'NocoBase2' });
    const sub = engine.getModel<TestModel>('sub1');
    expect(sub.context.appName).toBe('NocoBase2');
    sub.context.defineProperty('appName', { value: 'NocoBase3' });
    const fork = sub.createFork();
    expect(fork.context.appName).toBe('NocoBase3');
    fork.context.defineProperty('appName', { value: 'NocoBase4' });
    expect(fork.context.appName).toBe('NocoBase4');
  });

  it('should not inherit parent context property when subModel disables delegateToParent', () => {
    const model = engine.createModel({
      use: 'TestModel',
      subModels: {
        sub: { uid: 'sub1', use: 'TestModel', delegateToParent: false },
      },
    });
    model.context.defineProperty('appName', { value: 'NocoBase2' });
    const sub = engine.getModel<TestModel>('sub1');
    expect(sub.context.appName).toBe('NocoBase');
  });
});
