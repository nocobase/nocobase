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

  it('runAutoFlows executes only auto flows in sort order and caches result', async () => {
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

    const r1 = await engine.executor.runAutoFlows(model);
    expect(r1).toHaveLength(2);
    // sort order: f1 then f2
    expect(calls).toEqual(['f1', 'f2']);

    // second run should hit cache and not execute handlers again
    const prevCount = calls.length;
    const r2 = await engine.executor.runAutoFlows(model);
    expect(r2).toEqual(r1);
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
