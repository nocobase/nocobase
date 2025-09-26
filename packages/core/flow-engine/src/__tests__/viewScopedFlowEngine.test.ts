/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 */

import { describe, expect, it, vi } from 'vitest';
import { APIClient as SDKApiClient } from '@nocobase/sdk';
import { FlowEngine } from '../flowEngine';
import { createViewScopedEngine } from '../ViewScopedFlowEngine';
import { FlowModel } from '../models';

describe('ViewScopedFlowEngine', () => {
  it('shares global actions/events and model classes with parent', async () => {
    const parent = new FlowEngine();
    parent.registerActions({
      ping: {
        name: 'ping',
        handler: () => 'pong',
      },
    });
    const child = createViewScopedEngine(parent);

    // child can read parent's action
    expect(child.getAction('ping')).toBeDefined();

    // registering via child should affect parent
    child.registerActions({ pong: { name: 'pong', handler: () => 'ok' } });
    expect(parent.getAction('pong')).toBeDefined();

    // model class resolution is proxied
    class TestModel extends FlowModel {}
    parent.registerModels({ TestModel });
    expect(child.getModelClass('TestModel')).toBeDefined();
  });

  it('isolates model instances map by default', () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);

    class TestModel extends FlowModel {}

    const uid = 'same-uid';
    const pm = parent.createModel<TestModel>({ use: TestModel, uid });
    const cm = child.createModel<TestModel>({ use: TestModel, uid });

    expect(pm).not.toBe(cm);
    // 默认 getModel 仅在当前作用域查找
    expect(parent.getModel(uid)).toBe(pm);
    expect(child.getModel(uid)).toBe(cm);
  });

  it('isolates auto flow cache across engines with identical model uid', async () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);

    let count = 0;
    class CounterModel extends FlowModel {}
    CounterModel.registerFlow({
      key: 'autoCounter',
      steps: {
        s1: {
          handler: async () => {
            count += 1;
            return count;
          },
        },
      },
    });

    const uid = 'model-uid-cache';
    const pm = parent.createModel<CounterModel>({ use: CounterModel, uid });
    const cm = child.createModel<CounterModel>({ use: CounterModel, uid });

    await pm.applyAutoFlows();
    expect(count).toBe(1);

    // If cache was shared, the next call would hit cache and not increment.
    await cm.applyAutoFlows();
    expect(count).toBe(2);
  });

  it('creates resources using parent registry but binds to scoped context by default', () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);
    // mock minimal api to satisfy ctx.auth and related getters
    const api = new SDKApiClient({ storageType: 'memory' });
    api.auth.role = 'guest';
    api.auth.locale = 'en-US';
    api.auth.token = 't';
    parent.context.defineProperty('api', { value: api });

    // use built-in FlowResource class name
    const res = child.createResource('FlowResource');
    // resource context is a wrapper that delegates to child context
    child.context.defineProperty('foo', { value: 123 });
    expect((res as any).context.foo).toBe(123);
  });

  it('uses local context and delegates to parent context', () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);
    // In runtime, context.api is always provided by host app.
    // Provide a minimal mock here to avoid incidental getter access (e.g. ctx.auth) from throwing.
    const api = new SDKApiClient({ storageType: 'memory' });
    api.auth.role = 'guest';
    api.auth.locale = 'en-US';
    api.auth.token = 't';
    parent.context.defineProperty('api', { value: api });
    const parentCtx = parent.context;
    const childCtx = child.context;
    expect(Object.is(childCtx, parentCtx)).toBe(true);
    // define a value on parent context
    parent.context.defineProperty('foo', { value: 42 });
    // child context should be able to read via delegate chain
    expect((child.context as any).foo).toBe(42);
  });

  it('delegates saveModel to parent (concurrency gate sharing)', async () => {
    const parent = new FlowEngine();
    const child = createViewScopedEngine(parent);
    const spy = vi.spyOn(parent, 'saveModel').mockResolvedValueOnce(true);
    class T extends FlowModel {}
    const m = child.createModel<T>({ use: T });
    await child.saveModel(m);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('stacks multiple scoped engines on tail (linkAfter attaches to bottom)', () => {
    const root = new FlowEngine();
    const c1 = createViewScopedEngine(root);
    const c2 = createViewScopedEngine(root);

    // child pointers point back correctly
    expect(c1.previousEngine).toBe(root);
    expect(c2.previousEngine?.previousEngine).toBe(root);

    // chain length from root is 2 (two scoped engines)
    let count = 0;
    let p = root.nextEngine;
    while (p) {
      count += 1;
      p = p.nextEngine;
    }
    expect(count).toBe(2);
  });

  it('supports stacking when anchoring from nested child (still appends to bottom)', () => {
    const root = new FlowEngine();
    const c1 = createViewScopedEngine(root);
    const c2 = createViewScopedEngine(c1); // pass child as anchor

    expect(c1.previousEngine).toBe(root);
    expect(c2.previousEngine?.previousEngine).toBe(root);
  });

  it('global model lookup traverses from top to root across stack', () => {
    const root = new FlowEngine();
    const c1 = createViewScopedEngine(root);
    const c2 = createViewScopedEngine(root);

    class TM extends FlowModel {}
    const uid = 'same-uid-global-lookup';
    const mRoot = root.createModel<TM>({ use: TM, uid });
    const m1 = c1.createModel<TM>({ use: TM, uid });
    const m2 = c2.createModel<TM>({ use: TM, uid });

    // sanity: each scope returns its own when not global
    expect(root.getModel(uid)).toBe(mRoot);
    expect(c1.getModel(uid)).toBe(m1);
    expect(c2.getModel(uid)).toBe(m2);

    // global search from any engine hits the top-most engine's instance first
    expect(root.getModel(uid, true)).toBe(m2);
    expect(c1.getModel(uid, true)).toBe(m2);
    expect(c2.getModel(uid, true)).toBe(m2);
  });

  it('unlinkFromStack detaches only the top engine', () => {
    const root = new FlowEngine();
    const c1 = createViewScopedEngine(root);
    const c2 = createViewScopedEngine(root);

    class TM extends FlowModel {}
    const uid = 'unlink-top-only';
    c1.createModel<TM>({ use: TM, uid });
    const m2 = c2.createModel<TM>({ use: TM, uid });

    // before unlink: top is c2
    expect(root.getModel(uid, true)).toBe(m2);

    // unlink the top scoped engine
    c2.unlinkFromStack();

    // After unlink, root should have only one child (c1). Its next should be undefined.
    expect(root.nextEngine?.nextEngine).toBeUndefined();
    expect(root.nextEngine?.previousEngine).toBe(root);

    // global lookup should now resolve to c1's instance
    const resolved = root.getModel<TM>(uid, true);
    expect(resolved?.flowEngine.previousEngine).toBe(root);
  });
});
