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
import { AdminSettingsLayoutModel } from '../AdminSettingsLayoutModel';
import { AdminSettingsLayout } from '../PluginSetting';

describe('AdminSettingsLayout (model host)', () => {
  beforeEach(() => {
    flowModelRendererSpy.mockClear();
  });

  it('should create AdminSettingsLayoutModel and pass it to FlowModelRenderer', async () => {
    const engine = new FlowEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <AdminSettingsLayout testFlag="first-render" />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(flowModelRendererSpy).toHaveBeenCalled();
    });

    const model = engine.getModel<AdminSettingsLayoutModel>('admin-settings-layout-model');
    expect(model).toBeInstanceOf(AdminSettingsLayoutModel);
    expect(model.props.testFlag).toBe('first-render');
    expect(flowModelRendererSpy).toHaveBeenLastCalledWith(expect.objectContaining({ model }));
  });

  it('should reuse existing AdminSettingsLayoutModel instance', async () => {
    const engine = new FlowEngine();
    const existingModel = engine.createModel<AdminSettingsLayoutModel>({
      uid: 'admin-settings-layout-model',
      use: AdminSettingsLayoutModel,
      props: { testFlag: 'existing' },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <AdminSettingsLayout testFlag="reused-model" />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(existingModel.props.testFlag).toBe('reused-model');
    });

    expect(engine.getModel('admin-settings-layout-model')).toBe(existingModel);
    expect(flowModelRendererSpy).toHaveBeenLastCalledWith(expect.objectContaining({ model: existingModel }));
  });

  it('should update model props on rerender', async () => {
    const engine = new FlowEngine();
    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <AdminSettingsLayout testFlag="v1" />
      </FlowEngineProvider>,
    );

    const model = engine.getModel<AdminSettingsLayoutModel>('admin-settings-layout-model');
    expect(model).toBeTruthy();

    rerender(
      <FlowEngineProvider engine={engine}>
        <AdminSettingsLayout testFlag="v2" />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(model.props.testFlag).toBe('v2');
    });
  });
});
