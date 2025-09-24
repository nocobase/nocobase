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

    // use built-in FlowResource class name
    const res = child.createResource('FlowResource');
    expect(res['context']).toBe(child.context);
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
});
