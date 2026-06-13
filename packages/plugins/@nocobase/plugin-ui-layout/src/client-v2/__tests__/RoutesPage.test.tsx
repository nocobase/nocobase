/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App as AntdApp } from 'antd';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ADMIN_UI_LAYOUT, DEFAULT_MOBILE_UI_LAYOUT } from '../../constants';
import RoutesPage from '../pages/RoutesPage';

const flowContext = vi.hoisted(() => ({
  current: undefined as
    | {
        api: {
          request: ReturnType<typeof vi.fn>;
          resource: ReturnType<typeof vi.fn>;
        };
        message: {
          success: ReturnType<typeof vi.fn>;
        };
      }
    | undefined,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    randomId: () => 'generated-route-schema-uid',
    useFlowEngine: () => ({
      context: {
        t: (key: string, options?: Record<string, unknown>) =>
          key.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? '')),
      },
    }),
    useFlowContext: () => flowContext.current,
  };
});

afterEach(() => {
  cleanup();
  flowContext.current = undefined;
});

describe('plugin-ui-layout RoutesPage', () => {
  it('should list and mutate desktopRoutes with the selected layout parameter', async () => {
    const resource = createRoutesPageResources();
    flowContext.current = resource.context;

    render(
      <AntdApp>
        <RoutesPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    await waitFor(() => {
      expect(resource.request).toHaveBeenCalledWith({
        url: '/desktopRoutes:listAccessible',
        method: 'get',
        params: {
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
          paginate: false,
          sort: 'sort',
          tree: true,
        },
        skipNotify: true,
      });
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Mobile routes' }));
    expect(await screen.findByText('Mobile workbench')).toBeInTheDocument();
    await waitFor(() => {
      expect(resource.request).toHaveBeenCalledWith({
        url: '/desktopRoutes:listAccessible',
        method: 'get',
        params: {
          layout: DEFAULT_MOBILE_UI_LAYOUT.uid,
          paginate: false,
          sort: 'sort',
          tree: true,
        },
        skipNotify: true,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Add new/ }));
    const addDialog = await screen.findByRole('dialog', { name: 'Add new' });
    fireEvent.change(within(addDialog).getByLabelText('Title'), { target: { value: 'Mobile approvals' } });
    fireEvent.click(within(addDialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        layout: DEFAULT_MOBILE_UI_LAYOUT.uid,
        values: expect.objectContaining({
          schemaUid: 'generated-route-schema-uid',
          title: 'Mobile approvals',
          type: 'flowPage',
        }),
      });
    });
    expect(await screen.findByText('Mobile approvals')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Desktop routes' }));
    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Mobile approvals')).not.toBeInTheDocument();

    const desktopRow = screen.getByRole('row', { name: /Desktop dashboard/ });
    fireEvent.click(within(desktopRow).getByRole('button', { name: 'Edit Desktop dashboard' }));
    const editDialog = await screen.findByRole('dialog', { name: 'Edit route' });
    fireEvent.change(within(editDialog).getByLabelText('Title'), { target: { value: 'Desktop home' } });
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: expect.objectContaining({
          title: 'Desktop home',
        }),
      });
    });
    expect(await screen.findByText('Desktop home')).toBeInTheDocument();
  });

  it('should expose v1-compatible route management actions without v1 imports', async () => {
    const resource = createRoutesPageResources();
    flowContext.current = resource.context;

    render(
      <AntdApp>
        <RoutesPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Show in menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide in menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show in menu' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add new/ }));
    const addDialog = await screen.findByRole('dialog', { name: 'Add new' });
    fireEvent.mouseDown(within(addDialog).getByLabelText('Type'));
    expect(await screen.findByText('Group')).toBeInTheDocument();
    expect(screen.getByText('Classic page (v1)')).toBeInTheDocument();
    expect(screen.getAllByText('Modern page (v2)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Link').length).toBeGreaterThan(0);
    fireEvent.click(within(addDialog).getByText('Cancel'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Add new' })).not.toBeInTheDocument();
      expect(screen.queryByText('Classic page (v1)')).not.toBeInTheDocument();
    });

    const desktopRow = screen.getByRole('row', { name: /Desktop dashboard/ });
    fireEvent.click(within(desktopRow).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Hide in menu' }));
    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: { hideInMenu: true },
      });
    });
    fireEvent.click(within(screen.getByRole('row', { name: /Desktop dashboard/ })).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Show in menu' }));
    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: { hideInMenu: false },
      });
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Mobile routes' }));
    expect(await screen.findByText('Mobile workbench')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add new/ }));
    const mobileAddDialog = await screen.findByRole('dialog', { name: 'Add new' });
    fireEvent.mouseDown(within(mobileAddDialog).getByLabelText('Type'));
    expect(screen.queryByText('Group')).not.toBeInTheDocument();
    expect(screen.queryByText('Classic page (v1)')).not.toBeInTheDocument();
    expect(screen.queryByText('Modern page (v2)')).not.toBeInTheDocument();
    expect(screen.getAllByText('Page').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Link').length).toBeGreaterThan(0);
  });

  it('should render v1-style columns, path, pagination and row actions', async () => {
    const resource = createRoutesPageResources();
    flowContext.current = resource.context;

    render(
      <AntdApp>
        <RoutesPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add new' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Path' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Route name' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'UID' })).not.toBeInTheDocument();
    expect(screen.getByText('Page (v2)')).toBeInTheDocument();
    expect(screen.getByText('/admin/desktop-dashboard')).toBeInTheDocument();
    expect(screen.getByText('20 / page')).toBeInTheDocument();

    const desktopRow = screen.getByRole('row', { name: /Desktop dashboard/ });
    expect(within(desktopRow).getByRole('button', { name: 'Add child Desktop dashboard' })).toBeEnabled();
    expect(within(desktopRow).getByRole('button', { name: 'Edit Desktop dashboard' })).toBeEnabled();
    expect(within(desktopRow).getByRole('link', { name: 'View Desktop dashboard' })).toHaveAttribute(
      'href',
      '/admin/desktop-dashboard',
    );
    expect(within(desktopRow).getByRole('button', { name: 'Delete Desktop dashboard' })).toBeEnabled();

    fireEvent.click(within(desktopRow).getByRole('button', { name: 'Expand row' }));
    const tabRow = await screen.findByRole('row', { name: /Desktop tab/ });
    expect(within(tabRow).getByRole('link', { name: 'View Desktop tab' })).toHaveAttribute(
      'href',
      '/admin/desktop-dashboard/tab/desktop-tab',
    );

    const linkRow = screen.getByRole('row', { name: /Desktop link/ });
    expect(within(linkRow).getByRole('button', { name: 'Add child Desktop link' })).toBeDisabled();
    expect(within(linkRow).getByRole('button', { name: 'View Desktop link' })).toBeDisabled();
  });

  it('should create child routes with the current layout and parent route', async () => {
    const resource = createRoutesPageResources();
    flowContext.current = resource.context;

    render(
      <AntdApp>
        <RoutesPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    const desktopRow = screen.getByRole('row', { name: /Desktop dashboard/ });
    fireEvent.click(within(desktopRow).getByRole('button', { name: 'Add child Desktop dashboard' }));
    const addChildDialog = await screen.findByRole('dialog', { name: 'Add child route' });
    fireEvent.change(within(addChildDialog).getByLabelText('Title'), { target: { value: 'Desktop child tab' } });
    fireEvent.click(within(addChildDialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: expect.objectContaining({
          parentId: 1,
          schemaUid: 'generated-route-schema-uid',
          title: 'Desktop child tab',
          type: 'flowPage',
        }),
      });
    });
    expect(await screen.findByText('Desktop child tab')).toBeInTheDocument();
  });
});

