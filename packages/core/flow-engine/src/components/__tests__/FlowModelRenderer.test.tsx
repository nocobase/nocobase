/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';
import { FlowEngineProvider } from '../../provider';
import { FlowModelRenderer } from '../FlowModelRenderer';

describe('FlowModelRenderer', () => {
  let flowEngine: FlowEngine;
  let model: FlowModel;

  beforeEach(() => {
    flowEngine = new FlowEngine();
    model = new FlowModel({
      uid: 'test-model',
      flowEngine,
    });
    // Mock dispatchEvent to track calls
    model.dispatchEvent = vi.fn().mockResolvedValue([]);
    // Mock render to return something
    model.render = vi.fn().mockReturnValue(<div>Model Content</div>);
  });

  const renderWithProvider = (ui: React.ReactNode) => {
    return render(<FlowEngineProvider engine={flowEngine}>{ui}</FlowEngineProvider>);
  };

  test('should pass useCache to useApplyAutoFlows and set it on context', async () => {
    const { unmount } = renderWithProvider(<FlowModelRenderer model={model} useCache={true} />);

    await waitFor(() => {
      expect(model.dispatchEvent).toHaveBeenCalledTimes(1);
      expect(model.dispatchEvent).toHaveBeenCalledWith(
        'beforeRender',
        undefined,
        expect.objectContaining({ useCache: true }),
      );
    });

    // Check if useCache is set on context
    expect(model.context.useCache).toBe(true);

    unmount();
  });

  test('should pass useCache=false to useApplyAutoFlows and set it on context', async () => {
    const { unmount } = renderWithProvider(<FlowModelRenderer model={model} useCache={false} />);

    await waitFor(() => {
      expect(model.dispatchEvent).toHaveBeenCalledTimes(1);
      expect(model.dispatchEvent).toHaveBeenCalledWith(
        'beforeRender',
        undefined,
        expect.objectContaining({ useCache: false }),
      );
    });

    expect(model.context.useCache).toBe(false);

    unmount();
  });

  test('should not pass useCache if not provided', async () => {
    const { unmount } = renderWithProvider(<FlowModelRenderer model={model} />);

    await waitFor(() => {
      expect(model.dispatchEvent).toHaveBeenCalledTimes(1);
      expect(model.dispatchEvent).toHaveBeenCalledWith(
        'beforeRender',
        undefined,
        expect.objectContaining({ useCache: undefined }),
      );
    });

    // context.useCache should be undefined (or default)
    expect(model.context.useCache).toBeUndefined();

    unmount();
  });

  test('should clear stale beforeRender state after unmount when reusing the same model', async () => {
    const statefulEngine = new FlowEngine();
    const onMountSpy = vi.fn();
    const onUnmountSpy = vi.fn();

    class StatefulModel extends FlowModel {
      render(): any {
        return <div>Stateful Content</div>;
      }

      protected onMount(): void {
        onMountSpy();
      }

      protected onUnmount(): void {
        onUnmountSpy();
      }
    }

    const statefulModel = new StatefulModel({
      uid: 'stateful-model',
      flowEngine: statefulEngine,
    });
    const executorSpy = vi.spyOn((statefulEngine as any).executor, 'dispatchEvent').mockResolvedValue([]);

    const firstRender = renderWithProvider(<FlowModelRenderer model={statefulModel} />);
    await waitFor(() => {
      expect(executorSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onMountSpy).toHaveBeenCalledTimes(1);
    });

    firstRender.unmount();
    await waitFor(() => {
      expect(onUnmountSpy).toHaveBeenCalledTimes(1);
    });

    executorSpy.mockClear();
    statefulModel.setStepParams('anyFlow', 'anyStep', { x: 1 });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(executorSpy.mock.calls.length).toBe(0);

    const secondRender = renderWithProvider(<FlowModelRenderer model={statefulModel} />);
    await waitFor(() => {
      expect(executorSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onMountSpy).toHaveBeenCalledTimes(2);
    });
    const [target, eventName, inputArgs, options] = executorSpy.mock.calls[0];
    expect(target).toBe(statefulModel);
    expect(eventName).toBe('beforeRender');
    expect(inputArgs).toBeUndefined();
    expect(options).toMatchObject({ useCache: true });

    secondRender.unmount();
    await waitFor(() => {
      expect(onUnmountSpy).toHaveBeenCalledTimes(2);
    });
  });
});
