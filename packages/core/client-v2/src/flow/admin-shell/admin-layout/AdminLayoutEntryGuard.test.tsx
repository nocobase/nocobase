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
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
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
});
