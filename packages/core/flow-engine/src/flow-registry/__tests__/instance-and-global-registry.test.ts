/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test, vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';

describe('Flow registries integration (instance + global)', () => {
  test('merges flows with instance precedence; dispatchEvent hits both sets appropriately', async () => {
    const engine = new FlowEngine();

    class MyBase extends FlowModel {}
    class MyModel extends MyBase {}
    engine.registerModels({ MyBase, MyModel });

    const staticSharedHandler = vi.fn().mockResolvedValue('static-shared');
    const staticBaseOnlyHandler = vi.fn().mockResolvedValue('static-base');
    const instanceSharedHandler = vi.fn().mockResolvedValue('instance-shared');
    const instanceOnlyHandler = vi.fn().mockResolvedValue('instance-only');

    // Static/global flows on class registries
    MyModel.registerFlow({
      key: 'shared',
      on: { eventName: 'click' },
      steps: { s: { title: 'S', handler: staticSharedHandler } },
    });
    MyBase.registerFlow({
      key: 'baseOnly',
      on: { eventName: 'click' },
      steps: { b: { title: 'B', handler: staticBaseOnlyHandler } },
    });

    // Create instance and add instance flows
    const model = engine.createModel<MyModel>({ use: 'MyModel' });
    model.flowRegistry.addFlow('instanceOnly', {
      on: { eventName: 'click' },
      steps: { i: { title: 'I', handler: instanceOnlyHandler } },
    });

    // Override the static shared flow with instance definition
    model.flowRegistry.addFlow('shared', {
      on: { eventName: 'click' },
      steps: { is: { title: 'IS', handler: instanceSharedHandler } },
    });

    // Verify merged keys and precedence
    const all = model.getFlows();
    expect(Array.from(all.keys()).sort()).toEqual(['baseOnly', 'instanceOnly', 'shared']);
    expect(all.get('shared')?.mapSteps((s) => s.title)).toEqual(['IS']);

    // Dispatch event should call: instanceOnly, instance(shared override), and static baseOnly
    await model.dispatchEvent('click', { any: 'arg' });
    await new Promise((_resolve) => setTimeout(_resolve, 0));

    expect(instanceOnlyHandler).toHaveBeenCalled();
    expect(instanceSharedHandler).toHaveBeenCalled();
    expect(staticBaseOnlyHandler).toHaveBeenCalled();
    // The static shared should NOT be called because instance overrides it by key
    expect(staticSharedHandler).not.toHaveBeenCalled();
  });
});
