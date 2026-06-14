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

async function findOpenDrawer(title: string) {
  let drawer: HTMLElement | null = null;
  await waitFor(() => {
    drawer = document.body.querySelector('.ant-drawer-open') as HTMLElement | null;
    expect(drawer).toBeTruthy();
    expect(within(drawer as HTMLElement).getByText(title)).toBeInTheDocument();
  });
  return drawer as HTMLElement;
}

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
    const addDrawer = await findOpenDrawer('Add new');
    expect(addDrawer.closest('.ant-drawer')).toBeTruthy();
    expect(addDrawer.closest('.ant-modal')).toBeFalsy();
    expect(addDrawer.closest('[role="tabpanel"]')).toBeFalsy();
    expect(within(addDrawer).getByRole('radio', { name: 'Page' })).toBeChecked();
    fireEvent.change(within(addDrawer).getByLabelText('Title'), { target: { value: 'Mobile approvals' } });
    fireEvent.click(within(addDrawer).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        layout: DEFAULT_MOBILE_UI_LAYOUT.uid,
        values: expect.objectContaining({
          children: [
            expect.objectContaining({
              hidden: true,
              schemaUid: 'generated-route-schema-uid',
              tabSchemaName: 'generated-route-schema-uid',
              type: 'tabs',
            }),
          ],
          enableTabs: false,
          menuSchemaUid: 'generated-route-schema-uid',
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
    const editDrawer = await findOpenDrawer('Edit route');
    expect(editDrawer.closest('.ant-drawer')).toBeTruthy();
    expect(within(editDrawer).queryByRole('radio', { name: 'Link' })).not.toBeInTheDocument();
    expect(within(editDrawer).getByText('Page')).toBeInTheDocument();
    fireEvent.change(within(editDrawer).getByLabelText('Title'), { target: { value: 'Desktop home' } });
    fireEvent.click(within(editDrawer).getByRole('button', { name: 'Submit' }));

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
    const addDialog = await findOpenDrawer('Add new');
    expect(addDialog.closest('.ant-drawer')).toBeTruthy();
    expect(addDialog.closest('.ant-modal')).toBeFalsy();
    expect(within(addDialog).getByRole('radio', { name: 'Group' })).toBeInTheDocument();
    expect(within(addDialog).getByRole('radio', { name: 'Page' })).toBeChecked();
    expect(within(addDialog).getByRole('radio', { name: 'Link' })).toBeInTheDocument();
    expect(within(addDialog).queryByText('Classic page (v1)')).not.toBeInTheDocument();
    expect(within(addDialog).queryByText('Modern page (v2)')).not.toBeInTheDocument();
    expect(within(addDialog).getByText('Icon')).toBeInTheDocument();
    expect(within(addDialog).getByRole('button', { name: 'Select icon' })).toBeInTheDocument();
    expect(within(addDialog).getByRole('checkbox', { name: 'Show in menu' })).toBeChecked();
    expect(within(addDialog).getByRole('checkbox', { name: 'Enable page tabs' })).not.toBeChecked();
    expect(within(addDialog).queryByLabelText('URL')).not.toBeInTheDocument();
    fireEvent.click(within(addDialog).getByText('Cancel'));
    await waitFor(() => {
      expect(document.body.querySelector('.ant-drawer-open')).not.toBeInTheDocument();
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
    const mobileAddDialog = await findOpenDrawer('Add new');
    expect(within(mobileAddDialog).queryByRole('radio', { name: 'Group' })).not.toBeInTheDocument();
    expect(within(mobileAddDialog).queryByText('Classic page (v1)')).not.toBeInTheDocument();
    expect(within(mobileAddDialog).queryByText('Modern page (v2)')).not.toBeInTheDocument();
    expect(within(mobileAddDialog).getByRole('radio', { name: 'Page' })).toBeChecked();
    expect(within(mobileAddDialog).getByRole('radio', { name: 'Link' })).toBeInTheDocument();
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
    expect(screen.getAllByText('Page').length).toBeGreaterThan(0);
    expect(screen.queryByText('Page (v2)')).not.toBeInTheDocument();
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

  it('should create child tab routes for pages and page routes for groups', async () => {
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
    const addChildDialog = await findOpenDrawer('Add child route');
    expect(within(addChildDialog).getByRole('radio', { name: 'Tab' })).toBeChecked();
    expect(within(addChildDialog).queryByRole('radio', { name: 'Group' })).not.toBeInTheDocument();
    expect(within(addChildDialog).queryByRole('radio', { name: 'Page' })).not.toBeInTheDocument();
    expect(within(addChildDialog).queryByRole('radio', { name: 'Link' })).not.toBeInTheDocument();
    fireEvent.change(within(addChildDialog).getByLabelText('Title'), { target: { value: 'Desktop child tab' } });
    fireEvent.click(within(addChildDialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: expect.objectContaining({
          parentId: 1,
          schemaUid: 'generated-route-schema-uid',
          tabSchemaName: 'generated-route-schema-uid',
          title: 'Desktop child tab',
          type: 'tabs',
        }),
      });
    });
    expect(await screen.findByText('Desktop child tab')).toBeInTheDocument();

    const groupRow = screen.getByRole('row', { name: /Desktop group/ });
    fireEvent.click(within(groupRow).getByRole('button', { name: 'Add child Desktop group' }));
    const groupChildDialog = await findOpenDrawer('Add child route');
    expect(within(groupChildDialog).getByRole('radio', { name: 'Group' })).toBeInTheDocument();
    expect(within(groupChildDialog).getByRole('radio', { name: 'Page' })).toBeChecked();
    expect(within(groupChildDialog).getByRole('radio', { name: 'Link' })).toBeInTheDocument();
    expect(within(groupChildDialog).queryByRole('radio', { name: 'Tab' })).not.toBeInTheDocument();
  });

  it('should hide hidden tab routes and sync tab visibility when page tabs are toggled', async () => {
    const resource = createRoutesPageResources();
    flowContext.current = resource.context;

    render(
      <AntdApp>
        <RoutesPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    let desktopRow = screen.getByRole('row', { name: /Desktop dashboard/ });
    fireEvent.click(within(desktopRow).getByRole('button', { name: 'Expand row' }));
    expect(await screen.findByText('Desktop tab')).toBeInTheDocument();
    expect(screen.queryByText('Hidden desktop tab')).not.toBeInTheDocument();

    fireEvent.click(within(desktopRow).getByRole('button', { name: 'Edit Desktop dashboard' }));
    let editDrawer = await findOpenDrawer('Edit route');
    expect(within(editDrawer).getByRole('checkbox', { name: 'Enable page tabs' })).toBeChecked();
    fireEvent.click(within(editDrawer).getByRole('checkbox', { name: 'Enable page tabs' }));
    fireEvent.click(within(editDrawer).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: expect.objectContaining({
          enableTabs: false,
        }),
      });
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 3,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: {
          hidden: true,
        },
      });
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 6,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: {
          hidden: true,
        },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('Desktop tab')).not.toBeInTheDocument();
      desktopRow = screen.getByRole('row', { name: /Desktop dashboard/ });
      expect(within(desktopRow).getByRole('button', { name: 'Add child Desktop dashboard' })).toBeDisabled();
    });

    fireEvent.click(within(desktopRow).getByRole('button', { name: 'Edit Desktop dashboard' }));
    editDrawer = await findOpenDrawer('Edit route');
    expect(within(editDrawer).getByRole('checkbox', { name: 'Enable page tabs' })).not.toBeChecked();
    fireEvent.click(within(editDrawer).getByRole('checkbox', { name: 'Enable page tabs' }));
    fireEvent.click(within(editDrawer).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: expect.objectContaining({
          enableTabs: true,
        }),
      });
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 3,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: {
          hidden: false,
        },
      });
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 6,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: {
          hidden: false,
        },
      });
    });

    desktopRow = await screen.findByRole('row', { name: /Desktop dashboard/ });
    expect(within(desktopRow).getByRole('button', { name: 'Add child Desktop dashboard' })).toBeEnabled();
    const expandButton = within(desktopRow).queryByRole('button', { name: 'Expand row' });
    if (expandButton) {
      fireEvent.click(expandButton);
    }
    expect(await screen.findByText('Desktop tab')).toBeInTheDocument();
    expect(await screen.findByText('Hidden desktop tab')).toBeInTheDocument();
  });

  it('should render link fields and persist desktop and mobile link options', async () => {
    const resource = createRoutesPageResources();
    flowContext.current = resource.context;

    render(
      <AntdApp>
        <RoutesPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add new/ }));
    const desktopDrawer = await findOpenDrawer('Add new');
    fireEvent.click(within(desktopDrawer).getByRole('radio', { name: 'Link' }));
    expect(within(desktopDrawer).getByLabelText('URL')).toBeInTheDocument();
    expect(within(desktopDrawer).getByText('Do not concatenate search params in the URL')).toBeInTheDocument();
    expect(within(desktopDrawer).getByText('Search parameters')).toBeInTheDocument();
    fireEvent.change(within(desktopDrawer).getByLabelText('Title'), { target: { value: 'Desktop docs' } });
    fireEvent.change(within(desktopDrawer).getByLabelText('URL'), { target: { value: '/docs' } });
    fireEvent.click(within(desktopDrawer).getByRole('button', { name: 'Add parameter' }));
    fireEvent.change(within(desktopDrawer).getByPlaceholderText('Name'), { target: { value: 'from' } });
    fireEvent.change(within(desktopDrawer).getByPlaceholderText('Value'), { target: { value: 'routes' } });
    fireEvent.click(within(desktopDrawer).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: expect.objectContaining({
          title: 'Desktop docs',
          type: 'link',
          options: {
            href: '/docs',
            params: [{ name: 'from', value: 'routes' }],
          },
        }),
      });
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Mobile routes' }));
    expect(await screen.findByText('Mobile workbench')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add new/ }));
    const mobileDrawer = await findOpenDrawer('Add new');
    fireEvent.click(within(mobileDrawer).getByRole('radio', { name: 'Link' }));
    fireEvent.change(within(mobileDrawer).getByLabelText('Title'), { target: { value: 'Mobile docs' } });
    fireEvent.change(within(mobileDrawer).getByLabelText('URL'), { target: { value: '/mobile-docs' } });
    fireEvent.click(within(mobileDrawer).getByRole('button', { name: 'Add parameter' }));
    fireEvent.change(within(mobileDrawer).getByPlaceholderText('Name'), { target: { value: 'scope' } });
    fireEvent.change(within(mobileDrawer).getByPlaceholderText('Value'), { target: { value: 'mobile' } });
    fireEvent.click(within(mobileDrawer).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        layout: DEFAULT_MOBILE_UI_LAYOUT.uid,
        values: expect.objectContaining({
          title: 'Mobile docs',
          type: 'link',
          options: {
            params: [{ name: 'scope', value: 'mobile' }],
            url: '/mobile-docs',
          },
        }),
      });
    });
  });

  it('should show v1-style delete confirmations without removing ui schemas', async () => {
    const resource = createRoutesPageResources();
    flowContext.current = resource.context;

    render(
      <AntdApp>
        <RoutesPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    const desktopRow = screen.getByRole('row', { name: /Desktop dashboard/ });
    fireEvent.click(within(desktopRow).getByRole('button', { name: 'Delete Desktop dashboard' }));
    expect(await screen.findByText('Delete route')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete it?')).toBeInTheDocument();
    fireEvent.click(
      within(document.querySelector('.ant-popover') as HTMLElement).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(resource.destroy).toHaveBeenCalledWith({
        filterByTk: 1,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      });
    });
    expect(resource.resource).not.toHaveBeenCalledWith('uiSchemas');

    const groupRow = await screen.findByRole('row', { name: /Desktop group/ });
    fireEvent.click(within(groupRow).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete routes')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete it?')).toBeInTheDocument();
    fireEvent.click(
      within(document.querySelector('.ant-popover') as HTMLElement).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(resource.destroy).toHaveBeenCalledWith({
        filterByTk: [5],
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      });
    });
    expect(resource.resource).not.toHaveBeenCalledWith('uiSchemas');
  });
});

