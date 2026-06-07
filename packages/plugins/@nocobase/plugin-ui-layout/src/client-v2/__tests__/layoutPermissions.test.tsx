/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import LayoutAwareDesktopRoutesPermissionsTab, {
  getLayoutLabel,
} from '../permissions/LayoutAwareDesktopRoutesPermissionsTab';
import {
  createDesktopRouteLayoutPermissionFilter,
  getLayoutScopedPermissionChanges,
  registerLayoutAwareDesktopRoutesPermissionsTab,
} from '../permissions/layoutAwareDesktopRoutesPermissions';

const flowMocks = vi.hoisted(() => ({
  context: undefined as
    | {
        api: {
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

describe('plugin-ui-layout route permissions', () => {
  afterEach(() => {
    cleanup();
    flowMocks.context = undefined;
  });

  it('should use the persisted ui layout title as the layout selector label', () => {
    const t = vi.fn((key: string) => `t:${key}`);

    expect(
      getLayoutLabel(
        {
          uid: 'admin-layout-model',
          title: 'Admin portal',
          layoutType: 'desktop',
          routeName: 'admin',
        },
        t,
      ),
    ).toBe('t:Admin portal');
    expect(
      getLayoutLabel(
        {
          uid: 'mobile-layout-model',
          layoutType: 'mobile',
          routeName: 'mobile',
        },
        t,
      ),
    ).toBe('t:Mobile layout');
  });

  it('should create an AdminLayout route permission filter with unassigned routes', () => {
    expect(createDesktopRouteLayoutPermissionFilter(DEFAULT_ADMIN_UI_LAYOUT.uid)).toEqual({
      hidden: { $ne: true },
      $or: [{ 'uiLayouts.uid': DEFAULT_ADMIN_UI_LAYOUT.uid }, { 'uiLayouts.id.$notExists': true }],
    });
  });

  it('should create a layout-scoped route permission filter for non-admin layouts', () => {
    expect(createDesktopRouteLayoutPermissionFilter('mobile-layout-model')).toEqual({
      hidden: { $ne: true },
      'uiLayouts.uid': 'mobile-layout-model',
    });
  });

  it('should compute add/remove changes without touching another layout route permission', () => {
    expect(
      getLayoutScopedPermissionChanges({
        currentLayoutRouteIds: [2, 3],
        nextSelectedIds: [2],
        selectedIds: [2, 3],
      }),
    ).toEqual({
      add: [],
      remove: [3],
    });

    expect(
      getLayoutScopedPermissionChanges({
        currentLayoutRouteIds: [2, 3],
        nextSelectedIds: [2, 3],
        selectedIds: [2],
      }),
    ).toEqual({
      add: [3],
      remove: [],
    });
  });

  it('should override the default ACL desktop routes permission tab from plugin-ui-layout', async () => {
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

    expect(app.pm.get).toHaveBeenCalledWith('acl');
    expect(addPermissionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'menu',
        label: 'Desktop routes',
        sort: 20,
      }),
    );

    const tab = addPermissionsTab.mock.calls[0][0];
    await expect(tab.componentLoader()).resolves.toHaveProperty('default');
  });

  it('should skip permission tab registration when ACL plugin manager is unavailable', () => {
    expect(() => registerLayoutAwareDesktopRoutesPermissionsTab({} as never, (key) => key)).not.toThrow();
  });

  it('should show layout-scoped empty and error states without stale route rows', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resource = createPermissionTabResources();

    try {
      flowMocks.context = resource.context;

      render(
        <LayoutAwareDesktopRoutesPermissionsTab
          activeKey="menu"
          activeRole={{ name: 'layout-member', title: 'Layout member' }}
          onRoleChange={vi.fn()}
        />,
      );

      expect(await screen.findByText('Admin route')).toBeInTheDocument();

      await selectLayout('Broken layout');

      expect(await screen.findByText('Failed to load routes for Broken layout')).toBeInTheDocument();
      expect(screen.queryByText('Admin route')).not.toBeInTheDocument();

      await selectLayout('Empty layout');

      expect(await screen.findByText('No routes in Empty layout')).toBeInTheDocument();
      expect(screen.queryByText('Admin route')).not.toBeInTheDocument();
      expect(resource.desktopRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            'uiLayouts.uid': 'empty-layout',
          }),
        }),
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('should expose labeled permission controls for keyboard access', async () => {
    const resource = createPermissionTabResources();
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'layout-member', title: 'Layout member' }}
        onRoleChange={vi.fn()}
      />,
    );

    expect(await screen.findByRole('combobox', { name: 'Layout' })).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'New routes are allowed to be accessed by default' }),
    ).toBeInTheDocument();

    const routeCheckbox = await screen.findByRole('checkbox', { name: 'Allow access to Admin route' });
    routeCheckbox.focus();
    expect(routeCheckbox).toHaveFocus();

    await act(async () => {
      await user.keyboard('[Space]');
    });

    await waitFor(() => {
      expect(resource.roleRoutesRemove).toHaveBeenCalledWith({ values: [1] });
    });
    expect(resource.messageSuccess).toHaveBeenCalledWith('Saved successfully');
  });

  it('should keep current layout permission state when stale requests finish later', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resource = createConcurrentPermissionTabResources();
    const user = userEvent.setup();

    try {
      flowMocks.context = resource.context;

      render(
        <LayoutAwareDesktopRoutesPermissionsTab
          activeKey="menu"
          activeRole={{ name: 'layout-member', title: 'Layout member' }}
          onRoleChange={vi.fn()}
        />,
      );

      expect(await screen.findByText('Admin route')).toBeInTheDocument();

      await selectLayout('Mobile layout');

      const mobileCheckbox = await screen.findByRole('checkbox', { name: 'Allow access to Mobile route' });

      expect(mobileCheckbox).not.toBeChecked();

      await act(async () => {
        await user.click(mobileCheckbox);
      });

      await waitFor(() => {
        expect(resource.roleRoutesAdd).toHaveBeenCalledWith({ values: [2] });
      });
      expect(resource.roleRoutesList).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            'uiLayouts.uid': 'mobile-layout',
          }),
        }),
      );

      await act(async () => {
        resource.adminRoleRoutes.resolve({
          data: {
            data: [
              {
                id: 1,
                title: 'Admin route',
              },
            ],
          },
        });
        await Promise.resolve();
      });

      expect(screen.getByRole('checkbox', { name: 'Allow access to Mobile route' })).toBeChecked();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});

