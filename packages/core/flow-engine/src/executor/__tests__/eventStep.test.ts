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

describe('FlowExecutor - event step integration', () => {
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

  it('executes event step first and can exit subsequent steps', async () => {
    // Register an event with a handler that exits when allow=false
    const eventHandler = vi.fn().mockImplementation((ctx, params: any) => {
      if (params?.allow === false) ctx.exit();
    });
    engine.registerEvents({
      click: {
        name: 'click',
        title: 'Click',
        handler: eventHandler,
      },
    });

    const nextStepHandler = vi.fn();

    const flows = {
      blocked: {
        on: { eventName: 'click', defaultParams: { allow: false } },
        steps: {
          next: { handler: nextStepHandler },
        },
      },
      allowed: {
        on: { eventName: 'click', defaultParams: { allow: true } },
        steps: {
          next: { handler: nextStepHandler },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-events', flows);

    // When allow=false, event step exits and subsequent steps should not run
    await engine.executor.dispatchEvent(model, 'click');
    expect(eventHandler).toHaveBeenCalled();
    // Both flows fire, but only the second one should run next step
    // nextStepHandler should be called exactly once for the 'allowed' flow
    expect(nextStepHandler).toHaveBeenCalledTimes(1);
  });

  it('merges on.defaultParams with event defaultParams (event takes precedence on conflicts)', async () => {
    const receivedParams: any[] = [];
    const eventHandler = vi.fn().mockImplementation((_ctx, params) => {
      receivedParams.push(params);
    });
    engine.registerEvents({
      click: {
        name: 'click',
        title: 'Click',
        defaultParams: { a: 1, b: 2 },
        handler: eventHandler,
      },
    });

    const flows = {
      f1: {
        on: { eventName: 'click', defaultParams: { b: 99, c: 3 } },
        steps: {
          after: { handler: vi.fn() },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-merge', flows);
    await engine.executor.runFlow(model, 'f1');

    expect(eventHandler).toHaveBeenCalledTimes(1);
    // event defaultParams override flow.on.defaultParams on same keys
    expect(receivedParams[0]).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('event step runs before ordinary steps', async () => {
    const calls: string[] = [];
    const eventHandler = vi.fn().mockImplementation(() => {
      calls.push('event');
    });
    const nextHandler = vi.fn().mockImplementation(() => {
      calls.push('next');
    });

    engine.registerEvents({
      click: { name: 'click', title: 'Click', handler: eventHandler },
    });

    const flows = {
      f: {
        on: { eventName: 'click' },
        steps: {
          next: { handler: nextHandler },
        },
      },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-order', flows);
    await engine.executor.runFlow(model, 'f');

    expect(eventHandler).toHaveBeenCalledTimes(1);
    expect(nextHandler).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['event', 'next']);
  });

  it('dispatchEvent triggers only flows that match event name', async () => {
    const clickHandler = vi.fn();
    const submitHandler = vi.fn();

    engine.registerEvents({
      click: { name: 'click', title: 'Click', handler: clickHandler },
      submit: { name: 'submit', title: 'Submit', handler: submitHandler },
    });

    const flows = {
      onClick: { on: { eventName: 'click' }, steps: { s: { handler: vi.fn() } } },
      onSubmit: { on: { eventName: 'submit' }, steps: { s: { handler: vi.fn() } } },
    } satisfies Record<string, Omit<FlowDefinitionOptions, 'key'>>;

    const model = createModelWithFlows('m-dispatch', flows);

    await engine.executor.dispatchEvent(model, 'click');

    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).not.toHaveBeenCalled();
  });
});
