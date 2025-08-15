/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
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

  it('should support context reference in get', () => {
    const ctx1 = new FlowContext();
    ctx1.defineProperty('a', { get: () => 'a' });
    const ctx = new FlowContext();
    ctx.addDelegate(ctx1);
    ctx.defineProperty('b', { get: () => ctx.a + 'b' });
    expect(ctx.b).toBe('ab');
  });

  it('should pass correct context instance to getter function in delegate chain', () => {
    class FlowContext1 extends FlowContext {}
    class FlowContext2 extends FlowContext {}
    const ctx1 = new FlowContext1();
    ctx1.defineProperty('a', { cache: false, get: (ctx) => ctx });
    const ctx2 = new FlowContext2();
    ctx2.addDelegate(ctx1);
    expect(ctx1.a).toBe(ctx1);
    expect(ctx2.a).toBe(ctx2);
  });

  it('should support async context reference in get', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('c', { get: async () => 'c' });
    ctx.defineProperty('d', { get: async (ctx) => (await ctx.c) + 'd' });
    expect(await ctx.d).toBe('cd');
  });

  it('should queue and reuse promise for concurrent async get calls', async () => {
    const ctx = new FlowContext();
    const getter = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return 'async-value';
    });
    ctx.defineProperty('concurrent', { get: getter });

    // 并发调用
    const [v1, v2, v3] = await Promise.all([ctx.concurrent, ctx.concurrent, ctx.concurrent]);
    expect(v1).toBe('async-value');
    expect(v2).toBe('async-value');
    expect(v3).toBe('async-value');
    // 只会调用一次 getter
    expect(getter).toHaveBeenCalledTimes(1);

    // 再次调用，因已缓存，不会再调用 getter
    const v4 = await ctx.concurrent;
    expect(v4).toBe('async-value');
    expect(getter).toHaveBeenCalledTimes(1);
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

  it('should remove cache and pending for property', async () => {
    const ctx = new FlowContext();
    const getter = vi.fn().mockResolvedValue('cached-value');
    ctx.defineProperty('foo', { get: getter });

    // 首次获取，触发缓存
    await ctx.foo;
    expect(getter).toHaveBeenCalledTimes(1);

    // 再次获取，命中缓存
    await ctx.foo;
    expect(getter).toHaveBeenCalledTimes(1);

    // 清除缓存
    ctx.removeCache('foo');

    // 再次获取，应重新调用 getter
    await ctx.foo;
    expect(getter).toHaveBeenCalledTimes(2);
  });

  it('should remove cache and pending recursively in delegates', async () => {
    const delegate = new FlowContext();
    const getter = vi.fn().mockResolvedValue('delegate-value');
    delegate.defineProperty('bar', { get: getter });

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);

    // 首次获取，触发缓存
    await ctx.bar;
    expect(getter).toHaveBeenCalledTimes(1);

    // 清除缓存（应递归到 delegate）
    ctx.removeCache('bar');

    // 再次获取，应重新调用 getter
    await ctx.bar;
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
        paths: ['foo'],
        children: undefined,
      },
      {
        name: 'bar',
        title: 'Bar',
        type: 'object',
        interface: undefined,
        uiSchema: undefined,
        paths: ['bar'],
        children: [
          {
            name: 'baz',
            title: 'Baz',
            type: 'number',
            interface: undefined,
            uiSchema: undefined,
            paths: ['bar', 'baz'],
            parentTitles: ['Bar'],
            children: undefined,
          },
          {
            name: 'qux',
            title: 'Qux',
            type: 'string',
            interface: undefined,
            uiSchema: undefined,
            paths: ['bar', 'qux'],
            parentTitles: ['Bar'],
            children: undefined,
          },
        ],
      },
    ]);
  });

  it('should support delegate meta and local override in getPropertyMetaTree', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('foo', {
      meta: { type: 'string', title: 'Delegate Foo', interface: 'text', uiSchema: { type: 'text' } },
    });
    delegate.defineProperty('bar', {
      meta: { type: 'number', title: 'Delegate Bar', interface: 'number', uiSchema: { type: 'number' } },
    });
    const ctx = new FlowContext();
    ctx.addDelegate(delegate);
    ctx.defineProperty('bar', {
      meta: {
        type: 'object',
        title: 'Local Bar',
        interface: 'object',
        uiSchema: { type: 'object' },
        properties: {
          x: { type: 'string', title: 'X', interface: 'text', uiSchema: { type: 'text' } },
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
        uiSchema: { type: 'text' },
        paths: ['foo'],
        children: undefined,
      },
      {
        name: 'bar',
        title: 'Local Bar',
        type: 'object',
        interface: 'object',
        uiSchema: { type: 'object' },
        paths: ['bar'],
        children: [
          {
            name: 'x',
            title: 'X',
            type: 'string',
            interface: 'text',
            uiSchema: { type: 'text' },
            paths: ['bar', 'x'],
            parentTitles: ['Local Bar'],
            children: undefined,
          },
        ],
      },
    ]);
  });

  it('should support single-level mixed sync and async properties in getPropertyMetaTree', async () => {
    const ctx = new FlowContext();

    // 同步属性
    ctx.defineProperty('syncProp', {
      meta: {
        type: 'object',
        title: 'Sync Property',
        properties: {
          field1: { type: 'string', title: 'Field 1' },
          field2: { type: 'number', title: 'Field 2' },
        },
      },
    });

    // 异步属性
    ctx.defineProperty('asyncProp', {
      meta: {
        type: 'object',
        title: 'Async Property',
        properties: async () => {
          // 模拟异步加载
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            dynamicField1: { type: 'string', title: 'Dynamic Field 1' },
            dynamicField2: { type: 'boolean', title: 'Dynamic Field 2' },
          };
        },
      },
    });

    const tree = ctx.getPropertyMetaTree();

    // 检查同步属性
    expect(tree[0]).toEqual({
      name: 'syncProp',
      title: 'Sync Property',
      type: 'object',
      interface: undefined,
      uiSchema: undefined,
      paths: ['syncProp'],
      children: [
        {
          name: 'field1',
          title: 'Field 1',
          type: 'string',
          interface: undefined,
          uiSchema: undefined,
          paths: ['syncProp', 'field1'],
          parentTitles: ['Sync Property'],
          children: undefined,
        },
        {
          name: 'field2',
          title: 'Field 2',
          type: 'number',
          interface: undefined,
          uiSchema: undefined,
          paths: ['syncProp', 'field2'],
          parentTitles: ['Sync Property'],
          children: undefined,
        },
      ],
    });

    // 检查异步属性
    expect(tree[1].name).toBe('asyncProp');
    expect(tree[1].title).toBe('Async Property');
    expect(typeof tree[1].children).toBe('function');

    // 调用异步函数获取子节点
    const asyncChildren = await (tree[1].children as () => Promise<any>)();
    expect(asyncChildren).toEqual([
      {
        name: 'dynamicField1',
        title: 'Dynamic Field 1',
        type: 'string',
        interface: undefined,
        uiSchema: undefined,
        paths: ['asyncProp', 'dynamicField1'],
        parentTitles: ['Async Property'],
        children: undefined,
      },
      {
        name: 'dynamicField2',
        title: 'Dynamic Field 2',
        type: 'boolean',
        interface: undefined,
        uiSchema: undefined,
        paths: ['asyncProp', 'dynamicField2'],
        parentTitles: ['Async Property'],
        children: undefined,
      },
    ]);
  });

  it('should support multi-level mixed sync and async properties in getPropertyMetaTree', async () => {
    const ctx = new FlowContext();

    ctx.defineProperty('complexProp', {
      meta: {
        type: 'object',
        title: 'Complex Property',
        properties: {
          // 第一层：同步属性包含异步子属性
          syncWithAsync: {
            type: 'object',
            title: 'Sync with Async',
            properties: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return {
                asyncChild: { type: 'string', title: 'Async Child' },
                syncChild: {
                  type: 'object',
                  title: 'Sync Child',
                  properties: {
                    deepField: { type: 'number', title: 'Deep Field' },
                  },
                },
              };
            },
          },
          // 第一层：异步属性包含同步和异步子属性
          asyncWithMixed: {
            type: 'object',
            title: 'Async with Mixed',
            properties: async () => {
              await new Promise((resolve) => setTimeout(resolve, 15));
              return {
                syncChild: {
                  type: 'string',
                  title: 'Sync Child in Async',
                  properties: {
                    deepSync: { type: 'boolean', title: 'Deep Sync' },
                  },
                },
                asyncChild: {
                  type: 'object',
                  title: 'Async Child in Async',
                  properties: async () => {
                    await new Promise((resolve) => setTimeout(resolve, 5));
                    return {
                      veryDeep: { type: 'string', title: 'Very Deep Field' },
                    };
                  },
                },
              };
            },
          },
        },
      },
    });

    const tree = ctx.getPropertyMetaTree();
    const complexNode = tree[0];

    expect(complexNode.name).toBe('complexProp');
    expect(complexNode.title).toBe('Complex Property');
    expect(Array.isArray(complexNode.children)).toBe(true);

    const children = complexNode.children as any[];
    expect(children).toHaveLength(2);

    // 检查第一个子节点（同步属性包含异步子属性）
    const syncWithAsyncNode = children[0];
    expect(syncWithAsyncNode.name).toBe('syncWithAsync');
    expect(typeof syncWithAsyncNode.children).toBe('function');

    const syncWithAsyncChildren = await syncWithAsyncNode.children();
    expect(syncWithAsyncChildren).toHaveLength(2);
    expect(syncWithAsyncChildren[0].name).toBe('asyncChild');
    expect(syncWithAsyncChildren[1].name).toBe('syncChild');
    expect(Array.isArray(syncWithAsyncChildren[1].children)).toBe(true);

    // 检查第二个子节点（异步属性包含混合子属性）
    const asyncWithMixedNode = children[1];
    expect(asyncWithMixedNode.name).toBe('asyncWithMixed');
    expect(typeof asyncWithMixedNode.children).toBe('function');

    const asyncWithMixedChildren = await asyncWithMixedNode.children();
    expect(asyncWithMixedChildren).toHaveLength(2);

    // 检查同步子节点
    const syncChildInAsync = asyncWithMixedChildren[0];
    expect(syncChildInAsync.name).toBe('syncChild');
    expect(Array.isArray(syncChildInAsync.children)).toBe(true);

    // 检查异步子节点
    const asyncChildInAsync = asyncWithMixedChildren[1];
    expect(asyncChildInAsync.name).toBe('asyncChild');
    expect(typeof asyncChildInAsync.children).toBe('function');

    const veryDeepChildren = await asyncChildInAsync.children();
    expect(veryDeepChildren).toHaveLength(1);
    expect(veryDeepChildren[0].name).toBe('veryDeep');
    expect(veryDeepChildren[0].title).toBe('Very Deep Field');
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
    delegate.extra = 1;
    expect(delegate.add(1, 2)).toBe(4);

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);
    ctx.extra = 10;

    expect(ctx.add(1, 2)).toBe(13);
    // 确认 this 绑定到 delegate
    ctx.extra = 100;
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

  it('should define and call method that uses property', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('foo', { value: 10 });
    ctx.defineMethod('getFooPlus', function (n: number) {
      return this.foo + n;
    });
    expect(ctx.getFooPlus(5)).toBe(15);
  });

  it('should call delegate method and access delegate property', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('bar', { value: 20 });
    delegate.defineMethod('getBarDouble', function () {
      return this.bar * 2;
    });

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);

    expect(ctx.getBarDouble()).toBe(40);
  });

  it('should allow local method to access local and delegate properties', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('bar', { value: 7 });

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);
    ctx.defineProperty('foo', { value: 3 });
    ctx.defineMethod('sumFooBar', function () {
      return ctx.foo + ctx.bar;
    });

    expect(ctx.sumFooBar()).toBe(10);
  });

  it('should override delegate method and still access delegate property', () => {
    const delegate = new FlowContext();
    delegate.defineProperty('bar', { value: 100 });
    delegate.defineMethod('getBar', function () {
      return this.bar;
    });

    const ctx = new FlowContext();
    ctx.addDelegate(delegate);
    ctx.defineMethod('getBar', function () {
      // 访问 delegate 的属性
      return ctx.bar + 1;
    });

    expect(ctx.getBar()).toBe(101);
  });

  it('should support multi-level delegate method and property lookup', () => {
    const root = new FlowContext();
    root.defineProperty('num', { value: 5 });
    root.defineMethod('getNum', function () {
      return this.num;
    });

    const mid = new FlowContext();
    mid.addDelegate(root);

    const ctx = new FlowContext();
    ctx.addDelegate(mid);

    expect(ctx.getNum()).toBe(5);
  });

  it('should support multi-level delegate method and property lookup', () => {
    const root = new FlowContext();
    root.defineMethod('getSelf', function () {
      return this;
    });

    const mid = new FlowContext();
    mid.addDelegate(root);

    const ctx = new FlowContext();
    ctx.addDelegate(mid);

    expect(root.getSelf()).toBe(root);
    expect(mid.getSelf()).toBe(mid);
    expect(ctx.getSelf()).toBe(ctx);
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

  it('should isolate context property changes between different forks', () => {
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
    const fork2 = sub.createFork();
    expect(fork.context.appName).toBe('NocoBase3');
    expect(fork2.context.appName).toBe('NocoBase3');
    fork.context.defineProperty('appName', { value: 'NocoBase4' });
    fork2.context.defineProperty('appName', { value: 'NocoBase5' });
    expect(fork.context.appName).toBe('NocoBase4');
    expect(fork2.context.appName).toBe('NocoBase5');
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

  it('should only define property once when once: true', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('foo', { value: 1, once: true });
    ctx.defineProperty('foo', { value: 2 });
    expect(ctx.foo).toBe(1);
  });
});

describe('FlowContext delayed meta loading', () => {
  // 测试场景：属性定义时 meta 为异步函数，首次访问时延迟加载
  // 输入：属性带有异步 meta 函数
  // 期望：getPropertyMetaTree() 同步返回，节点包含异步 children 函数
  it('should create lazy-loaded meta tree node with async meta function', async () => {
    const ctx = new FlowContext();

    // 模拟延迟加载的 meta（如 collection 不可用时的情况）
    const delayedMeta = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        type: 'object',
        title: 'Delayed User',
        properties: {
          id: { type: 'number', title: 'User ID' },
          name: { type: 'string', title: 'Username' },
        },
      };
    });

    ctx.defineProperty('userAsync', {
      meta: delayedMeta,
    });

    // 同步获取 meta tree
    const tree = ctx.getPropertyMetaTree();

    expect(tree).toHaveLength(1);
    const userNode = tree[0];

    // 验证延迟加载节点的默认属性
    expect(userNode.name).toBe('userAsync');
    expect(userNode.title).toBe('userAsync'); // 默认使用 name
    expect(userNode.type).toBe('object'); // 默认类型
    expect(typeof userNode.children).toBe('function'); // 异步加载函数

    // 此时还未调用 meta 函数
    expect(delayedMeta).not.toHaveBeenCalled();

    // 首次访问 children 时才调用 meta 函数
    const children = await (userNode.children as () => Promise<any>)();
    expect(delayedMeta).toHaveBeenCalledTimes(1);

    // 验证加载后的子节点
    expect(children).toHaveLength(2);
    expect(children[0]).toEqual({
      name: 'id',
      title: 'User ID',
      type: 'number',
      interface: undefined,
      uiSchema: undefined,
      paths: ['userAsync', 'id'],
      parentTitles: ['Delayed User'],
      children: undefined,
    });
    expect(children[1]).toEqual({
      name: 'name',
      title: 'Username',
      type: 'string',
      interface: undefined,
      uiSchema: undefined,
      paths: ['userAsync', 'name'],
      parentTitles: ['Delayed User'],
      children: undefined,
    });
  });

  // 测试场景：异步 meta 函数抛出异常时的错误处理
  // 输入：meta 函数抛出错误（如网络异常）
  // 期望：children 函数返回空数组，记录警告但不中断程序
  it('should handle async meta function errors gracefully', async () => {
    const ctx = new FlowContext();

    const failingMeta = vi.fn(async () => {
      throw new Error('Collection load failed');
    });
    ctx.defineProperty('errorProp', { meta: failingMeta });

    const tree = ctx.getPropertyMetaTree();
    const node = tree[0];

    // 模拟 console.warn 以验证错误处理
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const children = await (node.children as () => Promise<any>)();
    expect(children).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load meta for errorProp:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  // 测试场景：异步 meta 包含嵌套异步 properties 的深度延迟加载
  // 输入：异步 meta 返回的 properties 本身也是异步函数
  // 期望：支持多层异步嵌套加载，每层按需加载
  it('should support nested async properties in delayed meta loading', async () => {
    const ctx = new FlowContext();

    ctx.defineProperty('deepAsync', {
      meta: async () => ({
        type: 'object',
        title: 'Deep Async Root',
        properties: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return {
            level1: {
              type: 'object',
              title: 'Level 1',
              properties: {
                level2Field: { type: 'string', title: 'Level 2 Field' },
              },
            },
          };
        },
      }),
    });

    const tree = ctx.getPropertyMetaTree();
    const rootNode = tree[0];

    // 第一层异步加载
    const level1Children = await (rootNode.children as () => Promise<any>)();
    expect(level1Children).toHaveLength(1);

    const level1Node = level1Children[0];
    expect(level1Node.name).toBe('level1');
    expect(level1Node.title).toBe('Level 1');
    expect(Array.isArray(level1Node.children)).toBe(true);

    // 第二层直接可用（同步 properties）
    const level2Children = level1Node.children as any[];
    expect(level2Children).toHaveLength(1);
    expect(level2Children[0].name).toBe('level2Field');
    expect(level2Children[0].title).toBe('Level 2 Field');
  });
});

