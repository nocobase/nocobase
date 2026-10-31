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
import {
  createDesktopRouteLayoutPermissionFilter,
  registerLayoutAwareDesktopRoutesPermissionsTab,
} from '../permissions/layoutAwareDesktopRoutesPermissions';

const MOBILE_LAYOUT_UID = 'mobile-layout-model';

interface PermissionComponentProps {
  activeKey: string;
  activeRole: {
    name: string;
    title: string;
    allowNewMenu?: boolean;
  };
  onRoleChange: (role: unknown) => void;
}

interface RegisteredPermissionTab {
  key: string;
  label: string;
  sort: number;
  componentLoader: () => Promise<{
    default: React.ComponentType<PermissionComponentProps>;
  }>;
}

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
      'uiLayouts.uid': DEFAULT_ADMIN_UI_LAYOUT.uid,
    });
  });

  it('should create a layout-scoped route permission filter for non-admin layouts', () => {
    expect(createDesktopRouteLayoutPermissionFilter(MOBILE_LAYOUT_UID)).toEqual({
      hidden: { $ne: true },
      'uiLayouts.uid': MOBILE_LAYOUT_UID,
    });
  });

  it('should register separate desktop and mobile route permission tabs', async () => {
    const addPermissionsTab = vi.fn();
    const app = {
      pm: {
        get: vi.fn(() => ({
          settingsUI: {
            addPermissionsTab,
          },
        })),
      },
    };

    registerLayoutAwareDesktopRoutesPermissionsTab(app as never, (key) => key);
    const registeredTabs = addPermissionsTab.mock.calls.map(([options]) => options) as RegisteredPermissionTab[];
    const desktopTab = registeredTabs.find((tab) => tab.key === 'menu');
    const mobileTab = registeredTabs.find((tab) => tab.key === 'mobile-routes');

    expect(addPermissionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'menu',
        label: 'Desktop routes',
        sort: 20,
      }),
    );
    expect(addPermissionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'mobile-routes',
        label: 'Mobile routes',
        sort: 21,
      }),
    );
    expect(addPermissionsTab).not.toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'UI layouts',
      }),
    );
    expect(desktopTab).toBeDefined();
    expect(mobileTab).toBeDefined();
    if (!desktopTab || !mobileTab) {
      throw new Error('Desktop and mobile route permission tabs should be registered.');
    }

    const desktopResource = createRoutePermissionResources({
      selectedRouteIds: [],
    });
    flowMocks.context = desktopResource.context;
    const DesktopComponent = (await desktopTab.componentLoader()).default;

    render(
      <DesktopComponent
        activeKey="menu"
        activeRole={{ name: 'route-member', title: 'Route member' }}
        onRoleChange={vi.fn()}
      />,
    );

    expect(await screen.findByText('Desktop routes')).toBeInTheDocument();
    await waitFor(() => {
      expect(desktopResource.desktopRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: createDesktopRouteLayoutPermissionFilter(DEFAULT_ADMIN_UI_LAYOUT.uid),
        }),
      );
    });
    cleanup();

    const mobileResource = createRoutePermissionResources({
      selectedRouteIds: [],
    });
    flowMocks.context = mobileResource.context;
    const MobileComponent = (await mobileTab.componentLoader()).default;

    render(
      <MobileComponent
        activeKey="mobile-routes"
        activeRole={{ name: 'route-member', title: 'Route member' }}
        onRoleChange={vi.fn()}
      />,
    );

    expect(await screen.findByText('Mobile routes')).toBeInTheDocument();
    await waitFor(() => {
      expect(mobileResource.desktopRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: createDesktopRouteLayoutPermissionFilter(MOBILE_LAYOUT_UID),
        }),
      );
      expect(mobileResource.roleRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { hidden: { $ne: true }, 'uiLayouts.uid': MOBILE_LAYOUT_UID },
        }),
      );
    });
  });

  it('should skip permission tab registration when ACL plugin manager is unavailable', () => {
    expect(() => registerLayoutAwareDesktopRoutesPermissionsTab({} as never, (key) => key)).not.toThrow();
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
          filter: { hidden: { $ne: true }, 'uiLayouts.uid': DEFAULT_ADMIN_UI_LAYOUT.uid },
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
          filter: { hidden: { $ne: true }, 'uiLayouts.uid': MOBILE_LAYOUT_UID },
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
    await waitFor(() => {
      expect(adminRoute).not.toHaveStyle({ pointerEvents: 'none' });
    });

    await act(async () => {
      await user.click(adminRoute);
    });

    await waitFor(() => {
      expect(resource.roleRoutesRemove).toHaveBeenCalledWith({ values: [1] });
    });
    expect(adminRoute).toBeChecked();
    expect(resource.messageSuccess).not.toHaveBeenCalled();
  });

  it('shows authorized legacy ancestors as read-only and preserves them when changing v2 routes', async () => {
    const resource = createRoutePermissionResources({
      selectedRouteIds: [9, 10, 11, 1],
      desktopRoutes: [
        { id: 9, title: 'Legacy parent', type: 'page', children: [{ id: 10, title: 'Legacy tab', type: 'tabs' }] },
        { id: 11, title: 'V1 only', type: 'page' },
        { id: 1, title: 'V2 page', type: 'flowPage' },
      ],
    });
    flowMocks.context = resource.context;
    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'route-member', title: 'Member' }}
        onRoleChange={vi.fn()}
      />,
    );
    const legacy = await screen.findByRole('checkbox', { name: 'Allow access to Legacy parent' });
    await waitFor(() => expect(legacy).toBeChecked());
    expect(legacy).toBeDisabled();
    expect(screen.queryByText('V1 only')).not.toBeInTheDocument();
    const v2 = screen.getByRole('checkbox', { name: 'Allow access to V2 page' });
    await waitFor(() => expect(v2).not.toBeDisabled());
    expect(resource.roleRoutesAdd).not.toHaveBeenCalled();
    expect(resource.roleRoutesRemove).not.toHaveBeenCalled();
    await act(async () => {
      await userEvent.click(v2);
    });
    await waitFor(() => expect(resource.roleRoutesRemove).toHaveBeenCalledWith({ values: [1] }));
    expect(resource.getSelectedRouteIds()).toEqual([9, 10, 11]);
    await act(async () => {
      await userEvent.click(screen.getByRole('checkbox', { name: /^Allow access$/ }));
    });
    await waitFor(() => expect(resource.roleRoutesAdd).toHaveBeenCalledWith({ values: [1] }));
    expect(resource.getSelectedRouteIds()).toEqual([9, 10, 11, 1]);
    expect(legacy).toBeChecked();
    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText('Search routes'), 'Legacy tab');
    });
    const tab = await screen.findByRole('checkbox', { name: 'Allow access to Legacy tab' });
    expect(tab).toBeChecked();
    expect(tab).toBeDisabled();
  });

  it('does not grant previously denied v1 permissions when selecting all v2 routes', async () => {
    const resource = createRoutePermissionResources({
      selectedRouteIds: [],
      desktopRoutes: [
        { id: 9, title: 'Denied V1', type: 'page', children: [{ id: 10, title: 'V1 tab', type: 'tabs' }] },
        { id: 1, title: 'V2 page', type: 'flowPage' },
      ],
    });
    flowMocks.context = resource.context;
    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'route-member', title: 'Member' }}
        onRoleChange={vi.fn()}
      />,
    );
    const legacy = await screen.findByRole('checkbox', { name: 'Allow access to Denied V1' });
    expect(legacy).toBeDisabled();
    expect(legacy).not.toBeChecked();
    const all = screen.getByRole('checkbox', { name: /^Allow access$/ });
    await waitFor(() => expect(all).not.toBeDisabled());
    await act(async () => {
      await userEvent.click(all);
    });
    await waitFor(() => expect(resource.roleRoutesAdd).toHaveBeenCalledWith({ values: [1] }));
    expect(resource.getSelectedRouteIds()).toEqual([1]);
    expect(legacy).not.toBeChecked();
  });

  it('never removes legacy descendants when toggling a shared menu group', async () => {
    const resource = createRoutePermissionResources({
      selectedRouteIds: [20, 9, 10, 1],
      desktopRoutes: [
        {
          id: 20,
          title: 'Shared group',
          type: 'group',
          children: [
            { id: 9, title: 'Legacy parent', type: 'page', children: [{ id: 10, title: 'Legacy tab', type: 'tabs' }] },
            { id: 1, title: 'V2 page', type: 'flowPage' },
          ],
        },
      ],
    });
    flowMocks.context = resource.context;
    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'route-member', title: 'Member' }}
        onRoleChange={vi.fn()}
      />,
    );
    const group = await screen.findByRole('checkbox', { name: 'Allow access to Shared group' });
    await waitFor(() => expect(group).not.toBeDisabled());
    await act(async () => {
      await userEvent.click(group);
    });
    await waitFor(() => expect(resource.roleRoutesRemove).toHaveBeenCalled());
    expect(resource.getSelectedRouteIds()).toContain(9);
    expect(resource.getSelectedRouteIds()).toContain(10);
    expect(resource.getSelectedRouteIds()).toContain(20);
  });
});

