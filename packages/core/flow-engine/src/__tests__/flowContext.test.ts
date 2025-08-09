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
      children: [
        {
          name: 'field1',
          title: 'Field 1',
          type: 'string',
          interface: undefined,
          uiSchema: undefined,
          children: undefined,
        },
        {
          name: 'field2',
          title: 'Field 2',
          type: 'number',
          interface: undefined,
          uiSchema: undefined,
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
        children: undefined,
      },
      {
        name: 'dynamicField2',
        title: 'Dynamic Field 2',
        type: 'boolean',
        interface: undefined,
        uiSchema: undefined,
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
      display: undefined,
      children: undefined,
    });
    expect(children[1]).toEqual({
      name: 'name',
      title: 'Username',
      type: 'string',
      interface: undefined,
      uiSchema: undefined,
      display: undefined,
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
