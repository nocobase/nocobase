/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { createBlockScopedEngine } from '../BlockScopedFlowEngine';
import { FlowModel } from '../models';

describe('BlockScopedFlowEngine', () => {
  it('shares global actions/events and model classes with parent', async () => {
    const parent = new FlowEngine();
    parent.registerActions({
      ping: {
        name: 'ping',
        handler: () => 'pong',
      },
    });
    const child = createBlockScopedEngine(parent);

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

  it('isolates model instances map and beforeRender cache across engines with identical model uid', async () => {
    const parent = new FlowEngine();
    const child = createBlockScopedEngine(parent);

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

    await pm.dispatchEvent('beforeRender');
    expect(count).toBe(1);

    // If cache was shared, the next call would hit cache and not increment.
    await cm.dispatchEvent('beforeRender');
    expect(count).toBe(2);
  });

  it('stacks engines and repairs chain when unlinking a middle block-scoped engine', () => {
    const root = new FlowEngine();
    const c1 = createBlockScopedEngine(root);
    const c2 = createBlockScopedEngine(root);
    const c3 = createBlockScopedEngine(root);

    // chain root -> c1 -> c2 -> c3
    expect(root.nextEngine).toBeTruthy();
    expect(root.nextEngine?.nextEngine).toBeTruthy();
    expect(root.nextEngine?.nextEngine?.nextEngine).toBeTruthy();

    // unlink middle (c2) should link c1 <-> c3 and keep the tail intact
    c2.unlinkFromStack();

    expect(root.nextEngine).toBe(c1);
    expect(c1.previousEngine).toBe(root);
    expect(c1.nextEngine).toBe(c3);
    expect(c3.previousEngine).toBe(c1);
    expect(c3.nextEngine).toBeUndefined();
  });

  it('global model lookup traverses from top to root across stack', () => {
    const root = new FlowEngine();
    const c1 = createBlockScopedEngine(root);
    const c2 = createBlockScopedEngine(root);

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

  it('delegates saveModel to parent (concurrency gate sharing)', async () => {
    const parent = new FlowEngine();
    const child = createBlockScopedEngine(parent);
    const spy = vi.spyOn(parent, 'saveModel').mockResolvedValueOnce(true);
    class T extends FlowModel {}
    const m = child.createModel<T>({ use: T });
    await child.saveModel(m);
    expect(spy).toHaveBeenCalledOnce();
  });
});
