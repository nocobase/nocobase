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
        label: 'Layout permissions',
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

      await selectLayout('Desktop layout');
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
    const onRoleChange = vi.fn();

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'layout-member', title: 'Layout member', allowNewUiLayout: false }}
        onRoleChange={onRoleChange}
      />,
    );

    expect(await screen.findByRole('columnheader', { name: 'Layout title' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'UI layout' })).not.toBeInTheDocument();
    const allowNewLayoutCheckbox = screen.getByRole('checkbox', {
      name: 'New layouts are allowed to be accessed by default',
    });
    const allowNewRouteCheckbox = screen.getByRole('checkbox', {
      name: 'New routes are allowed to be accessed by default',
    });

    expect(allowNewLayoutCheckbox.compareDocumentPosition(allowNewRouteCheckbox)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    await act(async () => {
      await user.click(allowNewLayoutCheckbox);
    });

    await waitFor(() => {
      expect(resource.rolesUpdate).toHaveBeenCalledWith({
        filterByTk: 'layout-member',
        values: { allowNewUiLayout: true },
      });
    });
    expect(onRoleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'layout-member',
        allowNewUiLayout: true,
      }),
    );

    await selectLayout('Desktop layout');
    const routeCheckbox = await screen.findByRole('checkbox', { name: 'Allow access to Admin route' });
    routeCheckbox.focus();
    expect(routeCheckbox).toHaveFocus();

    await act(async () => {
      await user.keyboard('[Space]');
    });

    await waitFor(() => {
      expect(resource.scopedRouteDestroy).toHaveBeenCalledWith({
        filter: {
          roleName: 'layout-member',
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
          desktopRouteId: [1],
        },
      });
    });
    expect(resource.messageSuccess).toHaveBeenCalledWith('Saved successfully');
  });

  it('should render the layout permissions summary table without the layout selector', async () => {
    const resource = createLayoutSummaryPermissionTabResources();
    flowMocks.context = resource.context;

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'layout-member', title: 'Layout member' }}
        onRoleChange={vi.fn()}
      />,
    );

    expect(await screen.findByRole('columnheader', { name: 'Layout title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Layout access' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Menu access' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Configure' })).toBeInTheDocument();

    expect(screen.queryByRole('combobox', { name: 'UI layout' })).not.toBeInTheDocument();
    expect(screen.getByText('Desktop layout')).toBeInTheDocument();
    expect(screen.getByText('Mobile layout')).toBeInTheDocument();
    expect(screen.queryByText('Disabled layout')).not.toBeInTheDocument();

    expect(screen.getByRole('switch', { name: 'Allow access to Desktop layout' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Allow access to Mobile layout' })).not.toBeChecked();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('0 / 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configure Desktop layout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configure Mobile layout' })).toBeInTheDocument();
    expect(resource.uiLayoutsList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          enabled: true,
        },
      }),
    );
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

      await selectLayout('Desktop layout');
      expect(await screen.findByText('Admin route')).toBeInTheDocument();

      await selectLayout('Mobile layout');

      const mobileCheckbox = await screen.findByRole('checkbox', { name: 'Allow access to Mobile route' });

      expect(mobileCheckbox).not.toBeChecked();

      await act(async () => {
        await user.click(mobileCheckbox);
      });

      await waitFor(() => {
        expect(resource.scopedRouteCreate).toHaveBeenCalledWith({
          values: {
            roleName: 'layout-member',
            uiLayoutUid: 'mobile-layout',
            desktopRouteId: 2,
          },
        });
      });
      expect(resource.roleRoutesAdd).not.toHaveBeenCalled();

      await act(async () => {
        resource.adminRoleRoutes.resolve({
          data: {
            data: [
              {
                desktopRouteId: 1,
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

  it('should keep layout permission requests bounded and scoped while switching and saving', async () => {
    const resource = createCountingPermissionTabResources();
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    const { rerender } = render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'layout-member', title: 'Layout member' }}
        onRoleChange={vi.fn()}
      />,
    );

    await selectLayout('Desktop layout');
    expect(await screen.findByText('Admin route')).toBeInTheDocument();

    await selectLayout('Mobile layout');

    expect(await screen.findByText('Mobile route')).toBeInTheDocument();
    expect(screen.queryByText('Admin route')).not.toBeInTheDocument();

    rerender(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'layout-auditor', title: 'Layout auditor' }}
        onRoleChange={vi.fn()}
      />,
    );

    const mobileCheckbox = await screen.findByRole('checkbox', { name: 'Allow access to Mobile route' });

    await act(async () => {
      await user.click(mobileCheckbox);
    });

    await waitFor(() => {
      expect(resource.scopedRouteCreate).toHaveBeenCalledWith({
        values: {
          roleName: 'layout-auditor',
          uiLayoutUid: 'mobile-layout',
          desktopRouteId: 2,
        },
      });
    });

    const desktopRouteLayouts = resource.desktopRoutesList.mock.calls.map((call) =>
      getLayoutUidFromFilter(call[0]?.filter as Record<string, unknown> | undefined),
    );
    const scopedRouteRequests = resource.scopedRouteList.mock.calls.map(([params]) => ({
      roleName: (params?.filter as Record<string, unknown> | undefined)?.roleName,
      layoutUid: (params?.filter as Record<string, unknown> | undefined)?.uiLayoutUid,
    }));

    expect(desktopRouteLayouts).toEqual([
      DEFAULT_ADMIN_UI_LAYOUT.uid,
      'mobile-layout',
      DEFAULT_ADMIN_UI_LAYOUT.uid,
      'mobile-layout',
      DEFAULT_ADMIN_UI_LAYOUT.uid,
      'mobile-layout',
      DEFAULT_ADMIN_UI_LAYOUT.uid,
      'mobile-layout',
    ]);
    expect(scopedRouteRequests).toEqual(
      expect.arrayContaining([
        { roleName: 'layout-member', layoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid },
        { roleName: 'layout-member', layoutUid: 'mobile-layout' },
        { roleName: 'layout-auditor', layoutUid: 'mobile-layout' },
      ]),
    );
    expect(resource.roleRoutesAdd).not.toHaveBeenCalled();
    expect(resource.roleRoutesRemove).not.toHaveBeenCalled();
    expect(resource.messageSuccess).toHaveBeenCalledTimes(1);
  });

  it('should refresh the summary menu count after saving drawer route permissions', async () => {
    const resource = createCountingPermissionTabResources();
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'layout-member', title: 'Layout member' }}
        onRoleChange={vi.fn()}
      />,
    );

    expect(await screen.findByText('0 / 1')).toBeInTheDocument();

    await selectLayout('Mobile layout');

    const mobileCheckbox = await screen.findByRole('checkbox', { name: 'Allow access to Mobile route' });

    await act(async () => {
      await user.click(mobileCheckbox);
    });

    await waitFor(() => {
      expect(screen.queryByText('0 / 1')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('1 / 1')).toHaveLength(2);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Close' }));
    });
    await selectLayout('Mobile layout');

    expect(await screen.findByRole('checkbox', { name: 'Allow access to Mobile route' })).toBeChecked();
    expect(resource.scopedRouteCreate).toHaveBeenCalledWith({
      values: {
        roleName: 'layout-member',
        uiLayoutUid: 'mobile-layout',
        desktopRouteId: 2,
      },
    });
    expect(resource.roleRoutesAdd).not.toHaveBeenCalled();
    expect(resource.roleRoutesRemove).not.toHaveBeenCalled();
    expect(resource.messageSuccess).toHaveBeenCalledWith('Saved successfully');
  });

  it('should keep disabled layout menu permissions viewable without removing checked routes', async () => {
    const resource = createDisabledLayoutAccessPermissionTabResources();
    flowMocks.context = resource.context;

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'layout-member', title: 'Layout member' }}
        onRoleChange={vi.fn()}
      />,
    );

    expect(await screen.findByRole('switch', { name: 'Allow access to Mobile layout' })).not.toBeChecked();

    await selectLayout('Mobile layout');

    const drawerLayoutAccess = await screen.findByRole('checkbox', { name: 'Allow access to this layout' });
    const allowAllRoutes = screen.getByRole('checkbox', { name: 'Allow access' });
    const mobileRouteCheckbox = await screen.findByRole('checkbox', { name: 'Allow access to Mobile route' });

    expect(drawerLayoutAccess).not.toBeChecked();
    expect(allowAllRoutes).toBeDisabled();
    expect(mobileRouteCheckbox).toBeChecked();
    expect(mobileRouteCheckbox).toBeDisabled();

    expect(resource.scopedRouteCreate).not.toHaveBeenCalled();
    expect(resource.scopedRouteDestroy).not.toHaveBeenCalled();
    expect(resource.roleRoutesAdd).not.toHaveBeenCalled();
    expect(resource.roleRoutesRemove).not.toHaveBeenCalled();
  });

  it('should write drawer route changes through layout-scoped menu permissions', async () => {
    const resource = createCountingPermissionTabResources();
    const user = userEvent.setup();
    flowMocks.context = resource.context;

    render(
      <LayoutAwareDesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'layout-member', title: 'Layout member' }}
        onRoleChange={vi.fn()}
      />,
    );

    await selectLayout('Mobile layout');

    const mobileCheckbox = await screen.findByRole('checkbox', { name: 'Allow access to Mobile route' });

    await act(async () => {
      await user.click(mobileCheckbox);
    });

    await waitFor(() => {
      expect(resource.scopedRouteCreate).toHaveBeenCalledWith({
        values: {
          roleName: 'layout-member',
          uiLayoutUid: 'mobile-layout',
          desktopRouteId: 2,
        },
      });
    });
    expect(resource.roleRoutesAdd).not.toHaveBeenCalled();
    expect(resource.roleRoutesRemove).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(mobileCheckbox);
    });

    await waitFor(() => {
      expect(resource.scopedRouteDestroy).toHaveBeenCalledWith({
        filter: {
          roleName: 'layout-member',
          uiLayoutUid: 'mobile-layout',
          desktopRouteId: [2],
        },
      });
    });
    expect(resource.roleRoutesAdd).not.toHaveBeenCalled();
    expect(resource.roleRoutesRemove).not.toHaveBeenCalled();
  });
});