async function selectLayout(label: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Layout' }));
  fireEvent.click(await screen.findByText(label));
}

function getLayoutUidFromFilter(filter: Record<string, unknown> | undefined) {
  if (filter?.['uiLayouts.uid']) {
    return filter['uiLayouts.uid'];
  }
  if (filter?.$or) {
    return DEFAULT_ADMIN_UI_LAYOUT.uid;
  }
  return undefined;
}

function createPermissionTabResources() {
  const uiLayoutsList = vi.fn(async () => ({
    data: {
      data: [
        {
          uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
          title: 'Desktop layout',
          layoutType: 'desktop',
        },
        {
          uid: 'broken-layout',
          title: 'Broken layout',
          layoutType: 'mobile',
        },
        {
          uid: 'empty-layout',
          title: 'Empty layout',
          layoutType: 'mobile',
        },
      ],
    },
  }));
  const desktopRoutesList = vi.fn(async (params?: Record<string, unknown>) => {
    const layoutUid = getLayoutUidFromFilter(params?.filter as Record<string, unknown> | undefined);

    if (layoutUid === 'broken-layout') {
      throw new Error('Failed to load broken layout routes');
    }
    if (layoutUid === 'empty-layout') {
      return {
        data: {
          data: [],
        },
      };
    }
    return {
      data: {
        data: [
          {
            id: 1,
            title: 'Admin route',
          },
        ],
      },
    };
  });
  const roleRoutesList = vi.fn(async (params?: Record<string, unknown>) => {
    const layoutUid = getLayoutUidFromFilter(params?.filter as Record<string, unknown> | undefined);

    return {
      data: {
        data:
          layoutUid === DEFAULT_ADMIN_UI_LAYOUT.uid
            ? [
                {
                  id: 1,
                  title: 'Admin route',
                },
              ]
            : [],
      },
    };
  });
  const roleRoutesResource = {
    list: roleRoutesList,
    add: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
  };
  const rolesResource = {
    update: vi.fn(async () => ({
      data: {
        data: {
          name: 'layout-member',
          title: 'Layout member',
        },
      },
    })),
  };
  const flowMessageSuccess = vi.fn();

  return {
    desktopRoutesList,
    messageSuccess: flowMessageSuccess,
    roleRoutesRemove: roleRoutesResource.remove,
    context: {
      api: {
        resource: vi.fn((name: string) => {
          if (name === 'uiLayouts') {
            return {
              list: uiLayoutsList,
            };
          }
          if (name === 'desktopRoutes') {
            return {
              list: desktopRoutesList,
            };
          }
          if (name === 'roles.desktopRoutes') {
            return roleRoutesResource;
          }
          if (name === 'roles') {
            return rolesResource;
          }
          throw new Error(`Unexpected resource: ${name}`);
        }),
      },
      message: {
        success: flowMessageSuccess,
      },
    },
  };
}

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

