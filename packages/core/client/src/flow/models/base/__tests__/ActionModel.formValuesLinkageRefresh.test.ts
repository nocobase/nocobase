/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { ActionModel } from '../ActionModel';

describe('ActionModel formValues-driven linkage refresh', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setupAction(linkageRules: any, contextValues: any = {}) {
    vi.useFakeTimers();

    const engine = new FlowEngine();
    class TestBlockModel extends FlowModel {
      render() {
        return null;
      }
    }
    engine.registerModels({ ActionModel, TestBlockModel });
    const blockModel = engine.createModel<TestBlockModel>({ use: 'TestBlockModel', uid: 'form-block' });
    const action = engine.createModel<ActionModel>({
      use: 'ActionModel',
      uid: 'action-1',
      stepParams: {
        buttonSettings: {
          linkageRules,
        },
      },
    });
    action.context.defineProperty('blockModel', { value: blockModel });
    for (const [key, value] of Object.entries(contextValues)) {
      action.context.defineProperty(key, { value });
    }
    const dispatchSpy = vi.spyOn(action, 'dispatchEvent').mockResolvedValue([] as any);

    (action as any).onMount();

    return { action, blockModel, dispatchSpy };
  }

  it('refreshes action linkage rules when a referenced form field changes', async () => {
    const { blockModel, dispatchSpy } = setupAction({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'open' }],
          },
          actions: [],
        },
      ],
    });

    blockModel.emitter.emit('formValuesChange', {
      changedPaths: [['status']],
    });
    await vi.runOnlyPendingTimersAsync();

    expect(dispatchSpy).toHaveBeenCalledWith(
      'formValuesChange',
      expect.objectContaining({ changedPaths: [['status']] }),
      expect.not.objectContaining({ debounce: true }),
    );
  });

  it('does not refresh action linkage rules when unrelated fields change', async () => {
    const { blockModel, dispatchSpy } = setupAction({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'open' }],
          },
          actions: [],
        },
      ],
    });

    blockModel.emitter.emit('formValuesChange', {
      changedPaths: [['title']],
    });
    await vi.runOnlyPendingTimersAsync();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('keeps hidden actions refreshable after hidden unmount', async () => {
    const { action, blockModel, dispatchSpy } = setupAction({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'open' }],
          },
          actions: [],
        },
      ],
    });
    action.hidden = true;
    (action as any).onUnmount();

    blockModel.emitter.emit('formValuesChange', {
      changedPaths: [['status']],
    });
    await vi.runOnlyPendingTimersAsync();

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('cleans up after visible unmount', async () => {
    const { action, blockModel, dispatchSpy } = setupAction({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'open' }],
          },
          actions: [],
        },
      ],
    });
    (action as any).onUnmount();

    blockModel.emitter.emit('formValuesChange', {
      changedPaths: [['status']],
    });
    await vi.runOnlyPendingTimersAsync();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('cleans up after ACL-hidden unmount', async () => {
    const { action, blockModel, dispatchSpy } = setupAction({
      value: [
        {
          enable: true,
          condition: {
            logic: '$and',
            items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'open' }],
          },
          actions: [],
        },
      ],
    });
    action.hidden = true;
    (action as any).forbidden = { actionName: 'view' };
    (action as any).onUnmount();

    blockModel.emitter.emit('formValuesChange', {
      changedPaths: [['status']],
    });
    await vi.runOnlyPendingTimersAsync();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('matches ctx.item dependencies using action fieldIndex context', async () => {
    const { blockModel, dispatchSpy } = setupAction(
      {
        value: [
          {
            enable: true,
            condition: {
              logic: '$and',
              items: [{ path: '{{ ctx.item.value.nickname }}', operator: '$eq', value: 'A' }],
            },
            actions: [],
          },
        ],
      },
      { fieldIndex: ['roles:1'] },
    );

    blockModel.emitter.emit('formValuesChange', {
      changedPaths: [['roles', 0, 'nickname']],
    });
    await vi.runOnlyPendingTimersAsync();
    expect(dispatchSpy).not.toHaveBeenCalled();

    blockModel.emitter.emit('formValuesChange', {
      changedPaths: [['roles', 1, 'nickname']],
    });
    await vi.runOnlyPendingTimersAsync();
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });
});
