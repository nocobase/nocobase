/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test, beforeEach } from 'vitest';
import { FlowModel } from '@nocobase/flow-engine';

describe('FlowModel.getFlows sorting and getEventFlows(beforeRender) order', () => {
  let TestFlowModel: typeof FlowModel;
  let model: FlowModel;

  beforeEach(() => {
    // use a fresh subclass to isolate class-level registries
    TestFlowModel = class extends FlowModel<any> {};
    // provide a minimal fake engine to avoid circular deps in tests
    const fakeEngine = { getModel: () => undefined } as any;
    model = new TestFlowModel({ flowEngine: fakeEngine } as any);
  });

  test('getFlows returns dynamic(instance) flows first, each group ordered by sort ascending', () => {
    // class-level (static) flows
    TestFlowModel.registerFlow('flowA', { title: 'A', sort: 10, steps: {} });
    TestFlowModel.registerFlow('flowB', { title: 'B', sort: 5, steps: {} });

    // instance-level flows
    model.registerFlow('flowC', { title: 'C', sort: 7, steps: {} });
    model.registerFlow('flowD', { title: 'D', steps: {} }); // default sort => 0

    const flows = model.getFlows();
    const orderedKeys = Array.from(flows.keys());

    // 动态流组：flowD(0), flowC(7)；静态流组：flowB(5), flowA(10)
    expect(orderedKeys).toEqual(['flowD', 'flowC', 'flowB', 'flowA']);
  });

  test("getEventFlows('beforeRender') keeps getFlows order and filters out manual/on flows", () => {
    // class-level
    TestFlowModel.registerFlow('flowA', { title: 'A', sort: 10, steps: {} });
    TestFlowModel.registerFlow('flowB', { title: 'B', sort: 5, steps: {} });

    // instance-level
    model.registerFlow('flowD', { title: 'D', steps: {} }); // default 0
    model.registerFlow('flowC', { title: 'C', sort: 7, steps: {} });
    model.registerFlow('flowE', { title: 'E', sort: 8, steps: {} });
    // excluded by filters
    model.registerFlow('eventFlow', { title: 'Evt', on: 'click', sort: 1, steps: {} } as any);
    model.registerFlow('manualFlow', { title: 'Manual', manual: true, sort: -1, steps: {} });

    const getFlowsOrder = Array.from(model.getFlows().keys());
    const autoFlowKeys = model.getEventFlows('beforeRender').map((f) => f.key);

    // auto flows should exclude event/manual flows
    // 新顺序：动态流组（flowD 0, flowC 7, flowE 8）→ 静态流组（flowB 5, flowA 10）
    expect(autoFlowKeys).toEqual(['flowD', 'flowC', 'flowE', 'flowB', 'flowA']);

    // relative order should match getFlows order (subset in same sequence)
    const filteredGetFlowsOrder = getFlowsOrder.filter((k) => !['eventFlow', 'manualFlow'].includes(k));
    expect(autoFlowKeys).toEqual(filteredGetFlowsOrder);
  });

  test('getFlows tie-breaker: instance before static when sort equal', () => {
    // static flow with sort 2
    TestFlowModel.registerFlow('static2', { title: 'S2', sort: 2, steps: {} });
    // instance flow with same sort 2
    model.registerFlow('instance2', { title: 'I2', sort: 2, steps: {} });

    const keys = Array.from(model.getFlows().keys());
    expect(keys.indexOf('instance2')).toBeLessThan(keys.indexOf('static2'));
  });

  test('getFlows tie-breaker: parent static before child static when sort equal', () => {
    class Parent extends FlowModel {}
    class Child extends Parent {}
    const fakeEngine = { getModel: () => undefined } as any;
    const instance = new Child({ flowEngine: fakeEngine } as any);

    Parent.registerFlow('parent', { title: 'P', sort: 3, steps: {} });
    Child.registerFlow('child', { title: 'C', sort: 3, steps: {} });

    const ordered = Array.from(instance.getFlows().keys());
    expect(ordered.indexOf('parent')).toBeLessThan(ordered.indexOf('child'));
  });

  test('GlobalFlowRegistry.getFlows sorted: parent static before child static on tie', () => {
    class P extends FlowModel {}
    class C extends P {}
    const fakeEngine = { getModel: () => undefined } as any;
    const inst = new C({ flowEngine: fakeEngine } as any);

    P.registerFlow('p', { steps: {}, sort: 1 });
    C.registerFlow('c', { steps: {}, sort: 1 });

    const staticFlows = (C as any).globalFlowRegistry.getFlows();
    const keys = Array.from(staticFlows.keys());
    expect(keys.indexOf('p')).toBeLessThan(keys.indexOf('c'));
  });

  test('instance flows keep registration order when sort equal', () => {
    // same sort for all instance flows -> keep registration order
    model.registerFlow('i1', { title: 'I1', sort: 1, steps: {} } as any);
    model.registerFlow('i2', { title: 'I2', sort: 1, steps: {} } as any);
    model.registerFlow('i3', { title: 'I3', sort: 1, steps: {} } as any);

    // add some static flows to ensure grouping doesn't affect instance intra-order
    (TestFlowModel as any).registerFlow('s1', { title: 'S1', sort: 1, steps: {} });
    (TestFlowModel as any).registerFlow('s2', { title: 'S2', sort: 2, steps: {} });

    const keys = Array.from(model.getFlows().keys());
    // Instance group appears first and preserves registration order
    const posI1 = keys.indexOf('i1');
    const posI2 = keys.indexOf('i2');
    const posI3 = keys.indexOf('i3');
    expect(posI1).toBeLessThan(posI2);
    expect(posI2).toBeLessThan(posI3);

    // Static group follows
    expect(keys.slice(posI3 + 1)).toEqual(expect.arrayContaining(['s1', 's2']));
  });
});
