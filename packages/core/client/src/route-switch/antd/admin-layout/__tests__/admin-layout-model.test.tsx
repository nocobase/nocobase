/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observable } from '@formily/reactive';
import { act, render, waitFor } from '@testing-library/react';
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
import { AdminLayout } from '..';
import { AdminLayoutModel } from '../AdminLayoutModel';

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

  it('should expose live engine currentRoute when active page changes', async () => {
    const engine = new FlowEngine();
    const routeRef = observable.ref({
      params: { name: 'page-1' },
      pathname: '/admin/page-1',
    });
    engine.context.defineProperty('route', {
      get: () => routeRef.value,
      cache: false,
    });

    render(
      <FlowEngineProvider engine={engine}>
        <AdminLayout />
      </FlowEngineProvider>,
    );

    const model = engine.getModel<AdminLayoutModel>('admin-layout-model');
    expect(model).toBeTruthy();

    model.registerRoutePage('page-1', {
      active: true,
      currentRoute: { title: 'Page 1' },
    });
    model.registerRoutePage('page-2', {
      active: true,
      currentRoute: { title: 'Page 2' },
    });

    await waitFor(() => {
      expect(engine.context.currentRoute.title).toBe('Page 1');
    });

    act(() => {
      routeRef.value = {
        params: { name: 'page-2' },
        pathname: '/admin/page-2',
      };
    });

    await waitFor(() => {
      expect(engine.context.currentRoute.title).toBe('Page 2');
    });
  });
});
