/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider, observer } from '@nocobase/flow-engine';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createMemoryRouter, Outlet, RouterProvider, useOutlet } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
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

const GatedLayoutComponent = observer((props: { model: BaseLayoutModel }) => {
  const { model } = props;
  const outlet = useOutlet();
  const pageUid = model.getPageUidFromLayoutRoute(model.currentLayoutRoute);

  if (!pageUid) {
    return <div data-testid="layout-page-uid">missing</div>;
  }

  return (
    <div>
      <div data-testid="layout-page-uid">{pageUid}</div>
      {outlet}
    </div>
  );
});

class GatedLayoutModel extends BaseLayoutModel {
  render() {
    return <GatedLayoutComponent model={this} />;
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

const sessionStorageScopedLayout: LayoutDefinition = {
  ...layout,
  storageScope: {
    storageType: 'sessionStorage',
    prefix: 'PUBLIC_FORM',
  },
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

    const router = createMemoryRouter(
      [
        {
          id: layout.routeName,
          path: layout.routePath,
          element: <LayoutRoute layoutRouteName="test" />,
        },
      ],
      {
        initialEntries: ['/test'],
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
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

  it('does not activate desktop route loading for generic layouts', async () => {
    const activateLayout = vi.fn(() => vi.fn());
    const engine = new FlowEngine();
    engine.registerModels({ TestLayoutModel });
    engine.context.defineProperty('routeRepository', {
      value: {
        activateLayout,
      },
    });
    engine.context.defineProperty('app', {
      value: {
        layoutManager: {
          getLayout: () => layout,
        },
      },
    });

    const router = createMemoryRouter(
      [
        {
          id: layout.routeName,
          path: layout.routePath,
          element: <LayoutRoute layoutRouteName="test" />,
        },
      ],
      {
        initialEntries: ['/test'],
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    expect(await screen.findByTestId('layout-route')).toHaveTextContent('test');
    expect(activateLayout).not.toHaveBeenCalled();
  });

  it('syncs nested page route before the layout renders its outlet', async () => {
    const nestedLayout: LayoutDefinition = {
      ...layout,
      routeName: 'admin.settings.publicForms.layout',
      routePath: '',
      rootRouteName: 'admin',
      uid: 'gated-layout-model',
      layoutModelClass: 'GatedLayoutModel',
    };
    const engine = new FlowEngine();
    engine.registerModels({ GatedLayoutModel });
    engine.context.defineProperty('app', {
      value: {
        layoutManager: {
          getLayout: () => nestedLayout,
        },
      },
    });
    const router = createMemoryRouter(
      [
        {
          id: 'admin.settings',
          path: '/admin/settings',
          element: <Outlet />,
          children: [
            {
              id: 'admin.settings.publicForms',
              path: 'public-forms',
              element: <Outlet />,
              children: [
                {
                  id: nestedLayout.routeName,
                  path: '',
                  element: <LayoutRoute layoutRouteName={nestedLayout.routeName} />,
                  children: [
                    {
                      id: getLayoutPageViewRouteName(nestedLayout.routeName),
                      path: ':name/view/*',
                      element: <div data-testid="layout-child-outlet">child page</div>,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      {
        initialEntries: ['/admin/settings/public-forms/form-1/view/popup'],
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    expect(await screen.findByTestId('layout-page-uid')).toHaveTextContent('form-1');
    expect(await screen.findByTestId('layout-child-outlet')).toHaveTextContent('child page');
  });

  it('keeps local layout route while parent layout route switches within the same page view stack', async () => {
    const clearEvents: Array<{ routePathname?: string; before: string | null; after: string | null }> = [];

    class TrackingLayoutModel extends TestLayoutModel {
      clearLayoutRoute(routeLike?: Parameters<BaseLayoutModel['clearLayoutRoute']>[0]) {
        const event: { routePathname?: string; before: string | null; after: string | null } = {
          routePathname: routeLike?.pathname,
          before: this.currentLayoutRoute?.pathname || null,
          after: null,
        };
        super.clearLayoutRoute(routeLike);
        event.after = this.currentLayoutRoute?.pathname || null;
        clearEvents.push(event);
      }
    }

    const engine = new FlowEngine();
    engine.registerModels({ TrackingLayoutModel });
    const trackingLayout: LayoutDefinition = {
      ...layout,
      layoutModelClass: 'TrackingLayoutModel',
    };
    engine.context.defineProperty('app', {
      value: {
        layoutManager: {
          getLayout: () => trackingLayout,
        },
      },
    });
    const router = createMemoryRouter(
      [
        {
          id: layout.routeName,
          path: layout.routePath,
          element: <LayoutRoute layoutRouteName={layout.routeName} />,
          children: [
            {
              id: getLayoutPageRouteName(layout.routeName),
              path: ':name',
              element: <div data-testid="page-route">page</div>,
            },
            {
              id: getLayoutPageViewRouteName(layout.routeName),
              path: ':name/view/*',
              element: <div data-testid="page-view-route">page view</div>,
            },
          ],
        },
      ],
      {
        initialEntries: ['/test/page-1'],
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    const model = await waitFor(() => {
      const layoutModel = engine.getModel<TrackingLayoutModel>(layout.uid);
      expect(layoutModel?.currentLayoutRoute).toMatchObject({
        type: 'page',
        pageUid: 'page-1',
        pathname: '/test/page-1',
      });
      return layoutModel as TrackingLayoutModel;
    });

    await router.navigate('/test/page-1/view/popup');

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'page',
        pageUid: 'page-1',
        pathname: '/test/page-1/view/popup',
      });
    });

    expect(clearEvents).not.toContainEqual({
      routePathname: '/test/page-1',
      before: '/test/page-1',
      after: null,
    });
  });
});

describe('LayoutContentRoute', () => {
  function setup(
    initialEntry: string,
    currentLayout: LayoutDefinition = layout,
    ModelClass: typeof TestLayoutModel = TestLayoutModel,
    storagePrefix = 'NOCOBASE_',
  ) {
    const engine = new FlowEngine();
    const originalStorage = {};
    const apiClient = {
      storagePrefix,
      storage: originalStorage,
      createStorage: vi.fn((storageType: string) => ({ storageType })),
    };
    engine.registerModels({ TestLayoutModel, [ModelClass.name]: ModelClass });
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
        apiClient,
      },
    });
    const model = engine.createModel<TestLayoutModel>({
      uid: layout.uid,
      use: ModelClass,
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
    let routes;
    if (currentLayout.routeName === 'admin.settings.publicForms.layout') {
      routes = [
        {
          id: 'admin.settings',
          path: '/admin/settings',
          element: <Outlet />,
          children: [
            {
              id: 'admin.settings.publicForms',
              path: '/admin/settings/public-forms',
              element: <Outlet />,
              children: [layoutRoute],
            },
          ],
        },
      ];
    } else if (currentLayout.routeName.includes('.')) {
      routes = [
        {
          id: 'admin.settings',
          path: '/admin/settings',
          element: <Outlet />,
          children: [layoutRoute],
        },
      ];
    } else {
      routes = [layoutRoute];
    }
    const router = createMemoryRouter(routes, {
      initialEntries: [initialEntry],
    });

    const renderResult = render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    return { apiClient, model, originalStorage, router, unmount: renderResult.unmount };
  }

  it('parses page route from standard layout route', async () => {
    const { apiClient, model } = setup('/test/page-1/tab/tab-1/view/popup');

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'page',
        basePathname: '/test',
        pageUid: 'page-1',
        tabUid: 'tab-1',
        viewStack: [{ viewUid: 'page-1', tabUid: 'tab-1' }, { viewUid: 'popup' }],
      });
    });
    expect(apiClient.createStorage).not.toHaveBeenCalled();
  });

  it('scopes apiClient storage for configured layout page routes and restores it when leaving', async () => {
    const { apiClient, originalStorage, router } = setup(
      '/test/page-1',
      sessionStorageScopedLayout,
      TestLayoutModel,
      'NOCOBASE_APP1_',
    );

    await waitFor(() => {
      expect(apiClient.storagePrefix).toBe('NOCOBASE_APP1_PUBLIC_FORM_page-1_');
    });
    expect(apiClient.createStorage).toHaveBeenCalledWith('sessionStorage');

    await act(async () => {
      await router.navigate('/test/page-2');
    });

    await waitFor(() => {
      expect(apiClient.storagePrefix).toBe('NOCOBASE_APP1_PUBLIC_FORM_page-2_');
    });
    expect(apiClient.createStorage).toHaveBeenCalledTimes(2);

    await act(async () => {
      await router.navigate('/test');
    });

    await waitFor(() => {
      expect(apiClient.storagePrefix).toBe('NOCOBASE_APP1_');
    });
    expect(apiClient.storage).toBe(originalStorage);
  });

  it('restores scoped apiClient storage when a configured layout unmounts', async () => {
    const { apiClient, originalStorage, unmount } = setup('/test/page-1', sessionStorageScopedLayout);

    await waitFor(() => {
      expect(apiClient.storagePrefix).toBe('NOCOBASE_PUBLIC_FORM_page-1_');
    });

    unmount();

    await waitFor(() => {
      expect(apiClient.storagePrefix).toBe('NOCOBASE_');
    });
    expect(apiClient.storage).toBe(originalStorage);
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

  it('parses empty nested layout route by matched layout pathname', async () => {
    const nestedLayout: LayoutDefinition = {
      ...layout,
      routeName: 'admin.settings.publicForms.layout',
      routePath: '',
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

  it('clears local layout route when the content route unmounts', async () => {
    const { model, router } = setup('/test/page-1/view/popup');

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'page',
        pageUid: 'page-1',
      });
    });

    await router.navigate('/test');

    await waitFor(() => {
      expect(model.currentLayoutRoute).toBeNull();
    });
  });

  it('does not clear local layout route while switching within the same page view stack', async () => {
    const clearEvents: Array<{ routePathname?: string; before: string | null; after: string | null }> = [];

    class TrackingLayoutModel extends TestLayoutModel {
      clearLayoutRoute(routeLike?: Parameters<BaseLayoutModel['clearLayoutRoute']>[0]) {
        const event: { routePathname?: string; before: string | null; after: string | null } = {
          routePathname: routeLike?.pathname,
          before: this.currentLayoutRoute?.pathname || null,
          after: null,
        };
        super.clearLayoutRoute(routeLike);
        event.after = this.currentLayoutRoute?.pathname || null;
        clearEvents.push(event);
      }
    }

    const { model, router } = setup('/test/page-1', layout, TrackingLayoutModel);

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'page',
        pageUid: 'page-1',
        pathname: '/test/page-1',
      });
    });

    await router.navigate('/test/page-1/view/popup');

    await waitFor(() => {
      expect(model.currentLayoutRoute).toMatchObject({
        type: 'page',
        pageUid: 'page-1',
        pathname: '/test/page-1/view/popup',
      });
    });

    expect(clearEvents).not.toContainEqual({
      routePathname: '/test/page-1',
      before: '/test/page-1',
      after: null,
    });
  });
});
