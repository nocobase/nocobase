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
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MultiPortalRecord } from '../pages/MultiPortalsPage';
import PortalRoutesDrawer from '../pages/PortalRoutesDrawer';

const flowContext = vi.hoisted(() => ({
  current: undefined as
    | {
        api: {
          request: ReturnType<typeof vi.fn>;
          resource: ReturnType<typeof vi.fn>;
        };
        app: {
          router: {
            getBasename: () => string;
          };
        };
        viewer: {
          drawer: ReturnType<typeof vi.fn>;
        };
        routeRepository: {
          refreshAccessible: ReturnType<typeof vi.fn>;
        };
      }
    | undefined,
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    IconPicker: (props: { onChange?: (value: string) => void; value?: string }) =>
      ReactModule.createElement(
        'button',
        {
          'aria-label': props.value ? `Selected icon ${props.value}` : 'Select icon',
          onClick: () => props.onChange?.('AppstoreOutlined'),
          type: 'button',
        },
        props.value || 'Select icon',
      ),
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    randomId: () => 'random-id',
    useFlowContext: () => flowContext.current,
    useFlowEngine: () => ({
      context: {
        t: (key: string, options?: Record<string, unknown>) =>
          key.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? '')),
      },
    }),
    useFlowView: () => ({
      close: vi.fn(),
      Footer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
      Header: ({ title }: { title?: React.ReactNode }) => <h1>{title}</h1>,
    }),
  };
});

const desktopRoutesResource = {
  create: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
};

function renderPortalRoutes(
  portal: MultiPortalRecord,
  routes: Array<Record<string, unknown>> = [
    {
      id: 1,
      schemaUid: 'dashboard',
      title: 'Dashboard',
      type: 'flowPage',
    },
  ],
) {
  const request = vi.fn().mockResolvedValue({
    data: {
      data: routes,
    },
  });
  const drawer = vi.fn();
  const refreshAccessible = vi.fn().mockResolvedValue(undefined);
  flowContext.current = {
    api: {
      request,
      resource: vi.fn((name: string) => {
        if (name === 'desktopRoutes') {
          return desktopRoutesResource;
        }
        throw new Error(`Unexpected resource: ${name}`);
      }),
    },
    app: {
      router: {
        getBasename: () => '/v',
      },
    },
    viewer: {
      drawer,
    },
    routeRepository: {
      refreshAccessible,
    },
  };

  render(
    <AntdApp>
      <PortalRoutesDrawer portal={portal} />
    </AntdApp>,
  );
  return { drawer, refreshAccessible, request };
}

function renderLatestDrawer(drawer: ReturnType<typeof vi.fn>) {
  const options = drawer.mock.calls.at(-1)?.[0] as
    | {
        content?: () => React.ReactNode;
      }
    | undefined;
  if (!options?.content) {
    throw new Error('Expected a Flow Viewer drawer content renderer');
  }
  return render(<AntdApp>{options.content()}</AntdApp>);
}

async function selectFirstIcon(container: HTMLElement) {
  fireEvent.click(within(container).getByRole('button', { name: 'Select icon' }));
  await waitFor(() => {
    expect(within(container).getByRole('button', { name: 'Selected icon AppstoreOutlined' })).toBeInTheDocument();
  });
}

async function confirmRouteDelete(title: 'Delete route' | 'Delete routes') {
  const deleteTitle = await screen.findByText(title);
  const dialog = deleteTitle.closest('.ant-modal-confirm') as HTMLElement | null;
  expect(dialog).toBeTruthy();
  fireEvent.click(within(dialog as HTMLElement).getByRole('button', { name: 'Delete' }));
  await waitFor(() => {
    expect(document.body.querySelector('.ant-modal-confirm')).not.toBeInTheDocument();
  });
}

afterEach(() => {
  cleanup();
  flowContext.current = undefined;
  vi.clearAllMocks();
});

