/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App as AntdApp } from 'antd';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MultiPortalPermissionsTab from '../permissions/MultiPortalPermissionsTab';

const flowMocks = vi.hoisted(() => ({
  context: undefined as
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
  engine: {
    context: {
      t: (key: string, options?: Record<string, unknown>) =>
        key.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? '')),
    },
  },
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as object;

  return {
    ...actual,
    useFlowContext: () => flowMocks.context,
    useFlowEngine: () => flowMocks.engine,
  };
});

describe('plugin-multi-portal route permissions', () => {
  afterEach(() => {
    cleanup();
    flowMocks.context = undefined;
  });

  it('should configure portal route permissions with the portal route dimension', async () => {
    const resource = createMultiPortalPermissionResources({
      selectedPortalUids: ['customer-portal'],
      selectedRouteIds: [],
    });
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <AntdApp>
        <MultiPortalPermissionsTab activeKey="multi-portals" activeRole={{ name: 'portal-member', title: 'Member' }} />
      </AntdApp>,
    );

    expect(await screen.findByText('Multi-portal')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Allow access to Customer portal' })).toBeChecked();
    expect(screen.getByRole('columnheader', { name: 'Menu permissions' })).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Configure menu permissions for Customer portal' }));
    });

    expect(await screen.findByText('Menu permissions')).toBeInTheDocument();
    const reportsRoute = await screen.findByRole('checkbox', { name: 'Allow access to Reports' });
    expect(reportsRoute).not.toBeChecked();

    await waitFor(() => {
      expect(resource.request).toHaveBeenCalledWith({
        url: 'desktopRoutes:listRolePermissionTargets',
        method: 'get',
        params: {
          layout: 'customer-portal',
        },
        skipNotify: true,
      });
      expect(resource.routePermissionList).toHaveBeenCalledWith({
        paginate: false,
        filter: {
          roleName: 'portal-member',
          multiPortalUid: 'customer-portal',
        },
      });
    });

    await act(async () => {
      await user.click(reportsRoute);
    });

    await waitFor(() => {
      expect(resource.routePermissionCreate).toHaveBeenCalledWith({
        values: {
          roleName: 'portal-member',
          multiPortalUid: 'customer-portal',
          desktopRouteId: 2,
        },
      });
    });
    expect(resource.messageSuccess).toHaveBeenCalledWith('Saved successfully');
  });

  it('should not show saved state when portal route permission save fails', async () => {
    const resource = createMultiPortalPermissionResources({
      createRouteError: new Error('create failed'),
      selectedPortalUids: ['customer-portal'],
      selectedRouteIds: [],
    });
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <AntdApp>
        <MultiPortalPermissionsTab activeKey="multi-portals" activeRole={{ name: 'portal-member', title: 'Member' }} />
      </AntdApp>,
    );

    const configureButton = await screen.findByRole('button', {
      name: 'Configure menu permissions for Customer portal',
    });
    await act(async () => {
      await user.click(configureButton);
    });
    const reportsRoute = await screen.findByRole('checkbox', { name: 'Allow access to Reports' });

    await act(async () => {
      await user.click(reportsRoute);
    });

    await waitFor(() => {
      expect(resource.routePermissionCreate).toHaveBeenCalled();
    });
    expect(reportsRoute).not.toBeChecked();
    expect(resource.messageSuccess).not.toHaveBeenCalled();
  });
});

type MultiPortalPermissionResourceOptions = {
  createRouteError?: Error;
  destroyRouteError?: Error;
  selectedPortalUids: string[];
  selectedRouteIds: number[];
};

function createMultiPortalPermissionResources(options: MultiPortalPermissionResourceOptions) {
  const selectedPortalUids = new Set(options.selectedPortalUids);
  const selectedRouteIds = new Set(options.selectedRouteIds);
  const portals = [
    {
      uid: 'customer-portal',
      title: 'Customer portal',
    },
  ];
  const routes = [
    {
      id: 1,
      title: 'Home',
    },
    {
      id: 2,
      title: 'Reports',
    },
  ];
  const request = vi.fn(async ({ url }: { url: string }) => {
    if (url === 'multiPortals:listEnabled') {
      return {
        data: {
          data: portals,
        },
      };
    }
    if (url === 'desktopRoutes:listRolePermissionTargets') {
      return {
        data: {
          data: routes,
        },
      };
    }
    throw new Error(`Unexpected request ${url}`);
  });
  const rolePortalList = vi.fn(async () => ({
    data: {
      data: portals.filter((portal) => selectedPortalUids.has(portal.uid)),
    },
  }));
  const rolePortalAdd = vi.fn(async ({ values }: { values: string[] }) => {
    values.forEach((uid) => selectedPortalUids.add(uid));
  });
  const rolePortalRemove = vi.fn(async ({ values }: { values: string[] }) => {
    values.forEach((uid) => selectedPortalUids.delete(uid));
  });
  const routePermissionList = vi.fn(async () => ({
    data: {
      data: Array.from(selectedRouteIds).map((desktopRouteId) => ({
        desktopRouteId,
      })),
    },
  }));
  const routePermissionCreate = vi.fn(async ({ values }: { values: { desktopRouteId: number } }) => {
    if (options.createRouteError) {
      throw options.createRouteError;
    }
    selectedRouteIds.add(values.desktopRouteId);
  });
  const routePermissionDestroy = vi.fn(async ({ filter }: { filter: { desktopRouteId?: number[] } }) => {
    if (options.destroyRouteError) {
      throw options.destroyRouteError;
    }
    (filter.desktopRouteId ?? []).forEach((desktopRouteId) => selectedRouteIds.delete(desktopRouteId));
  });
  const resource = vi.fn((name: string, sourceId?: string) => {
    if (name === 'roles.multiPortals' && sourceId === 'portal-member') {
      return {
        list: rolePortalList,
        add: rolePortalAdd,
        remove: rolePortalRemove,
      };
    }
    if (name === 'rolesMultiPortalDesktopRoutes') {
      return {
        create: routePermissionCreate,
        destroy: routePermissionDestroy,
        list: routePermissionList,
      };
    }
    throw new Error(`Unexpected resource: ${name}`);
  });
  const messageSuccess = vi.fn();

  return {
    context: {
      api: {
        request,
        resource,
      },
      message: {
        success: messageSuccess,
      },
    },
    messageSuccess,
    request,
    resource,
    rolePortalAdd,
    rolePortalList,
    rolePortalRemove,
    routePermissionCreate,
    routePermissionDestroy,
    routePermissionList,
  };
}
