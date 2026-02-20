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

describe('dispatchEvent dynamic event flow phase (scheduleModelOperation integration)', () => {
  test('default (phase undefined): instance flows run before static flows', async () => {
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

  test('default (phase undefined): ctx.exitAll() stops static flows (beforeAllFlows regression)', async () => {
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
    M.registerFlow({
      key: 'T',
      on: { eventName: 'go' },
      steps: {
        t: { handler: async () => void calls.push('static-t') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go' },
      steps: {
        d: {
          handler: async (ctx: any) => {
            calls.push('dynamic');
            ctx.exitAll();
          },
        } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic']);
  });

  test("phase='afterAllFlows': instance flow runs after static flows", async () => {
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
      on: { eventName: 'go', phase: 'afterAllFlows' },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'dynamic']);
  });

  test("phase='beforeFlow': instance flow runs before the target static flow", async () => {
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
      on: { eventName: 'go', phase: 'beforeFlow', flowKey: 'S' },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic', 'static-a', 'static-b']);
  });

  test("phase='afterFlow': instance flow runs after the target static flow", async () => {
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
      on: { eventName: 'go', phase: 'afterFlow', flowKey: 'S' },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'static-b', 'dynamic']);
  });

  test("phase='beforeStep': instance flow runs before the target static step", async () => {
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
      on: { eventName: 'go', phase: 'beforeStep', flowKey: 'S', stepKey: 'a' },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic', 'static-a', 'static-b']);
  });

  test("phase='afterStep': instance flow runs after the target static step", async () => {
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
      on: { eventName: 'go', phase: 'afterStep', flowKey: 'S', stepKey: 'a' },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'dynamic', 'static-b']);
  });

  test("phase='beforeFlow': ctx.exitAll() stops anchor flow and subsequent flows", async () => {
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
    M.registerFlow({
      key: 'T',
      on: { eventName: 'go' },
      steps: {
        t: { handler: async () => void calls.push('static-t') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', phase: 'beforeFlow', flowKey: 'S' },
      steps: {
        d: {
          handler: async (ctx: any) => {
            calls.push('dynamic');
            ctx.exitAll();
          },
        } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic']);
  });

  test("phase='beforeStep': ctx.exitAll() stops anchor step and subsequent flows", async () => {
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
    M.registerFlow({
      key: 'T',
      on: { eventName: 'go' },
      steps: {
        t: { handler: async () => void calls.push('static-t') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', phase: 'beforeStep', flowKey: 'S', stepKey: 'a' },
      steps: {
        d: {
          handler: async (ctx: any) => {
            calls.push('dynamic');
            ctx.exitAll();
          },
        } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic']);
  });

  test("phase='afterStep': ctx.exitAll() stops subsequent steps and subsequent flows", async () => {
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
    M.registerFlow({
      key: 'T',
      on: { eventName: 'go' },
      steps: {
        t: { handler: async () => void calls.push('static-t') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', phase: 'afterStep', flowKey: 'S', stepKey: 'a' },
      steps: {
        d: {
          handler: async (ctx: any) => {
            calls.push('dynamic');
            ctx.exitAll();
          },
        } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'dynamic']);
  });

  test("phase='afterFlow': ctx.exitAll() stops subsequent flows", async () => {
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
    M.registerFlow({
      key: 'T',
      on: { eventName: 'go' },
      steps: {
        t: { handler: async () => void calls.push('static-t') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    model.registerFlow('D', {
      on: { eventName: 'go', phase: 'afterFlow', flowKey: 'S' },
      steps: {
        d: {
          handler: async (ctx: any) => {
            calls.push('dynamic');
            ctx.exitAll();
          },
        } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'static-b', 'dynamic']);
  });

  test("phase='beforeFlow' missing flow: falls back to afterAllFlows", async () => {
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
      on: { eventName: 'go', phase: 'beforeFlow', flowKey: 'missing' },
      steps: {
        d: { handler: async () => void calls.push('dynamic') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'dynamic']);
  });

  test("phase='beforeStep' missing step: falls back to afterAllFlows", async () => {
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
      on: { eventName: 'go', phase: 'beforeStep', flowKey: 'S', stepKey: 'missing' },
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
      on: { eventName: 'go', phase: 'beforeStep', flowKey: 'S', stepKey: 'a' },
      steps: {
        d: { handler: async () => void calls.push('dynamic-5') } as any,
      },
    });
    model.registerFlow('D0', {
      sort: 0,
      on: { eventName: 'go', phase: 'beforeStep', flowKey: 'S', stepKey: 'a' },
      steps: {
        d: { handler: async () => void calls.push('dynamic-0') } as any,
      },
    });

    await model.dispatchEvent('go');
    expect(calls).toEqual(['dynamic-0', 'dynamic-5', 'static-a']);
  });
});

describe('dispatchEvent static flow phase (scheduleModelOperation integration)', () => {
  test("phase='beforeFlow': static flow runs before the target static flow", async () => {
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

    M.registerFlow({
      key: 'P',
      on: { eventName: 'go', phase: 'beforeFlow', flowKey: 'S' },
      steps: {
        p: { handler: async () => void calls.push('phase') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    await model.dispatchEvent('go');
    expect(calls).toEqual(['phase', 'static-a']);
  });

  test("phase='afterStep': static flow runs after the target static step", async () => {
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

    M.registerFlow({
      key: 'P',
      on: { eventName: 'go', phase: 'afterStep', flowKey: 'S', stepKey: 'a' },
      steps: {
        p: { handler: async () => void calls.push('phase') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'phase', 'static-b']);
  });

  test("phase='afterAllFlows': static flow runs after static flows", async () => {
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

    M.registerFlow({
      key: 'P',
      on: { eventName: 'go', phase: 'afterAllFlows' },
      steps: {
        p: { handler: async () => void calls.push('phase') } as any,
      },
    });

    const model = engine.createModel({ use: 'M' });
    await model.dispatchEvent('go');
    expect(calls).toEqual(['static-a', 'phase']);
  });
});
