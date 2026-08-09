/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App as AntdApp } from 'antd';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
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
const defaultT = flowMocks.engine.context.t;

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
    flowMocks.engine.context.t = defaultT;
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

    expect(await screen.findByText('Portals')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Allow access to Customer portal' })).toBeChecked();
    expect(screen.getByRole('columnheader', { name: 'Routes permissions' })).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Configure routes permissions for Customer portal' }));
    });

    const drawer = await screen.findByRole('dialog', {
      name: 'Configure routes permissions for Customer portal',
    });
    expect(drawer).toBeInTheDocument();
    const reportsRoute = await screen.findByRole('checkbox', { name: 'Allow access to Reports' });
    expect(reportsRoute).not.toBeChecked();

    await waitFor(() => {
      expect(resource.request).toHaveBeenCalledWith({
        url: 'desktopRoutes:listRolePermissionTargets',
        method: 'get',
        params: {
          portal: 'customer-portal',
        },
        skipNotify: true,
      });
      expect(resource.request.mock.calls[1]?.[0].params).not.toHaveProperty('layout');
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

  it('should use layout route permissions for the fixed Admin Portal', async () => {
    const resource = createMultiPortalPermissionResources({
      portals: [
        {
          uid: '__default_admin__',
          title: 'Desktop portal',
          portalType: 'no-code',
        },
      ],
      selectedPortalUids: [],
      selectedRouteIds: [],
    });
    const user = userEvent.setup();
    const onRoleChange = vi.fn();
    flowMocks.context = resource.context;

    render(
      <AntdApp>
        <MultiPortalPermissionsTab
          activeKey="multi-portals"
          activeRole={{
            name: 'portal-member',
            title: 'Member',
            allowNewMenu: false,
          }}
          onRoleChange={onRoleChange}
        />
      </AntdApp>,
    );

    const desktopPortalRow = await screen.findByRole('row', { name: /Desktop portal/ });
    expect(within(desktopPortalRow).getByText('-')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Allow access to Desktop portal' })).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Configure routes permissions for Desktop portal' }));
    });

    const drawer = await screen.findByRole('dialog', {
      name: 'Configure routes permissions for Desktop portal',
    });
    const reportsRoute = within(drawer).getByRole('checkbox', { name: 'Allow access to Reports' });
    const allowNewRoutes = within(drawer).getByRole('checkbox', {
      name: 'New routes are allowed to be accessed by default',
    });

    await waitFor(() => {
      expect(resource.layoutRoutePermissionList).toHaveBeenCalledWith({
        paginate: false,
        filter: {
          id: [1, 2],
        },
      });
    });
    expect(resource.routePermissionList).not.toHaveBeenCalled();
    expect(resource.routeDefaultPolicyList).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(reportsRoute);
    });
    await waitFor(() => {
      expect(resource.layoutRoutePermissionAdd).toHaveBeenCalledWith({ values: [2] });
    });
    expect(resource.routePermissionCreate).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(allowNewRoutes);
    });
    await waitFor(() => {
      expect(resource.rolesUpdate).toHaveBeenCalledWith({
        filterByTk: 'portal-member',
        values: {
          allowNewMenu: true,
        },
      });
    });
    expect(onRoleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'portal-member',
        allowNewMenu: true,
      }),
    );
    expect(resource.rolePortalAdd).not.toHaveBeenCalled();
    expect(resource.rolePortalRemove).not.toHaveBeenCalled();
  });

  it('should only expose entry access permission for an AI portal', async () => {
    const resource = createMultiPortalPermissionResources({
      portals: [
        {
          uid: 'ai-workspace',
          title: 'AI workspace',
          portalType: 'ai',
        },
      ],
      selectedPortalUids: [],
      selectedRouteIds: [],
    });
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <AntdApp>
        <MultiPortalPermissionsTab activeKey="multi-portals" activeRole={{ name: 'portal-member', title: 'Member' }} />
      </AntdApp>,
    );

    const allowAccess = await screen.findByRole('checkbox', { name: 'Allow access to AI workspace' });
    expect(
      screen.queryByRole('button', { name: 'Configure routes permissions for AI workspace' }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await user.click(allowAccess);
    });

    await waitFor(() => {
      expect(resource.rolePortalAdd).toHaveBeenCalledWith({ values: ['ai-workspace'] });
    });
    expect(resource.request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'desktopRoutes:listRolePermissionTargets',
      }),
    );
    expect(resource.routePermissionList).not.toHaveBeenCalled();
    expect(resource.routeDefaultPolicyList).not.toHaveBeenCalled();
  });

  it('should keep portal titles raw while translating route titles', async () => {
    const resource = createMultiPortalPermissionResources({
      portals: [
        {
          uid: 'main-portal',
          title: 'Main',
          portalType: 'no-code',
        },
      ],
      routes: [
        {
          id: 1,
          title: 'Main',
        },
      ],
      selectedPortalUids: ['main-portal'],
      selectedRouteIds: [],
    });
    const user = userEvent.setup();
    flowMocks.context = resource.context;
    flowMocks.engine.context.t = (key, options) => (key === 'Main' ? '主数据源' : defaultT(key, options));

    render(
      <AntdApp>
        <MultiPortalPermissionsTab activeKey="multi-portals" activeRole={{ name: 'portal-member', title: 'Member' }} />
      </AntdApp>,
    );

    expect(await screen.findByText('Main')).toBeInTheDocument();
    expect(screen.queryByText('主数据源')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Allow access to Main' })).toBeChecked();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Configure routes permissions for Main' }));
    });

    const drawer = await screen.findByRole('dialog', { name: 'Configure routes permissions for Main' });
    expect(within(drawer).getByText('主数据源')).toBeInTheDocument();
    expect(within(drawer).getByRole('checkbox', { name: 'Allow access to 主数据源' })).not.toBeChecked();
  });

  it('should not expose route permissions for missing or unknown portal types', async () => {
    const resource = createMultiPortalPermissionResources({
      portals: [
        {
          uid: 'missing-type-workspace',
          title: 'Missing type workspace',
          portalType: null,
        },
        {
          uid: 'unknown-type-workspace',
          title: 'Unknown type workspace',
          portalType: 'unknown',
        },
      ],
      selectedPortalUids: [],
      selectedRouteIds: [],
    });
    flowMocks.context = resource.context;

    render(
      <AntdApp>
        <MultiPortalPermissionsTab activeKey="multi-portals" activeRole={{ name: 'portal-member', title: 'Member' }} />
      </AntdApp>,
    );

    expect(await screen.findByText('Missing type workspace')).toBeInTheDocument();
    expect(screen.getByText('Unknown type workspace')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Configure routes permissions for Missing type workspace' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Configure routes permissions for Unknown type workspace' }),
    ).not.toBeInTheDocument();
    expect(resource.request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'desktopRoutes:listRolePermissionTargets',
      }),
    );
  });

  it('should include hidden descendants when bulk granting visible portal routes', async () => {
    const resource = createMultiPortalPermissionResources({
      routes: [
        {
          id: 1,
          title: 'Home',
          children: [
            {
              id: 2,
              title: 'Hidden setup',
              hidden: true,
            },
          ],
        },
        {
          id: 3,
          title: 'Reports',
        },
      ],
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
      name: 'Configure routes permissions for Customer portal',
    });
    await act(async () => {
      await user.click(configureButton);
    });
    const drawer = await screen.findByRole('dialog', {
      name: 'Configure routes permissions for Customer portal',
    });

    await act(async () => {
      await user.click(within(drawer).getByRole('checkbox', { name: 'Allow access' }));
    });

    await waitFor(() => {
      expect(resource.routePermissionCreate).toHaveBeenCalledTimes(3);
    });
    expect(resource.routePermissionCreate.mock.calls.map(([params]) => params.values.desktopRouteId)).toEqual([
      1, 2, 3,
    ]);
  });

  it('should configure the default route access policy in the portal route drawer', async () => {
    const resource = createMultiPortalPermissionResources({
      routeDefaultPolicy: {
        id: 1001,
        allowNewMenu: true,
      },
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
      name: 'Configure routes permissions for Customer portal',
    });
    await act(async () => {
      await user.click(configureButton);
    });

    const drawer = await screen.findByRole('dialog', {
      name: 'Configure routes permissions for Customer portal',
    });
    const routeDefaultPolicy = within(drawer).getByRole('checkbox', {
      name: 'New routes are allowed to be accessed by default',
    });
    const routeSearch = within(drawer).getByRole('searchbox', { name: 'Search routes' });

    expect(routeDefaultPolicy).toBeChecked();
    expect(routeDefaultPolicy.compareDocumentPosition(routeSearch)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    await waitFor(() => {
      expect(resource.routeDefaultPolicyList).toHaveBeenCalledWith({
        paginate: false,
        filter: {
          roleName: 'portal-member',
          multiPortalUid: 'customer-portal',
        },
      });
    });

    await act(async () => {
      await user.click(routeDefaultPolicy);
    });

    await waitFor(() => {
      expect(resource.routeDefaultPolicyUpdate).toHaveBeenCalledWith({
        filter: {
          roleName: 'portal-member',
          multiPortalUid: 'customer-portal',
        },
        values: {
          allowNewMenu: false,
        },
      });
    });
    expect(routeDefaultPolicy).not.toBeChecked();
    expect(
      screen.getByRole('dialog', { name: 'Configure routes permissions for Customer portal' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Portals')).toBeInTheDocument();
    expect(resource.messageSuccess).toHaveBeenCalledWith('Saved successfully');
  });

  it('should not show saved state when the default route access policy save fails', async () => {
    const resource = createMultiPortalPermissionResources({
      routeDefaultPolicy: {
        id: 1001,
        allowNewMenu: true,
      },
      routeDefaultPolicyUpdateError: new Error('update failed'),
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
      name: 'Configure routes permissions for Customer portal',
    });
    await act(async () => {
      await user.click(configureButton);
    });
    const routeDefaultPolicy = await screen.findByRole('checkbox', {
      name: 'New routes are allowed to be accessed by default',
    });

    await act(async () => {
      await user.click(routeDefaultPolicy);
    });

    await waitFor(() => {
      expect(resource.routeDefaultPolicyUpdate).toHaveBeenCalled();
    });
    expect(routeDefaultPolicy).toBeChecked();
    expect(resource.messageSuccess).not.toHaveBeenCalled();
  });

  it('should update the current role default portal access without leaving the tab', async () => {
    const resource = createMultiPortalPermissionResources({
      selectedPortalUids: ['customer-portal'],
      selectedRouteIds: [],
    });
    const user = userEvent.setup();
    const onRoleChange = vi.fn();
    flowMocks.context = resource.context;

    render(
      <AntdApp>
        <MultiPortalPermissionsTab
          activeKey="multi-portals"
          activeRole={{ name: 'portal-member', title: 'Member', allowNewMultiPortal: false }}
          onRoleChange={onRoleChange}
        />
      </AntdApp>,
    );

    const defaultAccessSwitch = await screen.findByRole('checkbox', {
      name: 'New portals are allowed to be accessed by default',
    });

    await act(async () => {
      await user.click(defaultAccessSwitch);
    });

    await waitFor(() => {
      expect(resource.rolesUpdate).toHaveBeenCalledWith({
        filterByTk: 'portal-member',
        values: {
          allowNewMultiPortal: true,
        },
      });
    });
    expect(onRoleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'portal-member',
        allowNewMultiPortal: true,
      }),
    );
    expect(screen.getByText('Portals')).toBeInTheDocument();
  });

  it('should show an empty portal route drawer when the portal has no routes', async () => {
    const resource = createMultiPortalPermissionResources({
      routes: [],
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
      name: 'Configure routes permissions for Customer portal',
    });
    await act(async () => {
      await user.click(configureButton);
    });

    expect(await screen.findByText('No routes')).toBeInTheDocument();
    expect(resource.request).toHaveBeenCalledWith({
      url: 'desktopRoutes:listRolePermissionTargets',
      method: 'get',
      params: {
        portal: 'customer-portal',
      },
      skipNotify: true,
    });
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
      name: 'Configure routes permissions for Customer portal',
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

type TestRouteRecord = {
  id: number;
  children?: TestRouteRecord[];
  hidden?: boolean;
  title: string;
};

type MultiPortalPermissionResourceOptions = {
  createRouteError?: Error;
  destroyRouteError?: Error;
  routeDefaultPolicy?: {
    id?: number;
    allowNewMenu: boolean;
  } | null;
  routeDefaultPolicyCreateError?: Error;
  routeDefaultPolicyUpdateError?: Error;
  portals?: TestPortalRecord[];
  routes?: TestRouteRecord[];
  selectedPortalUids: string[];
  selectedRouteIds: number[];
};

type TestPortalRecord = {
  uid: string;
  title: string;
  portalType?: string | null;
};

function createMultiPortalPermissionResources(options: MultiPortalPermissionResourceOptions) {
  const selectedPortalUids = new Set(options.selectedPortalUids);
  const selectedRouteIds = new Set(options.selectedRouteIds);
  let routeDefaultPolicyRecord =
    options.routeDefaultPolicy === undefined
      ? {
          id: 1001,
          roleName: 'portal-member',
          multiPortalUid: 'customer-portal',
          allowNewMenu: false,
        }
      : options.routeDefaultPolicy
        ? {
            id: options.routeDefaultPolicy.id ?? 1001,
            roleName: 'portal-member',
            multiPortalUid: 'customer-portal',
            allowNewMenu: options.routeDefaultPolicy.allowNewMenu,
          }
        : undefined;
  const portals = options.portals ?? [
    {
      uid: 'customer-portal',
      title: 'Customer portal',
      portalType: 'no-code',
    },
  ];
  const routes = options.routes ?? [
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
  const rolesUpdate = vi.fn(async () => undefined);
  const layoutRoutePermissionList = vi.fn(async () => ({
    data: {
      data: Array.from(selectedRouteIds).map((id) => ({ id })),
    },
  }));
  const layoutRoutePermissionAdd = vi.fn(async ({ values }: { values: number[] }) => {
    values.forEach((id) => selectedRouteIds.add(id));
  });
  const layoutRoutePermissionRemove = vi.fn(async ({ values }: { values: number[] }) => {
    values.forEach((id) => selectedRouteIds.delete(id));
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
  const routeDefaultPolicyList = vi.fn(async () => ({
    data: {
      data: routeDefaultPolicyRecord ? [routeDefaultPolicyRecord] : [],
    },
  }));
  const routeDefaultPolicyCreate = vi.fn(
    async ({ values }: { values: { roleName: string; multiPortalUid: string; allowNewMenu: boolean } }) => {
      if (options.routeDefaultPolicyCreateError) {
        throw options.routeDefaultPolicyCreateError;
      }
      routeDefaultPolicyRecord = {
        id: 1001,
        ...values,
      };
    },
  );
  const routeDefaultPolicyUpdate = vi.fn(async ({ values }: { values: { allowNewMenu: boolean } }) => {
    if (options.routeDefaultPolicyUpdateError) {
      throw options.routeDefaultPolicyUpdateError;
    }
    if (routeDefaultPolicyRecord) {
      routeDefaultPolicyRecord = {
        ...routeDefaultPolicyRecord,
        allowNewMenu: values.allowNewMenu,
      };
    }
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
    if (name === 'rolesMultiPortalRoutePolicies') {
      return {
        create: routeDefaultPolicyCreate,
        list: routeDefaultPolicyList,
        update: routeDefaultPolicyUpdate,
      };
    }
    if (name === 'roles.desktopRoutes' && sourceId === 'portal-member') {
      return {
        add: layoutRoutePermissionAdd,
        list: layoutRoutePermissionList,
        remove: layoutRoutePermissionRemove,
      };
    }
    if (name === 'roles') {
      return {
        update: rolesUpdate,
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
    layoutRoutePermissionAdd,
    layoutRoutePermissionList,
    layoutRoutePermissionRemove,
    messageSuccess,
    request,
    resource,
    rolePortalAdd,
    rolePortalList,
    rolePortalRemove,
    rolesUpdate,
    routeDefaultPolicyCreate,
    routeDefaultPolicyList,
    routeDefaultPolicyUpdate,
    routePermissionCreate,
    routePermissionDestroy,
    routePermissionList,
  };
}
