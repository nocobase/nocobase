/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import type { PermissionTabProps } from '../../registries';
import RolesManagementPage from '../RolesManagementPage';

interface MockPermissionTabOptions {
  key: string;
  label: string;
  componentLoader: () => Promise<{ default: React.ComponentType<PermissionTabProps> }>;
}

const { currentUserRole, getPermissionsTabs, mockPermissionTabs, runSelectedRoleRequest } = vi.hoisted(() => {
  const state = {
    currentUserRole: {
      name: 'manager',
      title: 'Manager',
    },
    mockPermissionTabs: [] as MockPermissionTabOptions[],
    runSelectedRoleRequest: vi.fn(),
    getPermissionsTabs: vi.fn(() => state.mockPermissionTabs),
  };

  return state;
});

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  return {
    ...actual,
    useACLRoleContext: () => currentUserRole,
  };
});

vi.mock('ahooks', async () => {
  const actual = await vi.importActual<typeof import('ahooks')>('ahooks');

  return {
    ...actual,
    useRequest: vi.fn((_: unknown, options?: Record<string, unknown>) => {
      if (options?.manual && 'ready' in (options ?? {})) {
        return {
          loading: false,
          run: () => {
            runSelectedRoleRequest();
            (options.onSuccess as ((role: { name: string; title: string }) => void) | undefined)?.({
              name: 'admin',
              title: 'Admin',
            });
          },
          refreshAsync: vi.fn(),
        };
      }

      if (options?.manual) {
        return {
          loading: false,
          runAsync: vi.fn(),
        };
      }

      return {
        data: {
          data: [{ name: 'admin', title: 'Admin' }],
        },
        loading: false,
        refreshAsync: vi.fn(),
      };
    }),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  const aclPlugin = {
    rolesManager: {
      list: () => [],
    },
    settingsUI: {
      getPermissionsTabs,
    },
  };

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: () => ({
          list: vi.fn(),
          get: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          destroy: vi.fn(),
          setSystemRoleMode: vi.fn(),
        }),
      },
      app: {
        pm: {
          get: () => aclPlugin,
        },
      },
      viewer: {
        open: vi.fn(),
      },
      message: {
        success: vi.fn(),
      },
      acl: {
        data: {
          roleMode: 'default',
        },
      },
    }),
    randomId: () => 'r_test',
  };
});

vi.mock('../../locale', () => ({
  useT: () => (value: string) => value,
}));

describe('RolesManagementPage', () => {
  beforeEach(() => {
    getPermissionsTabs.mockClear();
    runSelectedRoleRequest.mockClear();
    mockPermissionTabs.length = 0;
  });

  it('should request selected role only once after selecting the initial role', async () => {
    render(
      <App>
        <RolesManagementPage />
      </App>,
    );

    await waitFor(() => {
      expect(runSelectedRoleRequest).toHaveBeenCalledTimes(1);
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(runSelectedRoleRequest).toHaveBeenCalledTimes(1);
  });

  it('should keep permission tab component mounted after role changes', async () => {
    const mount = vi.fn();

    function MockPermissionTab(props: PermissionTabProps) {
      React.useEffect(() => {
        mount();
      }, []);

      return (
        <button type="button" onClick={() => props.onRoleChange({ name: 'admin', title: 'Admin' })}>
          Update role
        </button>
      );
    }

    const componentLoader = vi.fn(async () => ({
      default: MockPermissionTab,
    }));

    mockPermissionTabs.push({
      key: 'general',
      label: 'System',
      componentLoader,
    });

    render(
      <App>
        <RolesManagementPage />
      </App>,
    );

    await screen.findByText('Update role');
    expect(componentLoader).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Update role'));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(componentLoader).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenCalledTimes(1);
  });

  it('should pass the active permission tab key and current user role to the permissions registry', async () => {
    function MockPermissionTab() {
      return <div>Permission content</div>;
    }

    mockPermissionTabs.push(
      {
        key: 'general',
        label: 'System',
        componentLoader: async () => ({ default: MockPermissionTab }),
      },
      {
        key: 'menu',
        label: 'Desktop routes',
        componentLoader: async () => ({ default: MockPermissionTab }),
      },
    );

    render(
      <App>
        <RolesManagementPage />
      </App>,
    );

    await screen.findByText('Permission content');

    expect(getPermissionsTabs).toHaveBeenLastCalledWith(
      expect.objectContaining({
        activeKey: 'general',
        currentUserRole: expect.objectContaining(currentUserRole),
      }),
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Desktop routes' }));

    await waitFor(() => {
      expect(getPermissionsTabs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          activeKey: 'menu',
          currentUserRole: expect.objectContaining(currentUserRole),
        }),
      );
    });
  });
});
