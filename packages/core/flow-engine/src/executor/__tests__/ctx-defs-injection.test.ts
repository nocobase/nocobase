/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models';
import type { FlowDefinitionOptions, FlowModelOptions } from '../../types';

describe('defineProperties/defineMethods injection', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('engine.context.runAction applies defs before defaultParams and handler', async () => {
    const handler = vi.fn((_ctx, params) => params);
    engine.registerActions({
      test: {
        name: 'test',
        defineProperties: { foo: { value: 5 } },
        defineMethods: { add: (x: number) => x + 1 },
        defaultParams: (ctx) => ({ a: (ctx as any).foo, b: (ctx as any).add(2) }),
        handler,
      },
    });

    const result = await (engine.context as any).runAction('test');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ a: 5, b: 3 });
  });

  it('model.context.runAction applies defs before defaultParams and handler', async () => {
    class M extends FlowModel {}
    engine.registerModels({ M });
    const h = vi.fn((_ctx, params) => ({ ...params, y: (_ctx as any).mul(3) }));
    M.registerAction({
      name: 'mAction',
      defineProperties: async () => ({ al: { value: 7 } }),
      defineMethods: async () => ({ mul: (x: number) => x * 2 }),
      defaultParams: (ctx) => ({ a: (ctx as any).al }),
      handler: h,
    });
    const m = engine.createModel<M>({ use: 'M' });
    const res = await (m.context as any).runAction('mAction', { x: 3 });
    expect(h).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ a: 7, x: 3, y: 6 });
  });

  function createModelWithFlows(uid: string, flows: Record<string, Omit<FlowDefinitionOptions, 'key'>>) {
    const model = new FlowModel({
      uid,
      flowEngine: engine,
      stepParams: {},
      subModels: {},
      flowRegistry: flows,
    } as FlowModelOptions);
    return model;
  }

  it('FlowExecutor: action-based step injects defs before defaultParams/handler', async () => {
    const stepHandler = vi.fn((_ctx, params) => params);
    engine.registerActions({
      act: {
        name: 'act',
        defineProperties: { base: { value: 10 } },
        defineMethods: { inc: (x: number) => x + 1 },
        handler: stepHandler,
      },
    });

    const flows = {
      f: {
        steps: {
          s: {
            use: 'act',
            defaultParams: (ctx) => ({ p: (ctx as any).base, q: (ctx as any).inc(4) }),
          },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const m = createModelWithFlows('m1', flows);
    const res = await engine.executor.runFlow(m, 'f');
    expect(stepHandler).toHaveBeenCalledTimes(1);
    const [, received] = stepHandler.mock.calls[0];
    expect(received).toEqual({ p: 10, q: 5 });
    expect(res.s).toEqual({ p: 10, q: 5 });
  });

  it('FlowExecutor: inline step injects defs before defaultParams/handler', async () => {
    const stepHandler = vi.fn((_ctx, params) => ({ ...params, v: (_ctx as any).twice(5) }));
    const flows = {
      f: {
        steps: {
          s: {
            defineProperties: { k: { value: 8 } },
            defineMethods: { twice: (x: number) => 2 * x },
            defaultParams: (ctx) => ({ m: (ctx as any).k }),
            handler: stepHandler,
          },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const m = createModelWithFlows('m2', flows);
    const res = await engine.executor.runFlow(m, 'f');
    expect(stepHandler).toHaveBeenCalledTimes(1);
    const [, received] = stepHandler.mock.calls[0];
    // params 仅包含 defaultParams 合并后的值；v 是 handler 计算的返回值
    expect(received).toEqual({ m: 8 });
    expect(res.s).toEqual({ m: 8, v: 10 });
  });

  it('FlowExecutor: step defs are isolated per step', async () => {
    const flows = {
      f: {
        steps: {
          a: {
            defineMethods: { only: (x: number) => x + 1 },
            handler: (_ctx, _params) => ({ ok: true }),
          },
          b: {
            // 这里期望无法访问到上一步注入的方法，从而抛出错误
            defaultParams: (ctx) => ({ v: (ctx as any).only(1) }),
            handler: (_ctx, params) => params,
          },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;
    const m = createModelWithFlows('m-isolation', flows);
    const res = await engine.executor.runFlow(m, 'f');
    // a 正常执行，b 无法访问到 a 注入的方法，defaultParams 出错被 resolveDefaultParams 捕获后为空对象
    expect(res).toEqual({ a: { ok: true }, b: {} });
  });

  it('FlowExecutor: step defs override action defs when same key', async () => {
    const stepHandler = vi.fn((_ctx, params) => params);
    engine.registerActions({
      act: {
        name: 'act',
        defineProperties: { foo: { value: 1 } },
        defineMethods: { id: (x: number) => x },
        handler: stepHandler,
      },
    });
    const flows = {
      f: {
        steps: {
          s: {
            use: 'act',
            defineProperties: { foo: { value: 2 } },
            defineMethods: { id: (x: number) => x + 100 },
            defaultParams: (ctx) => ({ a: (ctx as any).foo, b: (ctx as any).id(1) }),
          },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;
    const m = createModelWithFlows('m3', flows);
    await engine.executor.runFlow(m, 'f');
    const [, received] = stepHandler.mock.calls[0];
    expect(received).toEqual({ a: 2, b: 101 });
  });

  it('FlowExecutor: subsequent defineProperty/defineMethod write to parent context (not scoped)', async () => {
    const flows = {
      f: {
        steps: {
          a: {
            handler: (ctx) => {
              (ctx as any).defineProperty('mark', { value: 7 });
              (ctx as any).defineMethod('inc', (x: number) => x + 1);
              return { ok: true };
            },
          },
          b: {
            // 无注入，直接读取上一步通过 defineProperty/defineMethod 挂在到父级的能力
            defaultParams: (ctx) => ({ v: (ctx as any).mark, w: (ctx as any).inc(2) }),
            handler: (_ctx, params) => params,
          },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const m = engine.createModel<FlowModel>({ use: FlowModel.name, flowRegistry: flows });
    const res = await engine.executor.runFlow(m, 'f');
    expect(res).toEqual({ a: { ok: true }, b: { v: 7, w: 3 } });
  });
});