type MutableRouteRecord = Record<string, unknown> & {
  children?: MutableRouteRecord[];
  id?: number;
  parentId?: number;
};

function createRoutesPageResources() {
  const routesByLayout = new Map<string, MutableRouteRecord[]>([
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
            {
              id: 6,
              hidden: true,
              parentId: 1,
              schemaUid: 'hidden-desktop-tab',
              title: 'Hidden desktop tab',
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
        {
          id: 5,
          title: 'Desktop group',
          type: 'group',
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
  const cloneRoutes = (routes: MutableRouteRecord[]): MutableRouteRecord[] =>
    routes.map((route) => ({
      ...route,
      ...(route.children ? { children: cloneRoutes(route.children) } : {}),
    }));
  const findRouteRecord = (routes: MutableRouteRecord[], id: number): MutableRouteRecord | undefined => {
    for (const route of routes) {
      if (route.id === id) {
        return route;
      }
      const child = route.children ? findRouteRecord(route.children, id) : undefined;
      if (child) {
        return child;
      }
    }
    return undefined;
  };
  const request = vi.fn(async ({ params }: { params?: Record<string, unknown> }) => ({
    data: {
      data: cloneRoutes(getRoutes(params?.layout)),
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
      const route = findRouteRecord(routes, filterByTk);
      if (route) {
        Object.assign(route, values);
      }
    },
  );
  const destroy = vi.fn(
    async ({
      filterByTk,
      layout,
    }: {
      filterByTk: number | number[];
      layout: string;
      values?: Record<string, unknown>;
    }) => {
      const routes = getRoutes(layout);
      const ids = Array.isArray(filterByTk) ? filterByTk : [filterByTk];
      ids.forEach((id) => {
        const index = routes.findIndex((item) => item.id === id);
        if (index >= 0) {
          routes.splice(index, 1);
        }
      });
    },
  );
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
