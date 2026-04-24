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

import {
  FlowEngine,
  FlowEngineProvider,
  FlowModelRenderer,
  useFlowEngine,
  type FlowModel,
} from '@nocobase/flow-engine';
import { AdminLayoutModel, getAdminLayoutModel } from '..';
import { TopbarActionModel } from '../../../models/topbar/TopbarActionModel';
import { UserCenterTopbarActionModel } from '../../../models/topbar/UserCenterTopbarActionModel';
import { TopbarActionsBar } from '../TopbarActionsBar';

class TestAdminLayoutModel extends AdminLayoutModel {
  render() {
    return null;
  }
}

class TestTopbarActionModelA extends TopbarActionModel {
  sort = 20;
  actionId = 'test-topbar-a';
}

class TestTopbarActionModelB extends TopbarActionModel {
  sort = 10;
  actionId = 'test-topbar-b';
}

const TestAdminLayoutHost = (props) => {
  const flowEngine = useFlowEngine();
  const model = getAdminLayoutModel<TestAdminLayoutModel>(flowEngine, {
    create: true,
    props,
    use: TestAdminLayoutModel,
  });

  if (!model) {
    throw new Error('[NocoBase] Failed to create test admin-layout-model.');
  }

  return <FlowModelRenderer model={model} />;
};

describe('AdminLayoutModel runtime', () => {
  beforeEach(() => {
    flowModelRendererSpy.mockClear();
  });

  it('should create model via getAdminLayoutModel and update props on rerender', async () => {
    const engine = new FlowEngine();
    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <TestAdminLayoutHost testFlag="v1" />
      </FlowEngineProvider>,
    );

    const model = engine.getModel<TestAdminLayoutModel>('admin-layout-model');
    expect(model).toBeInstanceOf(TestAdminLayoutModel);
    expect(model.props.testFlag).toBe('v1');

    rerender(
      <FlowEngineProvider engine={engine}>
        <TestAdminLayoutHost testFlag="v2" />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(model.props.testFlag).toBe('v2');
    });
  });

  it('should throw when required model is missing', () => {
    const engine = new FlowEngine();
    expect(() => {
      getAdminLayoutModel(engine, { required: true });
    }).toThrowError(/admin-layout-model/);
  });

  it('should expose live layoutContentElement on engine context', async () => {
    const engine = new FlowEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <TestAdminLayoutHost />
      </FlowEngineProvider>,
    );

    const model = engine.getModel<TestAdminLayoutModel>('admin-layout-model');
    expect(model).toBeTruthy();

    const element = document.createElement('div');

    act(() => {
      model.setLayoutContentElement(element);
    });

    expect(engine.context.layoutContentElement).toBe(element);

    act(() => {
      model.setLayoutContentElement(null);
    });

    expect(engine.context.layoutContentElement).toBeNull();
  });

  it('should expose live engine currentRoute when active page changes', async () => {
    const engine = new FlowEngine();
    const routeMap = {
      'page-1': { title: 'Page 1' },
      'page-2': { title: 'Page 2' },
    };
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: (pageUid: string) => routeMap[pageUid],
      },
    });
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
        <TestAdminLayoutHost />
      </FlowEngineProvider>,
    );

    const model = engine.getModel<TestAdminLayoutModel>('admin-layout-model');
    expect(model).toBeTruthy();

    model.registerRoutePage('page-1', {
      active: true,
    });
    model.registerRoutePage('page-2', {
      active: true,
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

  it('should keep pageActive in sync after non-active route page updates', async () => {
    const engine = new FlowEngine();
    const routeRef = observable.ref({
      params: { name: 'page-1' },
      pathname: '/admin/page-1',
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: (pageUid: string) => ({ title: pageUid }),
      },
    });
    engine.context.defineProperty('route', {
      get: () => routeRef.value,
      cache: false,
    });

    render(
      <FlowEngineProvider engine={engine}>
        <TestAdminLayoutHost />
      </FlowEngineProvider>,
    );

    const model = engine.getModel<TestAdminLayoutModel>('admin-layout-model');
    expect(model).toBeTruthy();

    model.registerRoutePage('page-1', {
      active: false,
    });

    const routeModel = engine.getModel<FlowModel>('page-1');

    await waitFor(() => {
      expect(routeModel.context.pageActive.value).toBe(true);
    });

    act(() => {
      model.updateRoutePage('page-1', {
        refreshDesktopRoutes: vi.fn(),
      });
    });

    expect(routeModel.context.pageActive.value).toBe(true);

    act(() => {
      routeRef.value = {
        params: { name: 'page-2' },
        pathname: '/admin/page-2',
      };
    });

    await waitFor(() => {
      expect(routeModel.context.pageActive.value).toBe(false);
    });
  });

  it('should expose unified TopbarActionsBar through actionsRender', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      TopbarActionModel,
      TestTopbarActionModelA,
      TestTopbarActionModelB,
      UserCenterTopbarActionModel,
    });

    render(
      <FlowEngineProvider engine={engine}>
        <TestAdminLayoutHost />
      </FlowEngineProvider>,
    );

    const model = engine.getModel<TestAdminLayoutModel>('admin-layout-model');
    expect(model).toBeTruthy();

    await act(async () => {
      await model.dispatchEvent('beforeRender', undefined, { useCache: false });
    });

    expect(typeof model.props.actionsRender).toBe('function');

    const rendered = model.props.actionsRender({ isMobile: false });
    expect(rendered).toHaveLength(1);
    expect(rendered[0].type).toBe(TopbarActionsBar);
    expect(rendered[0].props.isMobile).toBe(false);
    expect(rendered[0].props.actions.map((action) => action.uid)).toEqual([
      'topbar-action-TestTopbarActionModelA',
      'topbar-action-TestTopbarActionModelB',
      'topbar-action-UserCenterTopbarActionModel',
    ]);
  });
});
