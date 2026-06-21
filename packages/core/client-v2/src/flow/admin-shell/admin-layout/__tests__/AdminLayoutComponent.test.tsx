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
import { describe, expect, it, vi } from 'vitest';
import type { LayoutDefinition } from '../../../../layout-manager/types';
import { AdminLayoutComponent } from '../AdminLayoutComponent';
import { AdminLayoutModel } from '../AdminLayoutModel';
import { AdminLayoutContent } from '../AdminLayoutSlotModels';

vi.mock('@ant-design/pro-layout', async () => {
  const ReactModule = await import('react');
  const RouteContext = ReactModule.createContext({ isMobile: false });

  return {
    default: (props: { children?: React.ReactNode }) =>
      ReactModule.createElement(
        RouteContext.Provider,
        { value: { isMobile: false } },
        ReactModule.createElement('div', { 'data-testid': 'pro-layout' }, props.children),
      ),
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
});
