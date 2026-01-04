/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, test, expect } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../flowModel';

describe('dispatchEvent dynamic event flow when (scheduleModelOperation integration)', () => {
  test('default (when undefined): instance flows run before static flows', async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      steps: {
        a: { handler: async () => void calls.push('static-a') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go' },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic', 'static-a']);
  });

  test("when.anchor='afterAllStatic': instance flow runs after static flows", async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      steps: {
        a: { handler: async () => void calls.push('static-a') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', when: { anchor: 'afterAllStatic' } },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'dynamic']);
  });

  test("when.anchor='staticFlow' before: instance flow runs before the target static flow", async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      steps: {
        a: { handler: async () => void calls.push('static-a') } as any,
        b: { handler: async () => void calls.push('static-b') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', when: { anchor: 'staticFlow', flowKey: 'S', phase: 'before' } },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic', 'static-a', 'static-b']);
  });

  test("when.anchor='staticFlow' after: instance flow runs after the target static flow", async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      steps: {
        a: { handler: async () => void calls.push('static-a') } as any,
        b: { handler: async () => void calls.push('static-b') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', when: { anchor: 'staticFlow', flowKey: 'S', phase: 'after' } },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'static-b', 'dynamic']);
  });

  test("when.anchor='staticStep' before: instance flow runs before the target static step", async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      steps: {
        a: { handler: async () => void calls.push('static-a') } as any,
        b: { handler: async () => void calls.push('static-b') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', when: { anchor: 'staticStep', flowKey: 'S', stepKey: 'a', phase: 'before' } },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic', 'static-a', 'static-b']);
  });

  test("when.anchor='staticFlow' missing flow: falls back to afterAllStatic", async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      steps: {
        a: { handler: async () => void calls.push('static-a') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', when: { anchor: 'staticFlow', flowKey: 'missing', phase: 'before' } },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'dynamic']);
  });

  test("when.anchor='staticStep' missing step: falls back to afterAllStatic", async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      steps: {
        a: { handler: async () => void calls.push('static-a') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', when: { anchor: 'staticStep', flowKey: 'S', stepKey: 'missing', phase: 'before' } },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'dynamic']);
  });

  test('multiple flows on same anchor: executes by flow.sort asc (stable)', async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      steps: {
        a: { handler: async () => void calls.push('static-a') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D5', {
      sort: 5,
      on: { eventName: 'go', when: { anchor: 'staticStep', flowKey: 'S', stepKey: 'a', phase: 'before' } },
      steps: {
        d: { handler: async () => void calls.push('dynamic-5') } as any,
      },
    });
    model.registerFlow('D0', {
      sort: 0,
      on: { eventName: 'go', when: { anchor: 'staticStep', flowKey: 'S', stepKey: 'a', phase: 'before' } },
      steps: {
        d: { handler: async () => void calls.push('dynamic-0') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic-0', 'dynamic-5', 'static-a']);
  });
});
