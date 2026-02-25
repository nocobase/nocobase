/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { flowModelRendererSpy } = vi.hoisted(() => {
  return {
    flowModelRendererSpy: vi.fn(),
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    FlowModelRenderer: (props: any) => {
      flowModelRendererSpy(props);
      return <div data-testid="flow-model-renderer" />;
    },
  };
});

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { AdminLayout, AdminLayoutModel } from '..';

describe('AdminLayout (phase-1 host)', () => {
  beforeEach(() => {
    flowModelRendererSpy.mockClear();
  });

  it('should create AdminLayoutModel and pass it to FlowModelRenderer', async () => {
    const engine = new FlowEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <AdminLayout testFlag="first-render" />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(flowModelRendererSpy).toHaveBeenCalled();
    });

    const model = engine.getModel<AdminLayoutModel>('admin-layout-model');
    expect(model).toBeInstanceOf(AdminLayoutModel);
    expect(model.props.testFlag).toBe('first-render');
    expect(flowModelRendererSpy).toHaveBeenLastCalledWith(expect.objectContaining({ model }));
  });

  it('should reuse existing AdminLayoutModel instance', async () => {
    const engine = new FlowEngine();
    const existingModel = engine.createModel<AdminLayoutModel>({
      uid: 'admin-layout-model',
      use: AdminLayoutModel,
      props: { testFlag: 'existing' },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <AdminLayout testFlag="reused-model" />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(existingModel.props.testFlag).toBe('reused-model');
    });

    expect(engine.getModel('admin-layout-model')).toBe(existingModel);
    expect(flowModelRendererSpy).toHaveBeenLastCalledWith(expect.objectContaining({ model: existingModel }));
  });

  it('should update model props on rerender', async () => {
    const engine = new FlowEngine();
    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <AdminLayout testFlag="v1" />
      </FlowEngineProvider>,
    );

    const model = engine.getModel<AdminLayoutModel>('admin-layout-model');
    expect(model).toBeTruthy();

    rerender(
      <FlowEngineProvider engine={engine}>
        <AdminLayout testFlag="v2" />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(model.props.testFlag).toBe('v2');
    });
  });
});
