/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test, beforeEach } from 'vitest';
import { FlowModel } from '../flowModel';

describe('FlowModel.getFlows sorting and getAutoFlows order', () => {
  let TestFlowModel: typeof FlowModel;
  let model: FlowModel;

  beforeEach(() => {
    // use a fresh subclass to isolate class-level registries
    TestFlowModel = class extends FlowModel {};
    // provide a minimal fake engine to avoid circular deps in tests
    const fakeEngine = { getModel: () => undefined } as any;
    model = new TestFlowModel({ flowEngine: fakeEngine } as any);
  });

  test('getFlows returns Map ordered by sort ascending', () => {
    // class-level (static) flows
    TestFlowModel.registerFlow('flowA', { title: 'A', sort: 10, steps: {} });
    TestFlowModel.registerFlow('flowB', { title: 'B', sort: 5, steps: {} });

    // instance-level flows
    model.registerFlow('flowC', { title: 'C', sort: 7, steps: {} });
    model.registerFlow('flowD', { title: 'D', steps: {} }); // default sort => 0

    const flows = model.getFlows();
    const orderedKeys = Array.from(flows.keys());

    expect(orderedKeys).toEqual(['flowD', 'flowB', 'flowC', 'flowA']);
  });

  test('getAutoFlows keeps getFlows order and filters out manual/on flows', () => {
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
    const autoFlowKeys = model.getAutoFlows().map((f) => f.key);

    // auto flows should exclude event/manual flows
    expect(autoFlowKeys).toEqual(['flowD', 'flowB', 'flowC', 'flowE', 'flowA']);

    // relative order should match getFlows order (subset in same sequence)
    const filteredGetFlowsOrder = getFlowsOrder.filter((k) => !['eventFlow', 'manualFlow'].includes(k));
    expect(autoFlowKeys).toEqual(filteredGetFlowsOrder);
  });

  test('getFlows tie-breaker: static before instance when sort equal', () => {
    // static flow with sort 2
    TestFlowModel.registerFlow('static2', { title: 'S2', sort: 2, steps: {} });
    // instance flow with same sort 2
    model.registerFlow('instance2', { title: 'I2', sort: 2, steps: {} });

    const keys = Array.from(model.getFlows().keys());
    expect(keys.indexOf('static2')).toBeLessThan(keys.indexOf('instance2'));
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
});
