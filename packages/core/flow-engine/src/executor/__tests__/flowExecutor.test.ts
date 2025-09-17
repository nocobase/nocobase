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

  it('dispatchEvent respects filter group conditions', async () => {
    const matchedHandler = vi.fn().mockResolvedValue('matched');
    const skippedHandler = vi.fn().mockResolvedValue('skipped');

    const flows = {
      shouldRun: {
        on: {
          eventName: 'click',
          condition: {
            logic: '$and',
            items: [
              {
                path: '{{ ctx.model.props.status }}',
                operator: '$eq',
                value: 'active',
              },
            ],
          },
        },
        steps: { step: { handler: matchedHandler } },
      },
      shouldSkip: {
        on: {
          eventName: 'click',
          condition: {
            logic: '$and',
            items: [
              {
                path: '{{ ctx.model.props.status }}',
                operator: '$eq',
                value: 'inactive',
              },
            ],
          },
        },
        steps: { step: { handler: skippedHandler } },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = new FlowModel({
      uid: 'm-conditional',
      flowEngine: engine,
      props: { status: 'active' },
      stepParams: {},
      subModels: {},
      flowRegistry: flows,
    } as FlowModelOptions);

    // 提供最小 jsonLogic 实现，确保条件可计算
    model.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply(logic: any) {
            const op = Object.keys(logic)[0];
            const values = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
            const [a, b] = values;
            switch (op) {
              case '$eq':
                return a === b;
              default:
                return false;
            }
          },
        },
      },
    });

    await engine.executor.dispatchEvent(model, 'click');

    expect(matchedHandler).toHaveBeenCalledTimes(1);
    expect(skippedHandler).not.toHaveBeenCalled();
  });

  it('dispatchEvent supports function conditions', async () => {
    const handler = vi.fn().mockResolvedValue('fn-matched');
    const conditionFn = vi.fn().mockReturnValue(true);

    const flows = {
      fnFlow: {
        on: {
          eventName: 'click',
          condition: conditionFn,
        },
        steps: { step: { handler } },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-function', flows);

    await engine.executor.dispatchEvent(model, 'click');

    expect(conditionFn).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('dispatchEvent evaluates nested groups and $or checks', async () => {
    const matchedHandler = vi.fn().mockResolvedValue('nested-ok');
    const fallbackHandler = vi.fn().mockResolvedValue('fallback');

    const flows = {
      nestedMatch: {
        on: {
          eventName: 'click',
          condition: {
            logic: '$or',
            items: [
              {
                path: '{{ ctx.event.args.type }}',
                operator: '$eq',
                value: 'primary',
              },
              {
                logic: '$and',
                items: [
                  {
                    path: '{{ ctx.model.props.role }}',
                    operator: '$eq',
                    value: 'admin',
                  },
                  {
                    path: '{{ ctx.model.props.count }}',
                    operator: '$gt',
                    value: 10,
                  },
                ],
              },
            ],
          },
        },
        steps: { step: { handler: matchedHandler } },
      },
      nestedSkip: {
        on: {
          eventName: 'click',
          condition: {
            logic: '$and',
            items: [
              {
                path: '{{ ctx.event.args.type }}',
                operator: '$eq',
                value: 'secondary',
              },
            ],
          },
        },
        steps: { step: { handler: fallbackHandler } },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = new FlowModel({
      uid: 'm-nested',
      flowEngine: engine,
      props: { role: 'member', count: 5 },
      stepParams: {},
      subModels: {},
      flowRegistry: flows,
    } as FlowModelOptions);

    model.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply(logic: any) {
            const op = Object.keys(logic)[0];
            const values = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
            const [a, b] = values;
            switch (op) {
              case '$eq':
                return a === b;
              case '$gt':
                return a > b;
              default:
                return false;
            }
          },
        },
      },
    });

    await engine.executor.dispatchEvent(model, 'click', { type: 'primary' });

    expect(matchedHandler).toHaveBeenCalledTimes(1);
    expect(fallbackHandler).not.toHaveBeenCalled();
  });

  it('dispatchEvent handles unary operators like $notEmpty', async () => {
    const handler = vi.fn().mockResolvedValue('not-empty');

    const flows = {
      nonEmptyTags: {
        on: {
          eventName: 'click',
          condition: {
            logic: '$and',
            items: [
              {
                path: '{{ ctx.model.props.tags }}',
                operator: '$notEmpty',
                value: '',
              },
            ],
          },
        },
        steps: { step: { handler } },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = new FlowModel({
      uid: 'm-unary',
      flowEngine: engine,
      props: { tags: ['a', 'b'] },
      stepParams: {},
      subModels: {},
      flowRegistry: flows,
    } as FlowModelOptions);

    model.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply(logic: any) {
            const op = Object.keys(logic)[0];
            const values = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
            const [a] = values;
            switch (op) {
              case '$notEmpty':
                return Array.isArray(a) ? a.length > 0 : !!a;
              default:
                return false;
            }
          },
        },
      },
    });

    await engine.executor.dispatchEvent(model, 'click');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('dispatchEvent skips flows when condition evaluates to false', async () => {
    const handler = vi.fn().mockResolvedValue('should-not-run');

    const flows = {
      invalidCondition: {
        on: {
          eventName: 'click',
          condition: {
            logic: '$and',
            items: [
              {
                path: '{{ ctx.event.args.type }}',
                operator: '$eq',
                value: 'never',
              },
            ],
          },
        },
        steps: { step: { handler } },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-invalid', flows);

    // 注入最小 jsonLogic，确保 $eq 可用
    model.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply(logic: any) {
            const op = Object.keys(logic)[0];
            const values = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
            const [a, b] = values;
            switch (op) {
              case '$eq':
                return a === b;
              default:
                return false;
            }
          },
        },
      },
    });

    await engine.executor.dispatchEvent(model, 'click');

    expect(handler).not.toHaveBeenCalled();
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
