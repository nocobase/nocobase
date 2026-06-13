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
});
