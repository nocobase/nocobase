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
import type { FlowDefinitionOptions } from '../../types';

describe('GlobalFlowRegistry', () => {
  test('registerFlow stores static flow on model class', () => {
    class ParentModel extends FlowModel {}

    const parentFlow: FlowDefinitionOptions = {
      key: 'parentFlow',
      title: 'Parent Flow',
      steps: {
        stepA: { title: 'A' } as any,
      },
    };

    ParentModel.registerFlow(parentFlow);

    const flow = ParentModel.globalFlowRegistry.getFlow('parentFlow');
    expect(flow).toBeDefined();
    expect(flow?.key).toBe('parentFlow');
    expect(flow?.title).toBe('Parent Flow');
    expect(flow?.getStep('stepA')?.serialize()).toEqual({ key: 'stepA', flowKey: 'parentFlow', title: 'A', sort: 1 });
  });

  test('saveFlow/destroyFlow on global registry are no-ops', () => {
    class X extends FlowModel {}
    X.registerFlow({ key: 'f', steps: {} });
    const reg = X.globalFlowRegistry;

    const flowForSave = reg.getFlow('f');
    expect(() => reg.saveFlow(flowForSave!)).not.toThrow();
    expect(() => reg.destroyFlow('f')).not.toThrow();
  });

  test("removeFlow warns and doesn't remove static flows", () => {
    class X extends FlowModel {}
    X.registerFlow({ key: 'f', steps: {} });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      X.globalFlowRegistry.removeFlow('f');
      expect(warnSpy).toHaveBeenCalled();
      // Flow still present
      expect(X.globalFlowRegistry.getFlow('f')).toBeDefined();
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('child class inherits flows from parent registry', () => {
    class ParentModel extends FlowModel {}
    class ChildModel extends ParentModel {}

    ParentModel.registerFlow({ key: 'inherited', title: 'From Parent', steps: {} });

    // Child should see parent flow via global registry
    const childReg = ChildModel.globalFlowRegistry;
    const inherited = childReg.getFlow('inherited');
    expect(inherited).toBeDefined();
    expect(inherited?.title).toBe('From Parent');
  });

  test('child flow overrides parent flow with same key', () => {
    class ParentModel extends FlowModel {}
    class ChildModel extends ParentModel {}

    ParentModel.registerFlow({ key: 'shared', title: 'Parent Title', steps: {} });
    ChildModel.registerFlow({ key: 'shared', title: 'Child Title', steps: {} });

    const childReg = ChildModel.globalFlowRegistry;
    const flow = childReg.getFlow('shared');
    expect(flow).toBeDefined();
    expect(flow?.title).toBe('Child Title');
  });

  test('FlowModel instance merges instance and static flows with instance precedence', () => {
    const engine = new FlowEngine();

    class MyModel extends FlowModel {}
    engine.registerModels({ MyModel });

    // Static flows
    MyModel.registerFlow({ key: 'static1', title: 'S1', steps: {} });
    MyModel.registerFlow({ key: 'dup', title: 'Static DUP', steps: {} });

    const model = engine.createModel({ use: 'MyModel' });

    // Instance flows
    model.flowRegistry.addFlow('inst1', { title: 'I1', steps: {} });
    model.flowRegistry.addFlow('dup', { title: 'Instance DUP', steps: {} });

    const all = model.getFlows();
    // Contains both static and instance keys
    expect(Array.from(all.keys()).sort()).toEqual(['dup', 'inst1', 'static1']);

    // Instance takes precedence for duplicate key
    expect(all.get('dup')?.title).toBe('Instance DUP');
    expect(all.get('static1')?.title).toBe('S1');
  });

  test('dispatchEvent triggers both static and instance event flows', async () => {
    const engine = new FlowEngine();
    class MyModel extends FlowModel {}
    engine.registerModels({ MyModel });

    const staticHandler = vi.fn().mockResolvedValue('static-called');
    const instanceHandler = vi.fn().mockResolvedValue('instance-called');

    // Static event flow
    MyModel.registerFlow({
      key: 'staticEvent',
      on: { eventName: 'click' },
      steps: { s: { handler: staticHandler } },
    });

    const model = engine.createModel({ use: 'MyModel' });
    // Instance event flow
    model.flowRegistry.addFlow('instEvent', {
      on: { eventName: 'click' },
      steps: { i: { handler: instanceHandler } },
    });

    model.dispatchEvent('click', { foo: 'bar' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(staticHandler).toHaveBeenCalled();
    expect(instanceHandler).toHaveBeenCalled();
  });

  test('getFlows returns instance (dynamic) flows before static flows with own internal ordering', () => {
    const engine = new FlowEngine();
    class OrderModel extends FlowModel {}
    engine.registerModels({ OrderModel });

    // Register static flows with various sort values
    OrderModel.registerFlow({ key: 'staticLow', title: 'S-low', sort: -10, steps: {} });
    OrderModel.registerFlow({ key: 'staticHigh', title: 'S-high', sort: 10, steps: {} });

    const model = engine.createModel({ use: 'OrderModel' });

    // Add instance flows with sort values that would normally interleave if sorted purely by sort
    model.flowRegistry.addFlow('instMid', { title: 'I-mid', sort: 0, steps: {} });
    model.flowRegistry.addFlow('instHigh', { title: 'I-high', sort: 5, steps: {} });

    const keys = Array.from(model.getFlows().keys());
    // Expect dynamic flows first (by sort inside group), then static flows (by their own ordering)
    expect(keys).toEqual(['instMid', 'instHigh', 'staticLow', 'staticHigh']);
  });

  test('sequential dispatch runs instance flows before static flows regardless of static sort', async () => {
    const engine = new FlowEngine();
    class SeqModel extends FlowModel {}
    engine.registerModels({ SeqModel });

    const calls: string[] = [];

    // Static flow with very low sort to try to run first if not grouped
    SeqModel.registerFlow({
      key: 'S',
      on: { eventName: 'click' },
      sort: -100,
      steps: { s: { handler: async () => void calls.push('static') } as any },
    });

    const model = engine.createModel({ use: 'SeqModel' });

    // Instance flows with sort greater than static
    model.flowRegistry.addFlow('I1', {
      on: { eventName: 'click' },
      sort: 0,
      steps: { i1: { handler: async () => void calls.push('inst1') } as any },
    });
    model.flowRegistry.addFlow('I2', {
      on: { eventName: 'click' },
      sort: 5,
      steps: { i2: { handler: async () => void calls.push('inst2') } as any },
    });

    await model.dispatchEvent('click', undefined, { sequential: true });

    expect(calls).toEqual(['inst1', 'inst2', 'static']);
  });
});
