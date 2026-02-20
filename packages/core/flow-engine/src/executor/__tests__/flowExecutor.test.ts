/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models';
import type { FlowDefinitionOptions, FlowModelOptions } from '../../types';

describe('FlowExecutor', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    vi.restoreAllMocks();
    vi.clearAllMocks();
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

  it('runFlow executes steps and merges params from action/step/model', async () => {
    const actionHandler = vi.fn((_ctx, params) => params);
    engine.registerActions({
      testAction: {
        name: 'testAction',
        handler: actionHandler,
        defaultParams: { a: 1, b: 2 },
      },
    });

    const step2Handler = vi.fn().mockResolvedValue('step2-ok');

    const flows = {
      testFlow: {
        title: 'Test Flow',
        steps: {
          step1: {
            use: 'testAction',
            defaultParams: { b: 22, c: 3 },
          },
          step2: {
            handler: step2Handler,
          },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = new FlowModel({
      uid: 'm-runFlow',
      flowEngine: engine,
      stepParams: { testFlow: { step1: { b: 99, d: 4 } } },
      subModels: {},
      flowRegistry: flows,
    } as FlowModelOptions);

    const result = await engine.executor.runFlow(model, 'testFlow');

    // step1 received merged params: action(a=1,b=2) + step(b=22,c=3) + model(b=99,d=4)
    expect(actionHandler).toHaveBeenCalledTimes(1);
    const [, receivedParams] = actionHandler.mock.calls[0];
    expect(receivedParams).toEqual({ a: 1, b: 99, c: 3, d: 4 });

    expect(step2Handler).toHaveBeenCalledTimes(1);

    // result is stepResults map
    expect(result).toBeDefined();
    expect(result.step2).toBe('step2-ok');
  });

  it("dispatchEvent('beforeRender') executes flows in sort order and caches result (when options specify)", async () => {
    const calls: string[] = [];
    const mkFlow = (key: string, sort: number) => ({
      sort,
      steps: {
        only: {
          handler: vi.fn().mockImplementation(async () => {
            calls.push(key);
            return key;
          }),
        },
      },
    });

    const flows = {
      f2: mkFlow('f2', 2),
      f1: mkFlow('f1', 1),
      ignoredManual: { manual: true, steps: { s: { handler: vi.fn() } } },
      ignoredOn: { on: 'click', steps: { s: { handler: vi.fn() } } },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-auto', flows);

    const r1 = await engine.executor.dispatchEvent(model, 'beforeRender', undefined, {
      sequential: true,
      useCache: true,
    });
    expect(Array.isArray(r1)).toBe(true);
    // sort order: f1 then f2
    expect(calls).toEqual(['f1', 'f2']);

    // second run should hit cache and not execute handlers again
    const prevCount = calls.length;
    const r2 = await engine.executor.dispatchEvent(model, 'beforeRender', undefined, {
      sequential: true,
      useCache: true,
    });
    expect(Array.isArray(r2)).toBe(true);
    expect(calls.length).toBe(prevCount);
  });

  it('dispatchEvent triggers only flows matching event name', async () => {
    const clickHandler = vi.fn().mockResolvedValue('ok-click');
    const submitHandler = vi.fn().mockResolvedValue('ok-submit');

    const flows = {
      clickFlow: { on: { eventName: 'click' }, steps: { s: { handler: clickHandler } } },
      submitFlow: { on: { eventName: 'submit' }, steps: { s: { handler: submitHandler } } },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-dispatch', flows);

    await engine.executor.dispatchEvent(model, 'click');

    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).not.toHaveBeenCalled();
  });

  it("dispatchEvent('click') skips instance flows when triggerByRouter is true", async () => {
    class MyModel extends FlowModel {}

    const globalHandler = vi.fn().mockResolvedValue('global-ok');
    MyModel.registerFlow('globalClick', {
      on: 'click',
      steps: {
        s: { handler: globalHandler },
      },
    });

    const instanceHandler = vi.fn().mockResolvedValue('instance-ok');
    const model = new MyModel({
      uid: 'm-click-router-replay',
      flowEngine: engine,
      flowRegistry: {
        instanceClick: {
          on: 'click',
          steps: {
            s: { handler: instanceHandler },
          },
        },
      },
      stepParams: {},
      subModels: {},
    } as FlowModelOptions);

    await engine.executor.dispatchEvent(model, 'click', { triggerByRouter: true }, { sequential: true });

    expect(globalHandler).toHaveBeenCalledTimes(1);
    expect(instanceHandler).not.toHaveBeenCalled();
  });

  it("dispatchEvent('click') keeps instance flows when triggerByRouter is not true", async () => {
    class MyModel extends FlowModel {}

    const globalHandler = vi.fn().mockResolvedValue('global-ok');
    MyModel.registerFlow('globalClick', {
      on: 'click',
      steps: {
        s: { handler: globalHandler },
      },
    });

    const instanceHandler = vi.fn().mockResolvedValue('instance-ok');
    const model = new MyModel({
      uid: 'm-click-normal',
      flowEngine: engine,
      flowRegistry: {
        instanceClick: {
          on: 'click',
          steps: {
            s: { handler: instanceHandler },
          },
        },
      },
      stepParams: {},
      subModels: {},
    } as FlowModelOptions);

    await engine.executor.dispatchEvent(model, 'click', { triggerByRouter: false }, { sequential: true });

    expect(globalHandler).toHaveBeenCalledTimes(1);
    expect(instanceHandler).toHaveBeenCalledTimes(1);
  });

  it('dispatchEvent default parallel does not stop on exitAll', async () => {
    const calls: string[] = [];
    const mkFlow = (key: string, opts?: { exitAll?: boolean }) => ({
      on: { eventName: 'par' },
      steps: {
        only: {
          handler: vi.fn().mockImplementation((ctx) => {
            calls.push(key);
            if (opts?.exitAll) ctx.exitAll();
          }),
        },
      },
    });

    const flows = {
      a: mkFlow('a', { exitAll: true }),
      b: mkFlow('b'),
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-par', flows);

    await engine.executor.dispatchEvent(model, 'par');

    // 在并行模式下，b 不会被 exitAll 中断
    expect(calls.sort()).toEqual(['a', 'b']);
  });

  it('dispatchEvent sequential respects sort order and stops on errors', async () => {
    const calls: string[] = [];
    const mkFlow = (key: string, sort: number, opts?: { throw?: boolean }) => ({
      on: { eventName: 'seq2' },
      sort,
      steps: {
        only: {
          handler: vi.fn().mockImplementation(() => {
            calls.push(key);
            if (opts?.throw) throw new Error('boom');
          }),
        },
      },
    });

    const flows = {
      f2: mkFlow('f2', 2),
      f1: mkFlow('f1', 1, { throw: true }),
      f3: mkFlow('f3', 3),
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-seq2', flows);
    await engine.executor.dispatchEvent(model, 'seq2', {}, { sequential: true });

    // 顺序：按 sort 执行；f1 抛错后终止，f2 和 f3 不会执行
    expect(calls).toEqual(['f1']);
  });

  it('dispatchEvent caches non-beforeRender when useCache=true', async () => {
    const handler = vi.fn();
    const flows = {
      onFoo: { on: 'foo', steps: { s: { handler } } },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;
    const model = createModelWithFlows('m-evt-cache', flows);

    await engine.executor.dispatchEvent(model, 'foo', {}, { useCache: true });
    await engine.executor.dispatchEvent(model, 'foo', {}, { useCache: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("dispatchEvent('beforeRender') runs once due to cache (when options specify)", async () => {
    const handler = vi.fn();
    const flows = {
      auto1: { steps: { s: { handler } } }, // 无 on → 视为 beforeRender
      auto2: { on: 'beforeRender', steps: { s: { handler } } },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-br-cache', flows);

    await engine.executor.dispatchEvent(model, 'beforeRender', undefined, { sequential: true, useCache: true });
    await engine.executor.dispatchEvent(model, 'beforeRender', undefined, { sequential: true, useCache: true });

    // 两次触发但步骤处理只执行一次（命中缓存）
    expect(handler).toHaveBeenCalledTimes(2); // 每个 flow 各 1 次，共 2 次
  });

  it('dispatchEvent supports sequential execution order and exitAll break', async () => {
    const calls: string[] = [];
    const mkFlow = (key: string, sort: number, opts?: { exitAll?: boolean }) => ({
      on: { eventName: 'seq' },
      sort,
      steps: {
        only: {
          handler: vi.fn().mockImplementation((ctx) => {
            calls.push(key);
            if (opts?.exitAll) ctx.exitAll();
          }),
        },
      },
    });

    const flows = {
      f1: mkFlow('f1', 1, { exitAll: true }),
      f2: mkFlow('f2', 2),
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-seq', flows);

    await engine.executor.dispatchEvent(model, 'seq', {}, { sequential: true });

    // f1 executed then exitAll stops f2
    expect(calls).toEqual(['f1']);
  });

  it("dispatchEvent('beforeRender') caches results (key includes eventName) when options specify", async () => {
    const handler = vi.fn().mockResolvedValue('ok');
    const flows = {
      f1: { steps: { s: { handler } } },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;
    const model = createModelWithFlows('m-br', flows);

    await engine.executor.dispatchEvent(model, 'beforeRender', undefined, { sequential: true, useCache: true });
    await engine.executor.dispatchEvent(model, 'beforeRender', undefined, { sequential: true, useCache: true });

    // handler only executed once because of cache
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("dispatchEvent('beforeRender') rejects when a step throws", async () => {
    const handler = vi.fn().mockImplementation(() => {
      throw new Error('boom-br');
    });
    const flows = {
      bad: { steps: { s: { handler } } },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-br-reject', flows);

    await expect(engine.executor.dispatchEvent(model, 'beforeRender', undefined, { sequential: true })).rejects.toThrow(
      'boom-br',
    );
  });

  it('instance flow overrides global flow with same key', async () => {
    class MyModel extends FlowModel {}

    // register a global flow on MyModel
    MyModel.registerFlow('sameKey', {
      title: 'Global Flow',
      steps: {
        s: { handler: vi.fn().mockResolvedValue('global') },
      },
    });

    // create instance with same key overriding
    const instanceHandler = vi.fn().mockResolvedValue('instance');
    const model = new MyModel({
      uid: 'm-combined',
      flowEngine: engine,
      flowRegistry: {
        sameKey: { steps: { s: { handler: instanceHandler } } },
      },
      stepParams: {},
      subModels: {},
    } as FlowModelOptions);

    const result = await engine.executor.runFlow(model, 'sameKey');
    expect(instanceHandler).toHaveBeenCalledTimes(1);
    expect(result.s).toBe('instance');
  });
});
