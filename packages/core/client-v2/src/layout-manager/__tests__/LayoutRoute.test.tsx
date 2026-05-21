/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BaseLayoutModel } from '../../flow/admin-shell/BaseLayoutModel';
import { LayoutContentRoute } from '../LayoutContentRoute';
import { LayoutRoute } from '../LayoutRoute';
import type { LayoutDefinition } from '../types';
import {
  getLayoutPageRouteName,
  getLayoutPageTabRouteName,
  getLayoutPageTabViewRouteName,
  getLayoutPageViewRouteName,
} from '../utils';

class TestLayoutModel extends BaseLayoutModel {
  render() {
    return <div data-testid="layout-route">{this.layout.routeName}</div>;
  }
}

const layout: LayoutDefinition = {
  routeName: 'test',
  routePath: '/test',
  rootRouteName: 'test',
  uid: 'test-layout-model',
  layoutModelClass: 'TestLayoutModel',
  rootPageModelClass: 'TestRootPageModel',
  childPageModelClass: 'TestChildPageModel',
  authCheck: true,
};

describe('LayoutRoute', () => {
  it('creates layout model from registered string class and injects layout definition', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TestLayoutModel });
    engine.context.defineProperty('app', {
      value: {
        layoutManager: {
          getLayout: () => layout,
        },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <LayoutRoute layoutRouteName="test" />
      </FlowEngineProvider>,
    );

    expect(await screen.findByTestId('layout-route')).toHaveTextContent('test');
    const model = engine.getModel<TestLayoutModel>('test-layout-model');
    expect(model).toBeInstanceOf(TestLayoutModel);
    expect(model.layout).toMatchObject({
      routeName: 'test',
      routePath: '/test',
      rootRouteName: 'test',
      rootPageModelClass: 'TestRootPageModel',
      childPageModelClass: 'TestChildPageModel',
    });
  });
});

describe('LayoutContentRoute', () => {
  function setup(initialEntry: string, currentLayout: LayoutDefinition = layout) {
    const engine = new FlowEngine();
    engine.registerModels({ TestLayoutModel });
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: () => Promise.resolve(),
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: () => Promise.resolve(),
        getRouteBySchemaUid: () => ({ type: 'flowPage', schemaUid: 'page-1' }),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/',
        layoutManager: {
          getLayout: () => currentLayout,
        },
        router: {
          getBasename: () => '',
        },
      },
    });
    const model = engine.createModel<TestLayoutModel>({
      uid: layout.uid,
      use: TestLayoutModel,
      props: {
        layout: currentLayout,
      },
    });
    const layoutRoute = {
      id: currentLayout.routeName,
      path: currentLayout.routePath,
      element: <Outlet />,
      children: [
        {
          id: getLayoutPageRouteName(currentLayout.routeName),
          path: ':name',
          element: <LayoutContentRoute layoutRouteName={currentLayout.routeName} />,
        },
        {
          id: getLayoutPageTabRouteName(currentLayout.routeName),
          path: ':name/tab/:tabUid',
          element: <LayoutContentRoute layoutRouteName={currentLayout.routeName} />,
        },
        {
          id: getLayoutPageViewRouteName(currentLayout.routeName),
          path: ':name/view/*',
          element: <LayoutContentRoute layoutRouteName={currentLayout.routeName} />,
        },
        {
          id: getLayoutPageTabViewRouteName(currentLayout.routeName),
          path: ':name/tab/:tabUid/view/*',
          element: <LayoutContentRoute layoutRouteName={currentLayout.routeName} />,
        },
      ],
    };
    const routes = currentLayout.routeName.includes('.')
      ? [
          {
            id: 'admin.settings',
            path: '/admin/settings',
            element: <Outlet />,
            children: [layoutRoute],
          },
        ]
      : [layoutRoute];
    const router = createMemoryRouter(routes, {
      initialEntries: [initialEntry],
    });

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    return { model };
  }

  it('parses page route from standard layout route', async () => {
    const { model } = setup('/test/page-1/tab/tab-1/view/popup');

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'page',
        basePathname: '/test',
        pageUid: 'page-1',
        tabUid: 'tab-1',
        viewStack: [{ viewUid: 'page-1', tabUid: 'tab-1' }, { viewUid: 'popup' }],
      });
    });
  });

  it('parses nested layout route by matched layout pathname', async () => {
    const nestedLayout: LayoutDefinition = {
      ...layout,
      routeName: 'admin.settings.publicForms',
      routePath: 'public-forms',
      rootRouteName: 'admin',
    };
    const { model } = setup('/admin/settings/public-forms/form-1/view/popup', nestedLayout);

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'page',
        basePathname: '/admin/settings/public-forms',
        pageUid: 'form-1',
        viewStack: [{ viewUid: 'form-1' }, { viewUid: 'popup' }],
      });
    });
  });
});
