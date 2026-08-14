/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import LayoutAwareDesktopRoutesPermissionsTab, {
  MobileRoutesPermissionsTab,
} from '../permissions/LayoutAwareDesktopRoutesPermissionsTab';
import { createDesktopRouteLayoutPermissionFilter } from '../permissions/layoutAwareDesktopRoutesPermissions';

const MOBILE_LAYOUT_UID = 'mobile-layout-model';

const flowMocks = vi.hoisted(() => ({
  context: undefined as
    | {
        api: {
          resource: ReturnType<typeof vi.fn>;
          request?: ReturnType<typeof vi.fn>;
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

describe('plugin-ui-layout route permissions', () => {
  afterEach(() => {
    cleanup();
    flowMocks.context = undefined;
  });

  it('should create an AdminLayout route permission filter with explicit layout ownership', () => {
    expect(createDesktopRouteLayoutPermissionFilter(DEFAULT_ADMIN_UI_LAYOUT.uid)).toEqual({
      hidden: { $ne: true },
      type: { $ne: 'page' },
      'uiLayouts.uid': DEFAULT_ADMIN_UI_LAYOUT.uid,
    });
  });

  it('should create a layout-scoped route permission filter for non-admin layouts', () => {
    expect(createDesktopRouteLayoutPermissionFilter(MOBILE_LAYOUT_UID)).toEqual({
      hidden: { $ne: true },
      type: { $ne: 'page' },
      'uiLayouts.uid': MOBILE_LAYOUT_UID,
    });
  });

  it('should render desktop route permissions without layout access controls', async () => {
    const resource = createRoutePermissionResources({
      selectedRouteIds: [1, 9],
    });
    const user = userEvent.setup();
    flowMocks.context = resource.context;
    const onRoleChange = vi.fn();

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'route-member', title: 'Route member', allowNewMenu: false }}
        onRoleChange={onRoleChange}
      />,
    );

    expect(await screen.findByText('Desktop routes')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Allow access to Admin route' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Allow access to Reports' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Allow access to Route group' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Allow access to Docs link' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Allow access to Page tabs' })).not.toBeChecked();
    expect(screen.queryByText('Legacy page')).not.toBeInTheDocument();
    expect(screen.queryByText('Layout access')).not.toBeInTheDocument();
    expect(screen.queryByText('New layouts are allowed to be accessed by default')).not.toBeInTheDocument();
    expect(screen.queryByText('Allow access to this layout')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(resource.desktopRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: createDesktopRouteLayoutPermissionFilter(DEFAULT_ADMIN_UI_LAYOUT.uid),
        }),
      );
      expect(resource.roleRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: createDesktopRouteLayoutPermissionFilter(DEFAULT_ADMIN_UI_LAYOUT.uid),
        }),
      );
    });
    expect(resource.request).not.toHaveBeenCalled();
    expect(resource.resource).not.toHaveBeenCalledWith('rolesUiLayouts');
    expect(resource.resource).not.toHaveBeenCalledWith('rolesUiLayoutDesktopRoutes');
    expect(screen.getByRole('checkbox', { name: 'Allow access to Admin route' })).toBeChecked();

    await act(async () => {
      await user.click(screen.getByRole('checkbox', { name: 'Allow access to Reports' }));
    });

    await waitFor(() => {
      expect(resource.roleRoutesAdd).toHaveBeenCalledWith({ values: [2] });
    });
    expect(resource.messageSuccess).toHaveBeenCalledWith('Saved successfully');

    await act(async () => {
      await user.click(screen.getByRole('checkbox', { name: 'New routes are allowed to be accessed by default' }));
    });

    await waitFor(() => {
      expect(resource.rolesUpdate).toHaveBeenCalledWith({
        filterByTk: 'route-member',
        values: { allowNewMenu: true },
      });
    });
    expect(onRoleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'route-member',
        allowNewMenu: true,
      }),
    );
  });

  it('should render mobile route permissions with the mobile layout filter', async () => {
    const resource = createRoutePermissionResources({
      selectedRouteIds: [],
    });
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <MobileRoutesPermissionsTab
        activeKey="mobile-routes"
        activeRole={{ name: 'route-member', title: 'Route member' }}
        onRoleChange={vi.fn()}
      />,
    );

    expect(await screen.findByText('Mobile routes')).toBeInTheDocument();
    const mobileRoute = screen.getByRole('checkbox', { name: 'Allow access to Mobile route' });
    expect(mobileRoute).not.toBeChecked();

    await waitFor(() => {
      expect(resource.desktopRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: createDesktopRouteLayoutPermissionFilter(MOBILE_LAYOUT_UID),
        }),
      );
      expect(resource.roleRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: createDesktopRouteLayoutPermissionFilter(MOBILE_LAYOUT_UID),
        }),
      );
    });

    await act(async () => {
      await user.click(mobileRoute);
    });

    await waitFor(() => {
      expect(resource.roleRoutesAdd).toHaveBeenCalledWith({ values: [3] });
    });
  });

  it('should keep route unchecked and avoid success when adding permission fails', async () => {
    const resource = createRoutePermissionResources({
      addError: new Error('create failed'),
      selectedRouteIds: [],
    });
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'route-member', title: 'Route member' }}
        onRoleChange={vi.fn()}
      />,
    );

    const reports = await screen.findByRole('checkbox', { name: 'Allow access to Reports' });
    await waitFor(() => {
      expect(reports).not.toHaveStyle({ pointerEvents: 'none' });
    });

    await act(async () => {
      await user.click(reports);
    });

    await waitFor(() => {
      expect(resource.roleRoutesAdd).toHaveBeenCalledWith({ values: [2] });
    });
    expect(reports).not.toBeChecked();
    expect(resource.messageSuccess).not.toHaveBeenCalled();
  });

  it('should keep route checked and avoid success when removing permission fails', async () => {
    const resource = createRoutePermissionResources({
      removeError: new Error('destroy failed'),
      selectedRouteIds: [1],
    });
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'route-member', title: 'Route member' }}
        onRoleChange={vi.fn()}
      />,
    );

    const adminRoute = await screen.findByRole('checkbox', { name: 'Allow access to Admin route' });
    expect(adminRoute).toBeChecked();

    await act(async () => {
      await user.click(adminRoute);
    });

    await waitFor(() => {
      expect(resource.roleRoutesRemove).toHaveBeenCalledWith({ values: [1] });
    });
    expect(adminRoute).toBeChecked();
    expect(resource.messageSuccess).not.toHaveBeenCalled();
  });
});