async function selectLayout(label: string) {
  fireEvent.click(await screen.findByRole('button', { name: `Configure ${label}` }));
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
  const rolesUiLayoutsResource = {
    list: vi.fn(async () => ({
      data: {
        data: [
          {
            roleName: 'layout-member',
            uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
          },
        ],
      },
    })),
    create: vi.fn(async () => undefined),
    destroy: vi.fn(async () => undefined),
  };
  const scopedRouteDestroy = vi.fn(async () => undefined);
  const rolesUiLayoutDesktopRoutesResource = {
    list: vi.fn(async (params?: Record<string, unknown>) => {
      const filter = (params?.filter as Record<string, unknown> | undefined) || {};
      const layoutUid = typeof filter.uiLayoutUid === 'string' ? filter.uiLayoutUid : DEFAULT_ADMIN_UI_LAYOUT.uid;

      return {
        data: {
          data:
            layoutUid === DEFAULT_ADMIN_UI_LAYOUT.uid
              ? [
                  {
                    desktopRouteId: 1,
                  },
                ]
              : [],
        },
      };
    }),
    create: vi.fn(async () => undefined),
    destroy: scopedRouteDestroy,
  };
  const rolesUpdate = vi.fn(async ({ values }: { values: Record<string, unknown> }) => ({
    data: {
      data: {
        name: 'layout-member',
        title: 'Layout member',
        ...values,
      },
    },
  }));
  const rolesResource = {
    update: rolesUpdate,
  };
  const flowMessageSuccess = vi.fn();

  return {
    desktopRoutesList,
    messageSuccess: flowMessageSuccess,
    rolesUpdate,
    roleRoutesRemove: roleRoutesResource.remove,
    scopedRouteDestroy,
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
          if (name === 'rolesUiLayouts') {
            return rolesUiLayoutsResource;
          }
          if (name === 'rolesUiLayoutDesktopRoutes') {
            return rolesUiLayoutDesktopRoutesResource;
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

function createLayoutSummaryPermissionTabResources() {
  const uiLayoutsList = vi.fn(async () => ({
    data: {
      data: [
        {
          uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
          title: 'Desktop layout',
          layoutType: 'desktop',
          enabled: true,
        },
        {
          uid: 'mobile-layout',
          title: 'Mobile layout',
          layoutType: 'mobile',
          enabled: true,
        },
        {
          uid: 'disabled-layout',
          title: 'Disabled layout',
          layoutType: 'mobile',
          enabled: false,
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
                  id: 3,
                  title: 'Mobile route',
                },
              ]
            : [
                {
                  id: 1,
                  title: 'Admin route',
                },
                {
                  id: 2,
                  title: 'Reports',
                },
              ],
      },
    };
  });
  const rolesUiLayoutsList = vi.fn(async () => ({
    data: {
      data: [
        {
          roleName: 'layout-member',
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      ],
    },
  }));
  const rolesUiLayoutDesktopRoutesList = vi.fn(async (params?: Record<string, unknown>) => {
    const layoutUid = (params?.filter as Record<string, unknown> | undefined)?.uiLayoutUid;

    return {
      data: {
        data:
          layoutUid === DEFAULT_ADMIN_UI_LAYOUT.uid
            ? [
                {
                  desktopRouteId: 1,
                },
              ]
            : [],
      },
    };
  });
  const flowMessageSuccess = vi.fn();

  return {
    uiLayoutsList,
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
          if (name === 'rolesUiLayouts') {
            return {
              list: rolesUiLayoutsList,
              create: vi.fn(),
              destroy: vi.fn(),
            };
          }
          if (name === 'rolesUiLayoutDesktopRoutes') {
            return {
              list: rolesUiLayoutDesktopRoutesList,
            };
          }
          if (name === 'roles.desktopRoutes') {
            return {
              list: vi.fn(async () => ({ data: { data: [] } })),
              add: vi.fn(),
              remove: vi.fn(),
            };
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
  const roleRoutesList = vi.fn(async () => ({
    data: {
      data: [],
    },
  }));
  const roleRoutesResource = {
    list: roleRoutesList,
    add: vi.fn(async ({ values }: { values: number[] }) => {
      values.forEach((id) => mobileSelectedIds.add(id));
    }),
    remove: vi.fn(async ({ values }: { values: number[] }) => {
      values.forEach((id) => mobileSelectedIds.delete(id));
    }),
  };
  const rolesUiLayoutsResource = {
    list: vi.fn(async () => ({
      data: {
        data: [
          {
            roleName: 'layout-member',
            uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
          },
          {
            roleName: 'layout-member',
            uiLayoutUid: 'mobile-layout',
          },
        ],
      },
    })),
    create: vi.fn(async () => undefined),
    destroy: vi.fn(async () => undefined),
  };
  const rolesUiLayoutDesktopRoutesResource = {
    list: vi.fn(async (params?: Record<string, unknown>) => {
      const filter = (params?.filter as Record<string, unknown> | undefined) || {};
      const layoutUid = typeof filter.uiLayoutUid === 'string' ? filter.uiLayoutUid : DEFAULT_ADMIN_UI_LAYOUT.uid;

      if (layoutUid === DEFAULT_ADMIN_UI_LAYOUT.uid) {
        return adminRoleRoutes.promise;
      }

      return {
        data: {
          data: Array.from(mobileSelectedIds).map((desktopRouteId) => ({
            desktopRouteId,
          })),
        },
      };
    }),
    create: vi.fn(async ({ values }: { values: Record<string, unknown> }) => {
      const desktopRouteId =
        typeof values.desktopRouteId === 'number' ? values.desktopRouteId : Number(values.desktopRouteId);

      if (!Number.isNaN(desktopRouteId)) {
        mobileSelectedIds.add(desktopRouteId);
      }
    }),
    destroy: vi.fn(async ({ filter }: { filter: Record<string, unknown> }) => {
      const routeIds = Array.isArray(filter.desktopRouteId) ? filter.desktopRouteId : [filter.desktopRouteId];

      routeIds
        .map((routeId) => (typeof routeId === 'number' ? routeId : Number(routeId)))
        .filter((routeId) => !Number.isNaN(routeId))
        .forEach((routeId) => mobileSelectedIds.delete(routeId));
    }),
  };
  const flowMessageSuccess = vi.fn();

  return {
    adminRoleRoutes,
    roleRoutesAdd: roleRoutesResource.add,
    roleRoutesList,
    scopedRouteCreate: rolesUiLayoutDesktopRoutesResource.create,
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
          if (name === 'rolesUiLayouts') {
            return rolesUiLayoutsResource;
          }
          if (name === 'rolesUiLayoutDesktopRoutes') {
            return rolesUiLayoutDesktopRoutesResource;
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

function createDisabledLayoutAccessPermissionTabResources() {
  const selectedRouteIdsByRoleAndLayout = new Map<string, Set<number>>([
    [`layout-member:${DEFAULT_ADMIN_UI_LAYOUT.uid}`, new Set([1])],
    ['layout-member:mobile-layout', new Set([2])],
  ]);
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
  const roleRoutesResource = {
    list: vi.fn(async () => ({ data: { data: [] } })),
    add: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
  };
  const rolesUiLayoutsResource = {
    list: vi.fn(async () => ({
      data: {
        data: [
          {
            roleName: 'layout-member',
            uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
          },
        ],
      },
    })),
    create: vi.fn(async () => undefined),
    destroy: vi.fn(async () => undefined),
  };
  const rolesUiLayoutDesktopRoutesList = vi.fn(async (params?: Record<string, unknown>) => {
    const filter = (params?.filter as Record<string, unknown> | undefined) || {};
    const roleName = typeof filter.roleName === 'string' ? filter.roleName : '';
    const layoutUid = typeof filter.uiLayoutUid === 'string' ? filter.uiLayoutUid : DEFAULT_ADMIN_UI_LAYOUT.uid;
    const selectedRouteIds = selectedRouteIdsByRoleAndLayout.get(`${roleName}:${layoutUid}`) ?? new Set<number>();

    return {
      data: {
        data: Array.from(selectedRouteIds).map((desktopRouteId) => ({
          desktopRouteId,
        })),
      },
    };
  });
  const scopedRouteCreate = vi.fn(async () => undefined);
  const scopedRouteDestroy = vi.fn(async () => undefined);
  const flowMessageSuccess = vi.fn();

  return {
    roleRoutesAdd: roleRoutesResource.add,
    roleRoutesRemove: roleRoutesResource.remove,
    scopedRouteCreate,
    scopedRouteDestroy,
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
          if (name === 'rolesUiLayouts') {
            return rolesUiLayoutsResource;
          }
          if (name === 'rolesUiLayoutDesktopRoutes') {
            return {
              list: rolesUiLayoutDesktopRoutesList,
              create: scopedRouteCreate,
              destroy: scopedRouteDestroy,
            };
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

function createCountingPermissionTabResources() {
  const selectedRouteIdsByRoleAndLayout = new Map<string, Set<number>>([
    [`layout-member:${DEFAULT_ADMIN_UI_LAYOUT.uid}`, new Set([1])],
  ]);
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
  const getSelectedRouteIds = (roleName: string, layoutUid: string) => {
    const key = `${roleName}:${layoutUid}`;
    let routeIds = selectedRouteIdsByRoleAndLayout.get(key);

    if (!routeIds) {
      routeIds = new Set<number>();
      selectedRouteIdsByRoleAndLayout.set(key, routeIds);
    }

    return routeIds;
  };
  const roleRoutesList = vi.fn(async (roleName: string, params?: Record<string, unknown>) => {
    const layoutUid =
      getLayoutUidFromFilter(params?.filter as Record<string, unknown> | undefined) || DEFAULT_ADMIN_UI_LAYOUT.uid;
    const selectedRouteIds = getSelectedRouteIds(roleName, layoutUid);

    return {
      data: {
        data: Array.from(selectedRouteIds).map((id) => ({
          id,
          title: id === 2 ? 'Mobile route' : 'Admin route',
        })),
      },
    };
  });
  const roleRoutesAdd = vi.fn(async (roleName: string, params: { values: number[] }) => {
    const selectedRouteIds = getSelectedRouteIds(roleName, 'mobile-layout');

    params.values.forEach((id) => selectedRouteIds.add(id));
  });
  const roleRoutesRemove = vi.fn(async (roleName: string, params: { values: number[] }) => {
    const selectedRouteIds = getSelectedRouteIds(roleName, 'mobile-layout');

    params.values.forEach((id) => selectedRouteIds.delete(id));
  });
  const layoutAccessByRole = new Map<string, string[]>([
    ['layout-member', [DEFAULT_ADMIN_UI_LAYOUT.uid, 'mobile-layout']],
    ['layout-auditor', [DEFAULT_ADMIN_UI_LAYOUT.uid, 'mobile-layout']],
  ]);
  const rolesUiLayoutsResource = {
    list: vi.fn(async (params?: Record<string, unknown>) => {
      const filter = (params?.filter as Record<string, unknown> | undefined) || {};
      const roleName = typeof filter.roleName === 'string' ? filter.roleName : '';
      const requestedLayoutUids = Array.isArray(filter.uiLayoutUid) ? filter.uiLayoutUid : [];
      const allowedLayoutUids = layoutAccessByRole.get(roleName) ?? [];

      return {
        data: {
          data: allowedLayoutUids
            .filter((uiLayoutUid) => requestedLayoutUids.includes(uiLayoutUid))
            .map((uiLayoutUid) => ({
              roleName,
              uiLayoutUid,
            })),
        },
      };
    }),
    create: vi.fn(async () => undefined),
    destroy: vi.fn(async () => undefined),
  };
  const rolesUiLayoutDesktopRoutesList = vi.fn(async (params?: Record<string, unknown>) => {
    const filter = (params?.filter as Record<string, unknown> | undefined) || {};
    const roleName = typeof filter.roleName === 'string' ? filter.roleName : '';
    const layoutUid = typeof filter.uiLayoutUid === 'string' ? filter.uiLayoutUid : DEFAULT_ADMIN_UI_LAYOUT.uid;
    const selectedRouteIds = getSelectedRouteIds(roleName, layoutUid);

    return {
      data: {
        data: Array.from(selectedRouteIds).map((desktopRouteId) => ({
          desktopRouteId,
        })),
      },
    };
  });
  const scopedRouteCreate = vi.fn(async ({ values }: { values: Record<string, unknown> }) => {
    const roleName = typeof values.roleName === 'string' ? values.roleName : '';
    const layoutUid = typeof values.uiLayoutUid === 'string' ? values.uiLayoutUid : DEFAULT_ADMIN_UI_LAYOUT.uid;
    const desktopRouteId =
      typeof values.desktopRouteId === 'number' ? values.desktopRouteId : Number(values.desktopRouteId);

    if (!Number.isNaN(desktopRouteId)) {
      getSelectedRouteIds(roleName, layoutUid).add(desktopRouteId);
    }
  });
  const scopedRouteDestroy = vi.fn(async ({ filter }: { filter: Record<string, unknown> }) => {
    const roleName = typeof filter.roleName === 'string' ? filter.roleName : '';
    const layoutUid = typeof filter.uiLayoutUid === 'string' ? filter.uiLayoutUid : DEFAULT_ADMIN_UI_LAYOUT.uid;
    const routeIds = Array.isArray(filter.desktopRouteId) ? filter.desktopRouteId : [filter.desktopRouteId];
    const selectedRouteIds = getSelectedRouteIds(roleName, layoutUid);

    routeIds
      .map((routeId) => (typeof routeId === 'number' ? routeId : Number(routeId)))
      .filter((routeId) => !Number.isNaN(routeId))
      .forEach((routeId) => selectedRouteIds.delete(routeId));
  });
  const flowMessageSuccess = vi.fn();

  return {
    desktopRoutesList,
    messageSuccess: flowMessageSuccess,
    roleRoutesAdd,
    roleRoutesList,
    roleRoutesRemove,
    scopedRouteCreate,
    scopedRouteDestroy,
    scopedRouteList: rolesUiLayoutDesktopRoutesList,
    context: {
      api: {
        resource: vi.fn((name: string, roleName?: string) => {
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
            return {
              list: (params?: Record<string, unknown>) => roleRoutesList(roleName || '', params),
              add: (params: { values: number[] }) => roleRoutesAdd(roleName || '', params),
              remove: (params: { values: number[] }) => roleRoutesRemove(roleName || '', params),
            };
          }
          if (name === 'rolesUiLayouts') {
            return rolesUiLayoutsResource;
          }
          if (name === 'rolesUiLayoutDesktopRoutes') {
            return {
              list: rolesUiLayoutDesktopRoutesList,
              create: scopedRouteCreate,
              destroy: scopedRouteDestroy,
            };
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