function createConcurrentPermissionTabResources() {
  const adminRoleRoutes = createDeferred<ResourceResponse>();
  const mobileSelectedIds = new Set<number>();
  const uiLayoutsList = vi.fn(async () => ({
    data: {
      data: [
        {
          uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
          title: 'Desktop layout',
          layoutType: 'desktop',
        },
        {
          uid: 'mobile-layout',
          title: 'Mobile layout',
          layoutType: 'mobile',
        },
      ],
    },
  }));
  const desktopRoutesList = vi.fn(async (params?: Record<string, unknown>) => {
    const layoutUid = getLayoutUidFromFilter(params?.filter as Record<string, unknown> | undefined);

    return {
      data: {
        data:
          layoutUid === 'mobile-layout'
            ? [
                {
                  id: 2,
                  title: 'Mobile route',
                },
              ]
            : [
                {
                  id: 1,
                  title: 'Admin route',
                },
              ],
      },
    };
  });
  const roleRoutesList = vi.fn(async (params?: Record<string, unknown>) => {
    const layoutUid = getLayoutUidFromFilter(params?.filter as Record<string, unknown> | undefined);

    if (layoutUid === DEFAULT_ADMIN_UI_LAYOUT.uid) {
      return adminRoleRoutes.promise;
    }

    return {
      data: {
        data: Array.from(mobileSelectedIds).map((id) => ({
          id,
          title: 'Mobile route',
        })),
      },
    };
  });
  const roleRoutesResource = {
    list: roleRoutesList,
    add: vi.fn(async ({ values }: { values: number[] }) => {
      values.forEach((id) => mobileSelectedIds.add(id));
    }),
    remove: vi.fn(async ({ values }: { values: number[] }) => {
      values.forEach((id) => mobileSelectedIds.delete(id));
    }),
  };
  const flowMessageSuccess = vi.fn();

  return {
    adminRoleRoutes,
    roleRoutesAdd: roleRoutesResource.add,
    roleRoutesList,
    context: {
      api: {
        resource: vi.fn((name: string) => {
          if (name === 'uiLayouts') {
            return {
              list: uiLayoutsList,
            };
          }
          if (name === 'desktopRoutes') {
            return {
              list: desktopRoutesList,
            };
          }
          if (name === 'roles.desktopRoutes') {
            return roleRoutesResource;
          }
          if (name === 'roles') {
            return {
              update: vi.fn(),
            };
          }
          throw new Error(`Unexpected resource: ${name}`);
        }),
      },
      message: {
        success: flowMessageSuccess,
      },
    },
  };
}
