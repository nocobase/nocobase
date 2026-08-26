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
      React.useEffect(() => {
        props.model?.onMount?.();
        return () => {
          props.model?.onUnmount?.();
        };
      }, [props.model]);
      return <div data-testid="flow-model-renderer" />;
    },
  };
});

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { AdminLayout, AdminLayoutPlugin } from '..';
import { AdminLayoutModel as FlowAdminLayoutModel } from '@nocobase/client-v2';
import { AdminLayoutModelV1 } from '../AdminLayoutModel';
import { AdminLayoutMenuItemModel } from '../AdminLayoutMenuModels';

describe('AdminLayout legacy wrapper', () => {
  beforeEach(() => {
    flowModelRendererSpy.mockClear();
  });

  it('should create AdminLayoutModelV1 and pass it to FlowModelRenderer', async () => {
    const engine = new FlowEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <AdminLayout testFlag="first-render" />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(flowModelRendererSpy).toHaveBeenCalled();
    });

    const model = engine.getModel<AdminLayoutModelV1>('admin-layout-model');
    expect(model).toBeInstanceOf(AdminLayoutModelV1);
    expect(model).toBeInstanceOf(FlowAdminLayoutModel);
    expect(model.props.testFlag).toBe('first-render');
    expect((model.subModels as any).menu).toBeUndefined();
    expect((model.subModels as any).layoutContent).toBeUndefined();
    expect((model.subModels as any).headerActions).toBeUndefined();
    expect(flowModelRendererSpy).toHaveBeenLastCalledWith(expect.objectContaining({ model }));
  });

  it('should reuse existing AdminLayoutModelV1 instance', async () => {
    const engine = new FlowEngine();
    const existingModel = engine.createModel<AdminLayoutModelV1>({
      uid: 'admin-layout-model',
      use: AdminLayoutModelV1,
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

    const model = engine.getModel<AdminLayoutModelV1>('admin-layout-model');
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

  it('should register AdminLayoutModel key with AdminLayoutModelV1 class', async () => {
    const registerModels = vi.fn();
    const schemaSettingsAdd = vi.fn();
    const addComponents = vi.fn();
    const use = vi.fn();
    const plugin = new AdminLayoutPlugin({}, {
      flowEngine: {
        registerModels,
      },
      schemaSettingsManager: {
        add: schemaSettingsAdd,
      },
      addComponents,
      use,
    } as any);

    await plugin.load();

    expect(registerModels).toHaveBeenCalledWith(
      expect.objectContaining({
        AdminLayoutModel: AdminLayoutModelV1,
        AdminLayoutMenuItemModel,
      }),
    );
  });
});
