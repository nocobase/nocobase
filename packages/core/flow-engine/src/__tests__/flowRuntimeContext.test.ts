/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { ContextPathProxy } from '../ContextPathProxy';
import { FlowRuntimeContext } from '../flowContext';

describe('FlowRuntimeContext', () => {
  let engine: FlowEngine;
  let model: FlowModel;

  beforeEach(() => {
    engine = new FlowEngine();
    model = engine.createModel({ use: 'FlowModel' });
  });

  it('should support nested property access in runtime mode', () => {
    const ctx = new FlowRuntimeContext(model, 'flow1');
    ctx.defineProperty('steps', { value: { step1: { result: 42 } } });
    ctx.defineProperty('runId', { value: 'abc123' });

    expect(ctx.steps.step1.result).toBe(42);
    expect(ctx.runId).toBe('abc123');
    expect(ctx.steps.step2).toBeUndefined();
    expect(ctx.steps.step1.notExist).toBeUndefined();
    expect(ctx.notFound).toBeUndefined();
  });

  it('should return string template in settings mode', () => {
    const ctx = new FlowRuntimeContext(model, 'flow1', 'settings');
    ctx.defineProperty('runId', { value: 'mock' });
    ctx.defineProperty('steps', { value: {} });
    expect(ctx.runId.toString()).toBe('{{ctx.runId}}');
    expect(`${ctx.runId}`).toBe('{{ctx.runId}}');
    expect(ctx.runId).instanceOf(ContextPathProxy);
    expect(ctx.notFound).toBeUndefined();
    expect(`${ctx.steps.step1.result}`).toBe('{{ctx.steps.step1.result}}');
  });

  it('should throw on exit()', () => {
    const ctx = new FlowRuntimeContext(model, 'flow1', 'runtime');
    expect(() => ctx.exit()).toThrow();
  });
});

describe('FlowRuntimeContext.runAction', () => {
  let engine: FlowEngine;
  let model: FlowModel;
  let ctx: FlowRuntimeContext;

  beforeEach(() => {
    engine = new FlowEngine();
    model = engine.createModel({ use: 'FlowModel' });
    ctx = new FlowRuntimeContext(model, 'unitFlow');
  });

  it('executes a registered action by name and returns result', async () => {
    engine.registerActions({
      hello: {
        name: 'hello',
        handler: (_ctx, params) => ({ ok: true, params }),
      },
    });

    const res = await ctx.runAction('hello', { x: 1 });
    expect(res).toEqual({ ok: true, params: { x: 1 } });
  });

  it('merges defaultParams and resolves expressions when useRawParams is falsy', async () => {
    engine.registerActions({
      combine: {
        name: 'combine',
        defaultParams: {
          a: 1,
          uidFromDefault: '{{ ctx.model.uid }}',
        },
        handler: (_ctx, params) => params,
      },
    });

    const res = await ctx.runAction('combine', {
      b: 2,
      uidFromParam: '{{ ctx.model.uid }}',
    });

    expect(res).toEqual({
      a: 1,
      b: 2,
      uidFromDefault: model.uid,
      uidFromParam: model.uid,
    });
  });

  it('does not resolve expressions when useRawParams=true', async () => {
    engine.registerActions({
      raw: {
        name: 'raw',
        defaultParams: {
          fromDefault: '{{ ctx.model.uid }}',
        },
        useRawParams: true,
        handler: (_ctx, params) => params,
      },
    });

    const res = await ctx.runAction('raw', {
      fromParam: '{{ ctx.model.uid }}',
      n: 123,
    });
    expect(res).toEqual({
      fromDefault: '{{ ctx.model.uid }}',
      fromParam: '{{ ctx.model.uid }}',
      n: 123,
    });
  });

  it('supports useRawParams as function', async () => {
    engine.registerActions({
      decide: {
        name: 'decide',
        defaultParams: { d: '{{ ctx.model.uid }}' },
        useRawParams: () => Promise.resolve(true),
        handler: (_ctx, params) => params,
      },
    });

    const res = await ctx.runAction('decide', { p: '{{ ctx.model.uid }}' });
    expect(res).toEqual({ d: '{{ ctx.model.uid }}', p: '{{ ctx.model.uid }}' });
  });

  it('throws if action not found', async () => {
    await expect(ctx.runAction('no-such-action')).rejects.toThrow(/not found/i);
  });
});

describe('Flow run with step that triggers another action', () => {
  it('step action calls ctx.runAction to invoke another action', async () => {
    const engine = new FlowEngine();
    const model = engine.createModel({ use: 'FlowModel' });

    // second action: merges defaults and resolves expressions
    engine.registerActions({
      second: {
        name: 'second',
        defaultParams: { a: 1, uidDefault: '{{ ctx.model.uid }}' },
        handler: (_ctx, params) => ({ from: 'second', ...params }),
      },
    });

    // first action: triggers second via ctx.runAction
    engine.registerActions({
      first: {
        name: 'first',
        handler: async (ctx) => {
          return await ctx.runAction('second', {
            b: 2,
            uidFromFirst: '{{ ctx.model.uid }}',
          });
        },
      },
    });

    // Define a flow with a single step using 'first'
    model.flowRegistry.addFlow('chainFlow', {
      title: 'Chain Flow',
      steps: {
        s1: { use: 'first' },
      },
    });

    const res = await engine.executor.runFlow(model, 'chainFlow');
    expect(res.s1).toEqual({
      from: 'second',
      a: 1,
      b: 2,
      uidDefault: model.uid,
      uidFromFirst: model.uid,
    });
  });
});