describe('FlowContext getPropertyMetaTree with value parameter', () => {
  it('should return full tree when no value parameter is provided', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('user', {
      meta: {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'number', title: 'User ID' },
          name: { type: 'string', title: 'Username' },
        },
      },
    });
    ctx.defineProperty('data', {
      meta: { type: 'string', title: 'Data' },
    });

    const tree = ctx.getPropertyMetaTree();
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe('user');
    expect(tree[1].name).toBe('data');
  });

  it('should return subtree for valid {{ ctx.propertyName }} format', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('user', {
      meta: {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'number', title: 'User ID' },
          name: { type: 'string', title: 'Username' },
        },
      },
    });
    ctx.defineProperty('data', {
      meta: { type: 'string', title: 'Data' },
    });

    const subTree = ctx.getPropertyMetaTree('{{ ctx.user }}');
    expect(subTree).toHaveLength(2);
    expect(subTree[0]).toEqual({
      name: 'id',
      title: 'User ID',
      type: 'number',
      interface: undefined,
      uiSchema: undefined,
      paths: ['user', 'id'],
      parentTitles: undefined,
      children: undefined,
    });
    expect(subTree[1]).toEqual({
      name: 'name',
      title: 'Username',
      type: 'string',
      interface: undefined,
      uiSchema: undefined,
      paths: ['user', 'name'],
      parentTitles: undefined,
      children: undefined,
    });
  });

  it('should handle spaces in {{ ctx.propertyName }} format', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('user', {
      meta: {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'number', title: 'User ID' },
        },
      },
    });

    const subTree1 = ctx.getPropertyMetaTree('{{ctx.user}}');
    const subTree2 = ctx.getPropertyMetaTree('{{ ctx.user }}');
    const subTree3 = ctx.getPropertyMetaTree('{{  ctx.user  }}');

    expect(subTree1).toHaveLength(1);
    expect(subTree2).toHaveLength(1);
    expect(subTree3).toHaveLength(1);
    expect(subTree1[0].name).toBe('id');
    expect(subTree2[0].name).toBe('id');
    expect(subTree3[0].name).toBe('id');
  });

  it('should return empty array for property without children', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('simple', {
      meta: { type: 'string', title: 'Simple' },
    });

    const subTree = ctx.getPropertyMetaTree('{{ ctx.simple }}');
    expect(subTree).toEqual([]);
  });

  it('should warn and return full tree for unsupported formats', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('user', {
      meta: {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'number', title: 'User ID' },
        },
      },
    });
    ctx.defineProperty('data', {
      meta: { type: 'string', title: 'Data' },
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Test various unsupported formats (should trigger warning)
    const invalidTestCases = ['user', 'ctx.user', '{{user}}', '{{ user }}', 'invalid format'];

    invalidTestCases.forEach((testCase) => {
      consoleSpy.mockClear();
      const result = ctx.getPropertyMetaTree(testCase);

      // Should return empty tree for invalid formats
      expect(result).toHaveLength(0);

      // Should log warning
      expect(consoleSpy).toHaveBeenCalledWith(
        `[FlowContext] getPropertyMetaTree - unsupported value format: "${testCase}". Only "{{ ctx.propertyName }}" format is supported. Returning empty meta tree.`,
      );
    });

    // Test valid root context formats (should NOT trigger warning)
    const validRootCases = ['{{ ctx }}', '{{ctx}}'];

    validRootCases.forEach((testCase) => {
      consoleSpy.mockClear();
      const result = ctx.getPropertyMetaTree(testCase);

      // Should return full tree (since {{ ctx }} means all properties)
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('user');
      expect(result[1].name).toBe('data');

      // Should NOT log warning for valid formats
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should return empty array when property is not found', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('user', {
      meta: { type: 'object', title: 'User' },
    });

    const result = ctx.getPropertyMetaTree('{{ ctx.nonExistent }}');
    expect(result).toEqual([]);
  });

  it('should support async meta with value parameter', async () => {
    const ctx = new FlowContext();
    ctx.defineProperty('asyncUser', {
      meta: async () => ({
        type: 'object',
        title: 'Async User',
        properties: {
          profile: {
            type: 'object',
            title: 'Profile',
            properties: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return {
                bio: { type: 'string', title: 'Biography' },
              };
            },
          },
        },
      }),
    });

    const subTree = ctx.getPropertyMetaTree('{{ ctx.asyncUser }}');
    const ensureArray = async (v: any) => (typeof v === 'function' ? await v() : v);
    const arr = await ensureArray(subTree);
    expect(arr).toHaveLength(1);
    expect(arr[0].name).toBe('profile');
    expect(typeof arr[0].children).toBe('function');

    const profileChildren = await (arr[0].children as () => Promise<any>)();
    expect(profileChildren).toHaveLength(1);
    expect(profileChildren[0].name).toBe('bio');
    expect(profileChildren[0].title).toBe('Biography');
  });

  it('should handle async meta errors with value parameter', async () => {
    const ctx = new FlowContext();
    const failingMeta = vi.fn(async () => {
      throw new Error('Async meta failed');
    });

    ctx.defineProperty('errorProp', { meta: failingMeta });

    const subTree = ctx.getPropertyMetaTree('{{ ctx.errorProp }}');
    const ensureArray = async (v: any) => (typeof v === 'function' ? await v() : v);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const arr = await ensureArray(subTree);
    expect(arr).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load meta for errorProp:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should support multi-level path like {{ ctx.user.profile }}', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('user', {
      meta: {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'number', title: 'User ID' },
          profile: {
            type: 'object',
            title: 'User Profile',
            properties: {
              bio: { type: 'string', title: 'Biography' },
              avatar: { type: 'string', title: 'Avatar URL' },
            },
          },
        },
      },
    });

    // Test getting profile subtree
    const profileSubTree = ctx.getPropertyMetaTree('{{ ctx.user.profile }}');
    expect(profileSubTree).toHaveLength(2);
    expect(profileSubTree[0]).toEqual({
      name: 'bio',
      title: 'Biography',
      type: 'string',
      interface: undefined,
      uiSchema: undefined,
      paths: ['user', 'profile', 'bio'],
      parentTitles: ['User', 'User Profile'],
      children: undefined,
    });
    expect(profileSubTree[1]).toEqual({
      name: 'avatar',
      title: 'Avatar URL',
      type: 'string',
      interface: undefined,
      uiSchema: undefined,
      paths: ['user', 'profile', 'avatar'],
      parentTitles: ['User', 'User Profile'],
      children: undefined,
    });
  });

  it('should support deep multi-level path like {{ ctx.data.user.profile.settings }}', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('data', {
      meta: {
        type: 'object',
        title: 'Data',
        properties: {
          user: {
            type: 'object',
            title: 'User Data',
            properties: {
              profile: {
                type: 'object',
                title: 'Profile',
                properties: {
                  settings: {
                    type: 'object',
                    title: 'Settings',
                    properties: {
                      theme: { type: 'string', title: 'Theme' },
                      language: { type: 'string', title: 'Language' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const settingsSubTree = ctx.getPropertyMetaTree('{{ ctx.data.user.profile.settings }}');
    expect(settingsSubTree).toHaveLength(2);
    expect(settingsSubTree[0].name).toBe('theme');
    expect(settingsSubTree[0].title).toBe('Theme');
    expect(settingsSubTree[1].name).toBe('language');
    expect(settingsSubTree[1].title).toBe('Language');
  });

  it('should return empty array when multi-level path property does not exist', () => {
    const ctx = new FlowContext();
    ctx.defineProperty('user', {
      meta: {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'number', title: 'User ID' },
        },
      },
    });
    ctx.defineProperty('data', {
      meta: { type: 'string', title: 'Data' },
    });

    // Test path that doesn't exist
    const result = ctx.getPropertyMetaTree('{{ ctx.user.nonExistent }}');
    expect(result).toEqual([]); // Should return empty array for non-existent path
  });
});

describe('FlowContext getPropertyMetaTree with complex async/sync mixing scenarios', () => {
  it('should handle async meta factory with async properties', async () => {
    const ctx = new FlowContext();

    // 异步 meta factory 包含异步 properties
    ctx.defineProperty('complexUser', {
      meta: async () => ({
        type: 'object',
        title: 'Complex User',
        properties: async () => ({
          profile: {
            type: 'object',
            title: 'Profile',
            properties: {
              name: { type: 'string', title: 'Name' },
              age: { type: 'number', title: 'Age' },
            },
          },
          settings: {
            type: 'object',
            title: 'Settings',
            properties: {
              theme: { type: 'string', title: 'Theme' },
              notifications: { type: 'boolean', title: 'Notifications' },
            },
          },
        }),
      }),
    });

    // 新行为：根级返回 children 数组（profile、settings）
    const rootTree = ctx.getPropertyMetaTree('{{ ctx.complexUser }}');
    const ensureArray = async (v: any) => (typeof v === 'function' ? await v() : v);
    const arr = await ensureArray(rootTree);
    expect(arr).toHaveLength(2);
    expect(arr[0].name).toBe('profile');
    expect(arr[1].name).toBe('settings');
  });

  it('should handle async meta factory with mixed sync/async properties in deep path', async () => {
    const ctx = new FlowContext();

    // 复杂的嵌套场景
    ctx.defineProperty('enterprise', {
      meta: async () => ({
        type: 'object',
        title: 'Enterprise',
        properties: {
          // 同步 properties
          info: {
            type: 'object',
            title: 'Info',
            properties: async () => ({
              // 异步 properties 返回同步结构
              company: {
                type: 'object',
                title: 'Company',
                properties: {
                  name: { type: 'string', title: 'Company Name' },
                  industry: { type: 'string', title: 'Industry' },
                },
              },
              location: {
                type: 'object',
                title: 'Location',
                properties: async () => ({
                  // 深度异步嵌套
                  address: { type: 'string', title: 'Address' },
                  coordinates: {
                    type: 'object',
                    title: 'Coordinates',
                    properties: {
                      lat: { type: 'number', title: 'Latitude' },
                      lng: { type: 'number', title: 'Longitude' },
                    },
                  },
                }),
              },
            }),
          },
        },
      }),
    });

    // 测试深度路径：{{ ctx.enterprise.info.company.name }}
    const companyNameTree = ctx.getPropertyMetaTree('{{ ctx.enterprise.info.company.name }}');
    expect(companyNameTree).toHaveLength(1);
    expect(companyNameTree[0].name).toBe('name'); // 解析到了最终的 name 属性
    expect(companyNameTree[0].title).toBe('name'); // 异步解析的初始 title 是 name
    expect(companyNameTree[0].type).toBe('object'); // 异步节点的初始类型是 object

    // 测试深度路径：{{ ctx.enterprise.info.location.coordinates.lat }}
    // 这个路径包含异步函数，会返回包装的异步节点
    const coordinatesTree = ctx.getPropertyMetaTree('{{ ctx.enterprise.info.location.coordinates.lat }}');
    expect(coordinatesTree).toHaveLength(1);
    expect(coordinatesTree[0].name).toBe('lat'); // 最终解析到 lat
    expect(typeof coordinatesTree[0].children).toBe('function'); // 但仍然是异步的
  });

  it('should handle sync meta with async properties in deep path', () => {
    const ctx = new FlowContext();

    // 同步 meta 包含异步 properties
    ctx.defineProperty('project', {
      meta: {
        type: 'object',
        title: 'Project',
        properties: {
          details: {
            type: 'object',
            title: 'Details',
            properties: async () => ({
              // 异步加载详细信息
              metadata: {
                type: 'object',
                title: 'Metadata',
                properties: {
                  version: { type: 'string', title: 'Version' },
                  author: { type: 'string', title: 'Author' },
                },
              },
              dependencies: {
                type: 'object',
                title: 'Dependencies',
                properties: async () => ({
                  // 双重异步嵌套
                  production: {
                    type: 'array',
                    title: 'Production Dependencies',
                  },
                  development: {
                    type: 'array',
                    title: 'Development Dependencies',
                  },
                }),
              },
            }),
          },
        },
      },
    });

    // 测试路径：{{ ctx.project.details.metadata.version }}
    // 新逻辑现在能够处理这种复杂场景了！
    const versionTree = ctx.getPropertyMetaTree('{{ ctx.project.details.metadata.version }}');
    expect(versionTree).toHaveLength(1);
    expect(versionTree[0].name).toBe('version'); // 成功解析到最终属性
    expect(versionTree[0].title).toBe('version'); // 异步解析的初始 title 是 name
    expect(versionTree[0].type).toBe('object'); // 异步节点的初始类型是 object
  });

  it('should handle async meta factory with error in deep path resolution', async () => {
    const ctx = new FlowContext();

    ctx.defineProperty('errorProne', {
      meta: async () => ({
        type: 'object',
        title: 'Error Prone',
        properties: {
          working: {
            type: 'object',
            title: 'Working Section',
            properties: {
              data: { type: 'string', title: 'Data' },
            },
          },
          broken: {
            type: 'object',
            title: 'Broken Section',
            // 这里故意没有 properties，测试路径解析失败的情况
          },
        },
      }),
    });

    // 测试正常路径 - 新逻辑能直接解析到最终属性！
    const workingTree = ctx.getPropertyMetaTree('{{ ctx.errorProne.working.data }}');
    expect(workingTree).toHaveLength(1);
    expect(workingTree[0].name).toBe('data'); // 直接解析到data属性
    expect(workingTree[0].title).toBe('data'); // 异步解析的初始 title 是 name
    expect(workingTree[0].type).toBe('object'); // 异步节点的初始类型是 object

    // 新行为：根级直接返回 working、broken 子节点
    const rootTree = ctx.getPropertyMetaTree('{{ ctx.errorProne }}');
    const ensureArray = async (v: any) => (typeof v === 'function' ? await v() : v);
    const arr = await ensureArray(rootTree);
    const names = arr.map((n: any) => n.name).sort();
    expect(names).toEqual(['broken', 'working']);

    // 测试不存在的路径 - 新逻辑会尝试构建异步节点，即使路径可能不存在
    const brokenTree = ctx.getPropertyMetaTree('{{ ctx.errorProne.broken.nonExistent }}');
    expect(brokenTree).toHaveLength(1);
    expect(brokenTree[0].name).toBe('nonExistent');
    expect(brokenTree[0].title).toBe('nonExistent');
    expect(typeof brokenTree[0].children).toBe('function'); // 构建了异步解析函数

    // 测试异步解析会优雅失败（因为 broken 没有 properties）
    if (typeof brokenTree[0].children === 'function') {
      // 异步解析会失败，但被捕获并返回空数组
      const result = await brokenTree[0].children();
      expect(result).toEqual([]); // 错误被优雅处理，返回空数组
    }
  });

  it('should handle extremely deep async nesting', async () => {
    const ctx = new FlowContext();

    // 创建深度嵌套的异步结构
    ctx.defineProperty('deepNest', {
      meta: async () => ({
        type: 'object',
        title: 'Deep Nest',
        properties: async () => ({
          level1: {
            type: 'object',
            title: 'Level 1',
            properties: async () => ({
              level2: {
                type: 'object',
                title: 'Level 2',
                properties: async () => ({
                  level3: {
                    type: 'object',
                    title: 'Level 3',
                    properties: {
                      final: { type: 'string', title: 'Final Value' },
                    },
                  },
                }),
              },
            }),
          },
        }),
      }),
    });

    // 测试深度路径 - 新逻辑能够深入解析到最终属性！
    const deepTree = ctx.getPropertyMetaTree('{{ ctx.deepNest.level1.level2.level3.final }}');
    expect(deepTree).toHaveLength(1);
    expect(deepTree[0].name).toBe('final'); // 直接解析到最终属性！
    expect(deepTree[0].title).toBe('final'); // 异步解析的初始 title 是 name
    expect(deepTree[0].type).toBe('object'); // 异步节点的初始类型是 object

    // 测试中间层级的路径
    const level2Tree = ctx.getPropertyMetaTree('{{ ctx.deepNest.level1.level2 }}');
    expect(level2Tree).toHaveLength(1);
    expect(level2Tree[0].name).toBe('level2');
    expect(typeof level2Tree[0].children).toBe('function'); // 仍然是异步的，因为包含异步嵌套

    // 新行为：根级直接返回 level1 子节点
    const rootDeepTree = ctx.getPropertyMetaTree('{{ ctx.deepNest }}');
    const ensureArray = async (v: any) => (typeof v === 'function' ? await v() : v);
    const arr = await ensureArray(rootDeepTree);
    expect(arr).toHaveLength(1);
    expect(arr[0].name).toBe('level1');
  });
});