interface TestRoute {
  id: number;
  title: string;
  type: string;
  children?: TestRoute[];
}

type RoutePermissionResourceOptions = {
  desktopRoutes?: TestRoute[];
  addError?: Error;
  removeError?: Error;
  selectedRouteIds: number[];
};

function createRoutePermissionResources(options: RoutePermissionResourceOptions) {
  const selectedRouteIds = new Set(options.selectedRouteIds);
  const desktopRoutes: TestRoute[] = options.desktopRoutes ?? [
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
  const mobileRoutes: TestRoute[] = [
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
      const filterTree = (items: TestRoute[]): TestRoute[] =>
        items.flatMap((route) => {
          const children = filterTree(route.children ?? []);
          return route.type !== 'page' || children.length ? [{ ...route, children }] : [];
        });
      return filterTree(records);
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
      data: getRouteRecords(params?.filter as Record<string, unknown> | undefined)
        .flatMap(function flatten(route): TestRoute[] {
          return [route, ...(route.children ?? []).flatMap(flatten)];
        })
        .filter((route) => selectedRouteIds.has(route.id)),
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
    getSelectedRouteIds: () => [...selectedRouteIds],
    messageSuccess,
    request,
    resource,
    roleRoutesAdd,
    roleRoutesList,
    roleRoutesRemove,
    rolesUpdate,
  };
}