describe('PortalRoutesDrawer', () => {
  it('loads one custom portal route tree with only the portal identity', async () => {
    const user = userEvent.setup();
    const { drawer, request } = renderPortalRoutes({
      title: 'Customer portal',
      uid: 'customer-portal',
      portalType: 'no-code',
      portalName: 'customer-portal',
      routePath: '/customer-portal',
      uiLayoutUid: 'mobile-layout-model',
      enabled: true,
    });

    expect(await screen.findByRole('heading', { name: 'Routes' })).toBeInTheDocument();
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        method: 'get',
        params: {
          paginate: false,
          portal: 'customer-portal',
          sort: 'sort',
          tree: true,
        },
        skipNotify: true,
        url: '/desktopRoutes:list',
      });
    });

    const rowCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(rowCheckbox);
    await user.click(screen.getByRole('button', { name: 'Hide in menu' }));
    await waitFor(() => {
      expect(desktopRoutesResource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        portal: 'customer-portal',
        values: {
          hideInMenu: true,
        },
      });
    });

    await user.click(screen.getByRole('button', { name: 'Add new' }));
    expect(drawer).toHaveBeenCalledWith(
      expect.objectContaining({
        closable: true,
        content: expect.any(Function),
        width: expect.any(Number),
      }),
    );
  });

  it('does not special-case the legacy default portal uid or send a layout owner', async () => {
    const { request } = renderPortalRoutes({
      title: 'Admin',
      uid: '__default_portal__',
      portalType: 'no-code',
      portalName: 'admin',
      routePath: '/admin',
      uiLayoutUid: 'admin-layout-model',
      enabled: true,
    });

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        method: 'get',
        params: {
          paginate: false,
          portal: '__default_portal__',
          sort: 'sort',
          tree: true,
        },
        skipNotify: true,
        url: '/desktopRoutes:list',
      });
    });
    const listRequest = request.mock.calls.find(([options]) => options.url === '/desktopRoutes:list')?.[0];
    expect(listRequest?.params).not.toHaveProperty('filter');
    expect(listRequest?.params).not.toHaveProperty('layout');
  });

  it('uses the custom portal scope without refreshing the Settings global route repository', async () => {
    const { drawer, refreshAccessible } = renderPortalRoutes(
      {
        title: 'Customer portal',
        uid: 'customer-portal',
        portalType: 'no-code',
        portalName: 'customer-portal',
        routePath: '/customer-portal',
        uiLayoutUid: 'admin-layout-model',
        enabled: true,
      },
      [
        {
          id: 1,
          enableTabs: true,
          schemaUid: 'dashboard',
          title: 'Dashboard',
          type: 'flowPage',
        },
      ],
    );

    const dashboardRow = await screen.findByRole('row', { name: /Dashboard/ });
    expect(within(dashboardRow).getByRole('link', { name: 'View Dashboard' })).toHaveAttribute(
      'href',
      '/v/customer-portal/dashboard',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add new' }));
    const addEditor = renderLatestDrawer(drawer);
    fireEvent.change(addEditor.getByLabelText('Title'), { target: { value: 'Reports' } });
    fireEvent.click(addEditor.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(desktopRoutesResource.create).toHaveBeenCalledWith({
        portal: 'customer-portal',
        values: expect.objectContaining({
          children: [
            expect.objectContaining({
              hidden: true,
              type: 'tabs',
            }),
          ],
          title: 'Reports',
          type: 'flowPage',
        }),
      });
    });
    addEditor.unmount();

    fireEvent.click(within(dashboardRow).getByRole('button', { name: 'Edit Dashboard' }));
    const editEditor = renderLatestDrawer(drawer);
    fireEvent.change(editEditor.getByLabelText('Title'), { target: { value: 'Customer dashboard' } });
    fireEvent.click(editEditor.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(desktopRoutesResource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        portal: 'customer-portal',
        values: expect.objectContaining({
          title: 'Customer dashboard',
        }),
      });
    });
    editEditor.unmount();

    fireEvent.click(within(dashboardRow).getByRole('button', { name: 'Delete Dashboard' }));
    await confirmRouteDelete('Delete route');
    await waitFor(() => {
      expect(desktopRoutesResource.destroy).toHaveBeenCalledWith({
        filterByTk: 1,
        portal: 'customer-portal',
      });
    });
    expect(refreshAccessible).not.toHaveBeenCalled();
  });

  it('uses mobile route rules and persists mobile links with the portal scope', async () => {
    const { drawer } = renderPortalRoutes({
      title: 'Mobile portal',
      uid: 'mobile-portal',
      portalType: 'no-code',
      portalName: 'mobile-portal',
      routePath: '/mobile-portal',
      uiLayoutUid: 'mobile-layout-model',
      enabled: true,
    });

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add new' }));
    const editor = renderLatestDrawer(drawer);
    expect(editor.queryByRole('radio', { name: 'Group' })).not.toBeInTheDocument();
    expect(editor.getByRole('radio', { name: 'Page' })).toBeChecked();
    fireEvent.click(editor.getByRole('radio', { name: 'Link' }));
    fireEvent.change(editor.getByLabelText('Title'), { target: { value: 'Mobile docs' } });
    fireEvent.change(editor.getByLabelText('URL'), { target: { value: '/docs' } });
    fireEvent.click(editor.getByRole('button', { name: 'Add parameter' }));
    fireEvent.change(editor.getByPlaceholderText('Name'), { target: { value: 'from' } });
    fireEvent.change(editor.getByPlaceholderText('Value'), { target: { value: 'portal' } });
    const iconFormItem = editor.getByText('Icon').closest('.ant-form-item');
    expect(iconFormItem?.querySelector('label')).toHaveClass('ant-form-item-required');

    await selectFirstIcon(editor.container);
    fireEvent.click(editor.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(desktopRoutesResource.create).toHaveBeenCalledWith({
        portal: 'mobile-portal',
        values: expect.objectContaining({
          options: {
            params: [{ name: 'from', value: 'portal' }],
            url: '/docs',
          },
          title: 'Mobile docs',
          type: 'link',
        }),
      });
    });
  });

  it('uses the legacy uid as a normal portal identity without a global route refresh', async () => {
    const { refreshAccessible, request } = renderPortalRoutes(
      {
        title: 'Admin',
        uid: '__default_portal__',
        portalType: 'no-code',
        portalName: 'admin',
        routePath: '/admin',
        uiLayoutUid: 'admin-layout-model',
        enabled: true,
      },
      [
        {
          id: 1,
          enableTabs: true,
          schemaUid: 'dashboard',
          title: 'Dashboard',
          type: 'flowPage',
          children: [
            {
              id: 2,
              parentId: 1,
              schemaUid: 'overview',
              title: 'Overview',
              type: 'tabs',
            },
            {
              id: 3,
              hidden: true,
              parentId: 1,
              schemaUid: 'hidden-tab',
              title: 'Hidden tab',
              type: 'tabs',
            },
          ],
        },
        {
          id: 4,
          title: 'Navigation group',
          type: 'group',
        },
        {
          id: 5,
          schemaUid: 'legacy-page',
          title: 'Legacy v1 page',
          type: 'page',
        },
      ],
    );

    const dashboardRow = await screen.findByRole('row', { name: /Dashboard/ });
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            portal: '__default_portal__',
          }),
        }),
      );
    });
    expect(screen.queryByText('Legacy v1 page')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden tab')).not.toBeInTheDocument();
    expect(within(dashboardRow).getByRole('link', { name: 'View Dashboard' })).toHaveAttribute(
      'href',
      '/v/admin/dashboard',
    );

    fireEvent.click(within(dashboardRow).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Hide in menu' }));
    await waitFor(() => {
      expect(desktopRoutesResource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        portal: '__default_portal__',
        values: { hideInMenu: true },
      });
      expect(refreshAccessible).not.toHaveBeenCalled();
    });

    const groupRow = screen.getByRole('row', { name: /Navigation group/ });
    fireEvent.click(within(groupRow).getByRole('button', { name: 'Delete Navigation group' }));
    await confirmRouteDelete('Delete route');
    await waitFor(() => {
      expect(desktopRoutesResource.destroy).toHaveBeenCalledWith({
        filterByTk: 4,
        portal: '__default_portal__',
      });
    });
    expect(refreshAccessible).not.toHaveBeenCalled();
  });
});
