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
import React from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NocoBaseDesktopRouteType } from '../../../flow-compat';
import { RouteRepository } from '../../../RouteRepository';
import { AdminLayoutEntryGuard } from './AdminLayoutEntryGuard';
import type { AdminLayoutModel } from './AdminLayoutModel';

describe('AdminLayoutEntryGuard', () => {
  it('should ensure accessible routes for the active layout before resolving the landing route', async () => {
    const engine = new FlowEngine();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const routeRepository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(),
      },
    } as never);
    routeRepository.setRoutes([], 'admin-layout-model');
    const deactivateLayout = routeRepository.activateLayout({
      uid: 'mobile-layout-model',
    });
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          getBasename: () => '',
        },
      },
    });

    const model = {
      layout: {
        routeName: 'mobile',
        routePath: '/mobile',
        uid: 'mobile-layout-model',
      },
    } as AdminLayoutModel;
    const router = createMemoryRouter(
      [
        {
          path: '/mobile',
          id: 'mobile',
          element: (
            <FlowEngineProvider engine={engine}>
              <AdminLayoutEntryGuard model={model}>
                <div>Mobile layout shell</div>
              </AdminLayoutEntryGuard>
            </FlowEngineProvider>
          ),
        },
      ],
      {
        initialEntries: ['/mobile'],
      },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        url: '/desktopRoutes:listAccessible',
        params: {
          tree: true,
          sort: 'sort',
          layout: 'mobile-layout-model',
        },
      });
    });
    expect(screen.getByText('Mobile layout shell')).toBeInTheDocument();
    deactivateLayout();
  });

  it('should activate the guard layout before loading accessible routes', async () => {
    const engine = new FlowEngine();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const routeRepository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(),
      },
    } as never);
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          getBasename: () => '',
        },
      },
    });

    const model = {
      layout: {
        routeName: 'mobile',
        routePath: '/mobile',
        uid: 'mobile-layout-model',
      },
    } as AdminLayoutModel;
    const router = createMemoryRouter(
      [
        {
          path: '/mobile',
          id: 'mobile',
          element: (
            <FlowEngineProvider engine={engine}>
              <AdminLayoutEntryGuard model={model}>
                <div>Mobile layout shell</div>
              </AdminLayoutEntryGuard>
            </FlowEngineProvider>
          ),
        },
      ],
      {
        initialEntries: ['/mobile'],
      },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        url: '/desktopRoutes:listAccessible',
        params: {
          tree: true,
          sort: 'sort',
          layout: 'mobile-layout-model',
        },
      });
    });
    expect(screen.getByText('Mobile layout shell')).toBeInTheDocument();
  });

  it('should keep guard stable when layout getter returns a new object with the same fields', async () => {
    const engine = new FlowEngine();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const routeRepository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(),
      },
    } as never);
    const activateLayout = vi.spyOn(routeRepository, 'activateLayout');
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          getBasename: () => '',
        },
      },
    });

    const model = {
      get layout() {
        return {
          authCheck: true,
          routeName: 'admin',
          routePath: '/admin',
          uid: 'admin-layout-model',
        };
      },
    } as AdminLayoutModel;
    let forceRerender = () => {};
    const GuardShell = () => {
      const [, setVersion] = React.useState(0);
      forceRerender = () => setVersion((version) => version + 1);
      return (
        <AdminLayoutEntryGuard model={model}>
          <div>Admin layout shell</div>
        </AdminLayoutEntryGuard>
      );
    };
    const router = createMemoryRouter(
      [
        {
          path: '/admin',
          id: 'admin',
          element: (
            <FlowEngineProvider engine={engine}>
              <GuardShell />
            </FlowEngineProvider>
          ),
        },
      ],
      {
        initialEntries: ['/admin'],
      },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Admin layout shell')).toBeInTheDocument();
    });
    expect(activateLayout).toHaveBeenCalledTimes(1);

    await act(async () => {
      forceRerender();
    });

    expect(activateLayout).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('should reactivate the guard when stable layout fields change', async () => {
    const engine = new FlowEngine();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const routeRepository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(),
      },
    } as never);
    const activateLayout = vi.spyOn(routeRepository, 'activateLayout');
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        router: {
          getBasename: () => '',
        },
      },
    });

    let layoutUid = 'admin-layout-model';
    const model = {
      get layout() {
        return {
          authCheck: true,
          routeName: 'admin',
          routePath: '/admin',
          uid: layoutUid,
        };
      },
    } as AdminLayoutModel;
    let forceRerender = () => {};
    const GuardShell = () => {
      const [, setVersion] = React.useState(0);
      forceRerender = () => setVersion((version) => version + 1);
      return (
        <AdminLayoutEntryGuard model={model}>
          <div>Admin layout shell</div>
        </AdminLayoutEntryGuard>
      );
    };
    const router = createMemoryRouter(
      [
        {
          path: '/admin',
          id: 'admin',
          element: (
            <FlowEngineProvider engine={engine}>
              <GuardShell />
            </FlowEngineProvider>
          ),
        },
      ],
      {
        initialEntries: ['/admin'],
      },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Admin layout shell')).toBeInTheDocument();
    });
    expect(activateLayout).toHaveBeenCalledWith(expect.objectContaining({ uid: 'admin-layout-model' }));

    await act(async () => {
      layoutUid = 'admin-layout-next';
      forceRerender();
    });

    expect(activateLayout).toHaveBeenCalledTimes(2);
    expect(activateLayout).toHaveBeenLastCalledWith(expect.objectContaining({ uid: 'admin-layout-next' }));
  });

  it('should redirect group id paths to the first v2 landing route', async () => {
    const modernWindow = window as Window & { __nocobase_modern_client_prefix__?: string };
    modernWindow.__nocobase_modern_client_prefix__ = 'v2';
    const engine = new FlowEngine();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const routeRepository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(),
      },
    } as never);
    routeRepository.setRoutes([
      {
        id: 1,
        title: 'Group',
        type: NocoBaseDesktopRouteType.group,
        children: [
          {
            id: 11,
            title: 'Flow page',
            schemaUid: 'flow-page-1',
            type: NocoBaseDesktopRouteType.flowPage,
          },
        ],
      },
    ]);
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/apps/demo/v2/',
        router: {
          getBasename: () => '/apps/demo/v2',
        },
      },
    });

    const model = {
      layout: {
        routeName: 'admin',
        routePath: '/admin',
        uid: 'admin-layout-model',
      },
    } as AdminLayoutModel;
    const router = createMemoryRouter(
      [
        {
          path: '/admin',
          id: 'admin',
          element: (
            <FlowEngineProvider engine={engine}>
              <AdminLayoutEntryGuard model={model}>
                <Outlet />
              </AdminLayoutEntryGuard>
            </FlowEngineProvider>
          ),
          children: [
            {
              path: ':name',
              id: 'admin.__page',
              element: <div>Admin page shell</div>,
            },
          ],
        },
      ],
      {
        initialEntries: ['/admin/1'],
      },
    );

    try {
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/admin/flow-page-1');
      });
      expect(await screen.findByText('Admin page shell')).toBeInTheDocument();
    } finally {
      delete modernWindow.__nocobase_modern_client_prefix__;
    }
  });

  it('should prefer schema uid routes before resolving numeric group ids', async () => {
    const modernWindow = window as Window & { __nocobase_modern_client_prefix__?: string };
    modernWindow.__nocobase_modern_client_prefix__ = 'v2';
    const engine = new FlowEngine();
    const routeRepository = {
      activateLayout: vi.fn(() => vi.fn()),
      ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
      isAccessibleLoaded: vi.fn(() => true),
      getRouteBySchemaUid: vi.fn((pageUid: string) =>
        pageUid === '1'
          ? {
              schemaUid: '1',
              type: NocoBaseDesktopRouteType.flowPage,
            }
          : undefined,
      ),
      getRouteById: vi.fn((routeId: string) =>
        routeId === '1'
          ? {
              id: 1,
              type: NocoBaseDesktopRouteType.group,
              children: [
                {
                  schemaUid: 'flow-page-1',
                  type: NocoBaseDesktopRouteType.flowPage,
                },
              ],
            }
          : undefined,
      ),
      listAccessible: vi.fn(() => []),
    };
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/apps/demo/v2/',
        router: {
          getBasename: () => '/apps/demo/v2',
        },
      },
    });

    const model = {
      layout: {
        routeName: 'admin',
        routePath: '/admin',
        uid: 'admin-layout-model',
      },
    } as AdminLayoutModel;
    const router = createMemoryRouter(
      [
        {
          path: '/admin',
          id: 'admin',
          element: (
            <FlowEngineProvider engine={engine}>
              <AdminLayoutEntryGuard model={model}>
                <Outlet />
              </AdminLayoutEntryGuard>
            </FlowEngineProvider>
          ),
          children: [
            {
              path: ':name',
              id: 'admin.__page',
              element: <div>Admin page shell</div>,
            },
          ],
        },
      ],
      {
        initialEntries: ['/admin/1'],
      },
    );

    try {
      render(<RouterProvider router={router} />);

      await screen.findByText('Admin page shell');
      expect(router.state.location.pathname).toBe('/admin/1');
      expect(routeRepository.getRouteById).not.toHaveBeenCalled();
    } finally {
      delete modernWindow.__nocobase_modern_client_prefix__;
    }
  });
});
