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

    // Check if dispatchEvent was called with useCache: true
    // useApplyAutoFlows calls dispatchEvent('beforeRender', inputArgs, { useCache })
    await waitFor(() => {
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
});