type RoutePermissionResourceOptions = {
  addError?: Error;
  removeError?: Error;
  selectedRouteIds: number[];
};

function createRoutePermissionResources(options: RoutePermissionResourceOptions) {
  const selectedRouteIds = new Set(options.selectedRouteIds);
  const desktopRoutes = [
    {
      id: 1,
      title: 'Admin route',
      type: 'flowPage',
    },
    {
      id: 2,
      title: 'Reports',
      type: 'flowPage',
    },
    {
      id: 4,
      title: 'Route group',
      type: 'group',
    },
    {
      id: 5,
      title: 'Docs link',
      type: 'link',
    },
    {
      id: 6,
      title: 'Page tabs',
      type: 'tabs',
    },
    {
      id: 9,
      title: 'Legacy page',
      type: 'page',
    },
  ];
  const mobileRoutes = [
    {
      id: 3,
      title: 'Mobile route',
      type: 'flowPage',
    },
    {
      id: 10,
      title: 'Legacy mobile page',
      type: 'page',
    },
  ];
  const getRouteRecords = (filter?: Record<string, unknown>) => {
    const records = filter?.['uiLayouts.uid'] === MOBILE_LAYOUT_UID ? mobileRoutes : desktopRoutes;
    const typeFilter = filter?.type;

    if (
      typeFilter &&
      typeof typeFilter === 'object' &&
      '$ne' in typeFilter &&
      (typeFilter as { $ne?: unknown }).$ne === 'page'
    ) {
      return records.filter((route) => route.type !== 'page');
    }

    return records;
  };
  const desktopRoutesList = vi.fn(async (params?: Record<string, unknown>) => ({
    data: {
      data: getRouteRecords(params?.filter as Record<string, unknown> | undefined),
    },
  }));
  const roleRoutesList = vi.fn(async (params?: Record<string, unknown>) => ({
    data: {
      data: getRouteRecords(params?.filter as Record<string, unknown> | undefined).filter((route) =>
        selectedRouteIds.has(route.id),
      ),
    },
  }));
  const roleRoutesAdd = vi.fn(async ({ values }: { values: number[] }) => {
    if (options.addError) {
      throw options.addError;
    }
    values.forEach((id) => selectedRouteIds.add(id));
  });
  const roleRoutesRemove = vi.fn(async ({ values }: { values: number[] }) => {
    if (options.removeError) {
      throw options.removeError;
    }
    values.forEach((id) => selectedRouteIds.delete(id));
  });
  const rolesUpdate = vi.fn(async ({ values }: { values: Record<string, unknown> }) => ({
    data: {
      data: values,
    },
  }));
  const request = vi.fn(async () => {
    throw new Error('UI Layout route permissions should not use custom request readers.');
  });
  const messageSuccess = vi.fn();
  const resource = vi.fn((name: string, sourceId?: string) => {
    if (name === 'desktopRoutes') {
      return {
        list: desktopRoutesList,
      };
    }
    if (name === 'roles.desktopRoutes' && sourceId === 'route-member') {
      return {
        list: roleRoutesList,
        add: roleRoutesAdd,
        remove: roleRoutesRemove,
      };
    }
    if (name === 'roles') {
      return {
        update: rolesUpdate,
      };
    }
    throw new Error(`Unexpected resource: ${name}`);
  });

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
    desktopRoutesList,
    messageSuccess,
    request,
    resource,
    roleRoutesAdd,
    roleRoutesList,
    roleRoutesRemove,
    rolesUpdate,
  };
}
