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

const {
  createRole,
  currentUserRole,
  getRole,
  getPermissionsTabs,
  mockPermissionTabs,
  roles,
  rolesState,
  rolesRefresh,
  runSelectedRoleRequest,
  selectedRoleRefresh,
  setSystemRoleMode,
  success,
  updateRole,
  viewerOpen,
} = vi.hoisted(() => {
  const state = {
    createRole: vi.fn(),
    currentUserRole: {
      name: 'manager',
      title: 'Manager',
    },
    getRole: vi.fn(),
    mockPermissionTabs: [] as MockPermissionTabOptions[],
    roles: [{ name: 'admin', title: 'Admin' }],
    rolesState: {
      loading: false,
    },
    rolesRefresh: vi.fn(),
    runSelectedRoleRequest: vi.fn(),
    selectedRoleRefresh: vi.fn(),
    setSystemRoleMode: vi.fn(),
    success: vi.fn(),
    updateRole: vi.fn(),
    viewerOpen: vi.fn(),
    getPermissionsTabs: vi.fn(() => state.mockPermissionTabs),
  };

  return state;
});

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  const ReactModule = await import('react');

  return {
    ...actual,
    DrawerFormLayout: ({
      title,
      children,
      onSubmit,
      submitText,
      cancelText,
    }: {
      title?: React.ReactNode;
      children?: React.ReactNode;
      onSubmit?: () => Promise<void> | void;
      submitText?: React.ReactNode;
      cancelText?: React.ReactNode;
    }) =>
      ReactModule.createElement(
        'div',
        { role: 'dialog', 'aria-label': String(title) },
        children,
        ReactModule.createElement('button', { type: 'button', onClick: onSubmit }, submitText ?? 'Submit'),
        ReactModule.createElement('button', { type: 'button' }, cancelText ?? 'Cancel'),
      ),
    useACLRoleContext: () => currentUserRole,
  };
});

vi.mock('ahooks', async () => {
  const actual = await vi.importActual<typeof import('ahooks')>('ahooks');

  return {
    ...actual,
    useRequest: vi.fn((service: unknown, options?: Record<string, unknown>) => {
      if (options?.manual && 'ready' in (options ?? {})) {
        return {
          loading: false,
          run: () => {
            runSelectedRoleRequest();
            return Promise.resolve((service as () => Promise<unknown>)()).then((role) => {
              (options.onSuccess as ((role: { name: string; title: string } | null) => void) | undefined)?.(
                role as { name: string; title: string } | null,
              );
            });
          },
          refreshAsync: selectedRoleRefresh,
        };
      }

      if (options?.manual) {
        return {
          loading: false,
          runAsync: async (...args: unknown[]) => {
            const result = await (service as (...input: unknown[]) => Promise<unknown>)(...args);
            (options.onSuccess as ((value: unknown) => void) | undefined)?.(result);
            return result;
          },
        };
      }

      return {
        data: {
          data: roles,
        },
        loading: rolesState.loading,
        refreshAsync: rolesRefresh,
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
          get: getRole,
          create: createRole,
          update: updateRole,
          destroy: vi.fn(),
          setSystemRoleMode,
        }),
      },
      app: {
        pm: {
          get: () => aclPlugin,
        },
      },
      viewer: {
        open: viewerOpen,
      },
      message: {
        success,
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
  const originalLocation = globalThis.window.location;

  beforeEach(() => {
    roles.splice(0, roles.length, { name: 'admin', title: 'Admin' });
    rolesState.loading = false;
    getPermissionsTabs.mockClear();
    runSelectedRoleRequest.mockClear();
    createRole.mockReset();
    createRole.mockResolvedValue({});
    getRole.mockReset();
    getRole.mockImplementation(({ filterByTk }: { filterByTk: string }) => ({
      data: {
        data: roles.find((role) => role.name === filterByTk) ?? null,
      },
    }));
    rolesRefresh.mockReset();
    rolesRefresh.mockResolvedValue({});
    selectedRoleRefresh.mockReset();
    selectedRoleRefresh.mockResolvedValue({});
    setSystemRoleMode.mockReset();
    setSystemRoleMode.mockResolvedValue({});
    success.mockReset();
    updateRole.mockReset();
    updateRole.mockResolvedValue({
      data: {
        data: {
          name: 'admin',
          title: 'Edited admin',
          default: true,
        },
      },
    });
    viewerOpen.mockReset();
    mockPermissionTabs.length = 0;
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: vi.fn(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
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

  it('should open the new role drawer and submit default denied snippets', async () => {
    render(
      <App>
        <RolesManagementPage />
      </App>,
    );

    fireEvent.click(await screen.findByText('New role'));

    expect(viewerOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawer',
        width: '50%',
        closable: true,
        content: expect.any(Function),
      }),
    );

    const drawerOptions = viewerOpen.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<App>{drawerOptions.content()}</App>);

    expect(screen.getByRole('dialog', { name: 'New role' })).toBeInTheDocument();
    expect(screen.getByLabelText('Role UID')).toHaveValue('r_test');

    fireEvent.change(screen.getByLabelText('Role display name'), { target: { value: 'Operator' } });
    fireEvent.change(screen.getByLabelText('Role UID'), { target: { value: 'operator' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(createRole).toHaveBeenCalledWith({
        values: {
          title: 'Operator',
          name: 'operator',
          default: false,
          snippets: ['!ui.*', '!pm', '!pm.*'],
        },
      });
    });
    expect(success).toHaveBeenCalledWith('Saved successfully');
    expect(rolesRefresh).toHaveBeenCalled();
    expect(selectedRoleRefresh).toHaveBeenCalled();
  });

  it('should show the empty state when no roles are returned', async () => {
    roles.splice(0, roles.length);

    render(
      <App>
        <RolesManagementPage />
      </App>,
    );

    await waitFor(() => {
      expect(document.querySelector('.ant-empty-description')).toHaveTextContent('No data');
    });
    expect(screen.getByText('Select a role to configure permissions')).toBeInTheDocument();
  });

  it('should open the edit role drawer from the role menu and save updates', async () => {
    render(
      <App>
        <RolesManagementPage />
      </App>,
    );

    const moreButton = (await screen.findByLabelText('more')).closest('button');
    expect(moreButton).toBeTruthy();
    fireEvent.click(moreButton as HTMLButtonElement);
    fireEvent.click(await screen.findByText('Edit'));

    expect(viewerOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawer',
        content: expect.any(Function),
      }),
    );

    const drawerOptions = viewerOpen.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<App>{drawerOptions.content()}</App>);

    expect(screen.getByRole('dialog', { name: 'Edit role' })).toBeInTheDocument();
    expect(screen.getByLabelText('Role UID')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Role display name'), { target: { value: 'Edited admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(updateRole).toHaveBeenCalledWith({
        filterByTk: 'admin',
        values: {
          title: 'Edited admin',
          name: 'admin',
        },
      });
    });
    expect(success).toHaveBeenCalledWith('Saved successfully');
  });
});
