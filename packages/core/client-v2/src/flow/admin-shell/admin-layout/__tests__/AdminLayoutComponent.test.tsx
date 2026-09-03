/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { act, render, screen, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';
import { createMemoryRouter, RouterProvider, useParams } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '../../../../flow-compat';
import type { LayoutDefinition } from '../../../../layout-manager/types';
import { AdminLayoutComponent } from '../AdminLayoutComponent';
import { AdminLayoutModel } from '../AdminLayoutModel';
import { AdminLayoutMenuItemModel } from '../AdminLayoutMenuModels';
import { AdminLayoutContent } from '../AdminLayoutSlotModels';

const proLayoutLifecycle = vi.hoisted(() => ({
  events: [] as string[],
  routes: [] as Array<{ children?: Array<{ name?: React.ReactNode }> }>,
}));

vi.mock('@ant-design/pro-layout', async () => {
  const ReactModule = await import('react');
  const RouteContext = ReactModule.createContext({ isMobile: false });
  const ProLayoutMock = (props: {
    children?: React.ReactNode;
    route?: { children?: Array<{ name?: React.ReactNode }> };
  }) => {
    ReactModule.useEffect(() => {
      proLayoutLifecycle.events.push('pro-layout:mount');
      return () => {
        proLayoutLifecycle.events.push('pro-layout:unmount');
      };
    }, []);
    proLayoutLifecycle.routes.push(props.route || {});

    return ReactModule.createElement(
      RouteContext.Provider,
      { value: { isMobile: false } },
      ReactModule.createElement(
        'div',
        { 'data-testid': 'pro-layout' },
        ReactModule.createElement(
          'nav',
          { 'data-testid': 'pro-layout-menu' },
          (props.route?.children || []).map((item) =>
            ReactModule.createElement(
              'span',
              { key: String(item.name), 'data-testid': 'pro-layout-menu-item' },
              item.name,
            ),
          ),
        ),
        props.children,
      ),
    );
  };

  return {
    default: ProLayoutMock,
    RouteContext,
  };
});

vi.mock('../../../system-settings', () => ({
  useSystemSettings: () => ({
    loading: false,
    data: {
      data: {
        title: 'NocoBase',
      },
    },
  }),
}));

vi.mock('../useApplications', () => ({
  useApplications: () => ({
    appList: [],
  }),
}));

vi.mock('../AppListRender', () => ({
  useAppListRender: () => undefined,
}));

afterEach(() => {
  delete (window as Window & { __nocobase_modern_client_prefix__?: string }).__nocobase_modern_client_prefix__;
});

describe('AdminLayoutComponent', () => {
  it('keeps custom admin layout pages alive by layout route name', async () => {
    const layout: LayoutDefinition = {
      routeName: 'admin2',
      routePath: '/admin2',
      rootRouteName: 'admin2',
      uid: 'custom-admin-layout-model',
      layoutModelClass: 'AdminLayoutModel',
      rootPageModelClass: 'RootPageModel',
      childPageModelClass: 'ChildPageModel',
      authCheck: true,
    };
    const events: string[] = [];
    const engine = new FlowEngine();
    engine.context.defineProperty('routeRepository', {
      value: {
        listAccessible: () => [],
      },
    });

    const Page = () => {
      const { name } = useParams();
      useEffect(() => {
        events.push(`mount:${name}`);
        return () => {
          events.push(`unmount:${name}`);
        };
      }, [name]);

      return <div data-testid={`admin-layout-page-${name}`}>page {name}</div>;
    };

    const router = createMemoryRouter(
      [
        {
          id: layout.routeName,
          path: layout.routePath,
          element: <AdminLayoutContent layout={layout} />,
          children: [
            {
              id: 'admin2.__page',
              path: ':name',
              element: <Page />,
            },
          ],
        },
      ],
      {
        initialEntries: ['/admin2/page-a'],
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    expect(await screen.findByTestId('admin-layout-page-page-a')).toBeInTheDocument();

    await act(async () => {
      await router.navigate('/admin2/page-b');
    });

    expect(await screen.findByTestId('admin-layout-page-page-b')).toBeInTheDocument();
    expect(screen.getByTestId('admin-layout-page-page-a')).toBeInTheDocument();
    expect(events).toEqual(['mount:page-a', 'mount:page-b']);
  });

  it('activates the current layout before loading accessible routes', async () => {
    const layout: LayoutDefinition = {
      routeName: 'admin2',
      routePath: '/admin2',
      rootRouteName: 'admin2',
      uid: 'custom-admin-layout-model',
      layoutModelClass: 'AdminLayoutModel',
      rootPageModelClass: 'RootPageModel',
      childPageModelClass: 'ChildPageModel',
      authCheck: true,
    };
    const deactivateLayout = vi.fn();
    const activateLayout = vi.fn(() => deactivateLayout);
    const ensureAccessibleLoaded = vi.fn(async () => []);
    const engine = new FlowEngine();
    engine.context.defineProperty('routeRepository', {
      value: {
        activateLayout,
        ensureAccessibleLoaded,
        listAccessible: () => [],
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      },
    });
    engine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    const model = engine.createModel<AdminLayoutModel>({
      uid: layout.uid,
      use: AdminLayoutModel,
      props: {
        layout,
      },
    });

    const router = createMemoryRouter(
      [
        {
          id: layout.routeName,
          path: layout.routePath,
          element: <AdminLayoutComponent model={model} />,
        },
      ],
      {
        initialEntries: ['/admin2'],
      },
    );
    const { unmount } = render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(ensureAccessibleLoaded).toHaveBeenCalled();
    });
    expect(activateLayout).toHaveBeenCalledWith(layout);
    expect(activateLayout.mock.invocationCallOrder[0]).toBeLessThan(ensureAccessibleLoaded.mock.invocationCallOrder[0]);

    unmount();

    expect(deactivateLayout).toHaveBeenCalledTimes(1);
  });

  it('keeps layout content mounted when the menu route tree refreshes', async () => {
    proLayoutLifecycle.events = [];
    proLayoutLifecycle.routes = [];
    const layout: LayoutDefinition = {
      routeName: 'admin',
      routePath: '/admin',
      rootRouteName: 'admin',
      uid: 'admin-layout-model',
      layoutModelClass: 'AdminLayoutModel',
      rootPageModelClass: 'RootPageModel',
      childPageModelClass: 'ChildPageModel',
      authCheck: true,
    };
    const events: string[] = [];
    const engine = new FlowEngine();
    engine.context.defineProperty('routeRepository', {
      value: {
        activateLayout: vi.fn(() => vi.fn()),
        ensureAccessibleLoaded: vi.fn(async () => []),
        listAccessible: () => [],
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      },
    });
    engine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    const model = engine.createModel<AdminLayoutModel>({
      uid: layout.uid,
      use: AdminLayoutModel,
      props: {
        layout,
      },
    });

    const Page = () => {
      useEffect(() => {
        events.push('page:mount');
        return () => {
          events.push('page:unmount');
        };
      }, []);

      return <div data-testid="custom-admin-route">Workflow tasks</div>;
    };

    const router = createMemoryRouter(
      [
        {
          id: layout.routeName,
          path: layout.routePath,
          element: <AdminLayoutComponent model={model} />,
          children: [
            {
              id: 'admin.workflow.tasks',
              path: 'workflow/tasks/:taskType?/:status?/:popupId?',
              element: <Page />,
            },
          ],
        },
      ],
      {
        initialEntries: ['/admin/workflow/tasks/approval-apply/pending'],
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    expect(await screen.findByTestId('custom-admin-route')).toBeInTheDocument();
    expect(proLayoutLifecycle.events).toEqual(['pro-layout:mount']);

    act(() => {
      model.refreshMenuRouteTree();
    });

    await act(async () => {
      await router.navigate('/admin/workflow/tasks/approval-apply/pending/1');
    });

    expect(screen.getByTestId('custom-admin-route')).toBeInTheDocument();
    expect(proLayoutLifecycle.events).toEqual(['pro-layout:mount']);
    expect(events).toEqual(['page:mount']);
  });

  it('updates ProLayout menu routes after accessible routes change without remounting the layout', async () => {
    proLayoutLifecycle.events = [];
    proLayoutLifecycle.routes = [];
    (window as Window & { __nocobase_modern_client_prefix__?: string }).__nocobase_modern_client_prefix__ = 'v2';
    const layout: LayoutDefinition = {
      routeName: 'admin',
      routePath: '/admin',
      rootRouteName: 'admin',
      uid: 'admin-layout-model',
      layoutModelClass: 'AdminLayoutModel',
      rootPageModelClass: 'RootPageModel',
      childPageModelClass: 'ChildPageModel',
      authCheck: true,
    };
    let accessibleRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        title: 'Visible page',
        schemaUid: 'visible-page',
        type: NocoBaseDesktopRouteType.flowPage,
      },
    ];
    let routeRepositorySubscriber: (() => void) | undefined;
    const events: string[] = [];
    const engine = new FlowEngine();
    engine.registerModels({
      AdminLayoutMenuItemModel,
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        activateLayout: vi.fn(() => vi.fn()),
        ensureAccessibleLoaded: vi.fn(async () => accessibleRoutes),
        listAccessible: () => accessibleRoutes,
        subscribe: vi.fn((subscriber: () => void) => {
          routeRepositorySubscriber = subscriber;
        }),
        unsubscribe: vi.fn(),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v/',
        router: {
          getBasename: () => '/v',
        },
      },
    });
    engine.context.defineProperty('t', {
      value: (key: string) => key,
    });
    const model = engine.createModel<AdminLayoutModel>({
      uid: layout.uid,
      use: AdminLayoutModel,
      props: {
        layout,
      },
    });

    const Page = () => {
      useEffect(() => {
        events.push('page:mount');
        return () => {
          events.push('page:unmount');
        };
      }, []);

      return <div data-testid="custom-admin-route">Workflow tasks</div>;
    };

    const router = createMemoryRouter(
      [
        {
          id: layout.routeName,
          path: layout.routePath,
          element: <AdminLayoutComponent model={model} />,
          children: [
            {
              id: 'admin.workflow.tasks',
              path: 'workflow/tasks/:taskType?/:status?/:popupId?',
              element: <Page />,
            },
          ],
        },
      ],
      {
        initialEntries: ['/admin/workflow/tasks/approval-apply/pending'],
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <RouterProvider router={router} />
      </FlowEngineProvider>,
    );

    expect(await screen.findByText('Visible page')).toBeInTheDocument();
    expect(proLayoutLifecycle.events).toEqual(['pro-layout:mount']);

    act(() => {
      accessibleRoutes = [];
      routeRepositorySubscriber?.();
    });

    await waitFor(() => {
      expect(screen.queryByText('Visible page')).not.toBeInTheDocument();
    });

    await act(async () => {
      await router.navigate('/admin/workflow/tasks/approval-apply/pending/1');
    });

    expect(screen.getByTestId('custom-admin-route')).toBeInTheDocument();
    expect(proLayoutLifecycle.events).toEqual(['pro-layout:mount']);
    expect(events).toEqual(['page:mount']);
    expect(
      proLayoutLifecycle.routes.some((route) => route.children?.some((item) => item.name === 'Visible page')),
    ).toBe(true);
    expect(proLayoutLifecycle.routes.at(-1)?.children?.some((item) => item.name === 'Visible page')).toBe(false);
  });
});