function createRoutesPageResources() {
  const routesByLayout = new Map<string, Array<Record<string, unknown>>>([
    [
      DEFAULT_ADMIN_UI_LAYOUT.uid,
      [
        {
          id: 1,
          enableTabs: true,
          schemaUid: 'desktop-dashboard',
          title: 'Desktop dashboard',
          type: 'flowPage',
          children: [
            {
              id: 3,
              parentId: 1,
              schemaUid: 'desktop-tab',
              title: 'Desktop tab',
              type: 'tabs',
            },
          ],
        },
        {
          id: 4,
          schemaUid: 'desktop-link',
          title: 'Desktop link',
          type: 'link',
          options: {
            href: '/admin/external',
          },
        },
      ],
    ],
    [
      DEFAULT_MOBILE_UI_LAYOUT.uid,
      [
        {
          id: 2,
          schemaUid: 'mobile-workbench',
          title: 'Mobile workbench',
          type: 'flowPage',
        },
      ],
    ],
  ]);

  const getRoutes = (layout: unknown) => routesByLayout.get(String(layout)) ?? [];
  const request = vi.fn(async ({ params }: { params?: Record<string, unknown> }) => ({
    data: {
      data: getRoutes(params?.layout).map((route) => ({ ...route })),
    },
  }));
  const create = vi.fn(async ({ layout, values }: { layout: string; values: Record<string, unknown> }) => {
    const routes = getRoutes(layout);
    routes.push({
      ...values,
      id: 10 + routes.length,
    });
  });
  const update = vi.fn(
    async ({ filterByTk, layout, values }: { filterByTk: number; layout: string; values: Record<string, unknown> }) => {
      const routes = getRoutes(layout);
      const route = routes.find((item) => item.id === filterByTk);
      if (route) {
        Object.assign(route, values);
      }
    },
  );
  const destroy = vi.fn();
  const resource = vi.fn((name: string) => {
    if (name === 'desktopRoutes') {
      return {
        create,
        destroy,
        update,
      };
    }
    throw new Error(`Unexpected resource: ${name}`);
  });
  const success = vi.fn();

  return {
    context: {
      api: {
        request,
        resource,
      },
      message: {
        success,
      },
    },
    create,
    destroy,
    request,
    resource,
    success,
    update,
  };
}
