/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App as AntdApp, ConfigProvider } from 'antd';
import React from 'react';
import { getPortalUserRoles, PortalAccessView, type PortalAccessViewProps } from '../PortalAccessBoundary';
import zhCN from '../../locale/zh-CN.json';

const translations: Record<string, string> = {
  Anonymous: 'Anonymous',
  'Current role': 'Current role',
  'Failed to check Portal access': 'Failed to check Portal access',
  'Failed to switch role': 'Failed to switch role',
  'Full permissions': 'Full permissions',
  'No access to this Portal': 'No access to this Portal',
  'Please switch to a role that can access this Portal.': 'Please switch to a role that can access this Portal.',
  'Portal access will be checked again after switching.': 'Portal access will be checked again after switching.',
  Retry: 'Retry',
  'Select role': 'Select role',
  'Switch role': 'Switch role',
  'Unable to verify whether the current role can access this Portal.':
    'Unable to verify whether the current role can access this Portal.',
};

function renderView(overrides: Partial<PortalAccessViewProps> = {}) {
  let role: string | null = 'admin';
  const setRole = vi.fn((nextRole: string | null) => {
    role = nextRole;
  });
  const setDefaultRole = vi.fn().mockResolvedValue({ data: 'ok' });
  const reload = vi.fn();
  const renderAllowed = vi.fn(() => <div>Portal content</div>);
  const props: PortalAccessViewProps = {
    access: {
      generation: 1,
      portalName: 'customer',
      role: 'admin',
      status: 'denied',
      denied: {
        portalName: 'customer',
        role: 'admin',
        roles: ['admin'],
        roleMode: 'default',
        allowAnonymous: false,
      },
    },
    apiClient: {
      auth: {
        get role() {
          return role;
        },
        setRole,
      },
      resource: () => ({ setDefaultRole }),
    },
    reload,
    renderAllowed,
    retry: vi.fn().mockResolvedValue(undefined),
    t: (key) => translations[key] || key,
    userRoles: [
      { name: 'admin', title: 'Admin' },
      { name: 'member', title: 'Member' },
    ],
    ...overrides,
  };

  render(
    <ConfigProvider>
      <AntdApp>
        <PortalAccessView {...props} />
      </AntdApp>
    </ConfigProvider>,
  );

  return { props, reload, renderAllowed, setDefaultRole, setRole };
}

describe('PortalAccessView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uses the roles supplied by the auth:check user payload as switch options', () => {
    expect(
      getPortalUserRoles(
        {
          roles: [
            { name: 'admin', title: 'Admin' },
            { name: 'member', title: "{{t('Member')}}" },
          ],
        },
        (title) => (title === "{{t('Member')}}" ? 'Member' : title || ''),
      ),
    ).toEqual([
      { name: 'admin', title: 'Admin' },
      { name: 'member', title: 'Member' },
    ]);
  });

  it('renders a full-page Portal denial with a direct role selector and without normal Layout content', () => {
    const { renderAllowed } = renderView();
    const roleCard = screen.getByRole('region', { name: 'Switch role' });

    expect(screen.getByText('No access to this Portal')).toBeInTheDocument();
    expect(within(roleCard).getByText('Current role')).toBeInTheDocument();
    expect(within(roleCard).getByText('Select role')).toBeInTheDocument();
    expect(within(roleCard).getByText('Portal access will be checked again after switching.')).toBeInTheDocument();
    expect(within(roleCard).getByRole('combobox', { name: 'Switch role' })).toBeInTheDocument();
    expect(within(roleCard).getAllByText('Admin')).not.toHaveLength(0);
    expect(screen.queryByText('Portal content')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(within(roleCard).queryByRole('button')).not.toBeInTheDocument();
    expect(renderAllowed).not.toHaveBeenCalled();
  });

  it('uses the Settings terminology for Portal access messages in Chinese', () => {
    expect(zhCN['Checking Portal access']).toBe('正在检查门户访问权限');
    expect(zhCN['Failed to check Portal access']).toBe('门户访问权限检查失败');
    expect(zhCN['No access to this Portal']).toBe('无权访问此门户');
    expect(zhCN['Please switch to a role that can access this Portal.']).toBe(
      '当前角色没有访问权限，请切换角色后重试。',
    );
    expect(zhCN['Portal access will be checked again after switching.']).toBe('切换后将重新检查门户访问权限');
    expect(zhCN['Unable to verify whether the current role can access this Portal.']).toBe(
      '暂时无法确认当前角色是否有权访问此门户。',
    );
  });

  it('adds the union role in allow-use-union mode and reloads after a successful switch', async () => {
    const { reload, setDefaultRole, setRole } = renderView({
      access: {
        generation: 1,
        portalName: 'customer',
        role: 'admin',
        status: 'denied',
        denied: {
          portalName: 'customer',
          role: 'admin',
          roles: ['admin'],
          roleMode: 'allow-use-union',
          allowAnonymous: false,
        },
      },
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Switch role' }));
    expect(screen.getByRole('option', { name: 'Full permissions' })).toBeInTheDocument();
    fireEvent.click(await screen.findByText('Member', { selector: '.ant-select-item-option-content' }));

    await waitFor(() => {
      expect(setDefaultRole).toHaveBeenCalledWith({ values: { roleName: 'member' } });
    });
    expect(setRole).toHaveBeenCalledWith('member');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('rolls the local role back and reports a switch failure without leaving the denied page', async () => {
    const setDefaultRole = vi.fn().mockRejectedValue(new Error('Network failure'));
    const overriddenSetRole = vi.fn();
    renderView({
      apiClient: {
        auth: {
          role: 'admin',
          setRole: overriddenSetRole,
        },
        resource: () => ({ setDefaultRole }),
      },
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Switch role' }));
    fireEvent.click(await screen.findByText('Member', { selector: '.ant-select-item-option-content' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to switch role');
    expect(overriddenSetRole).toHaveBeenNthCalledWith(1, 'member');
    expect(overriddenSetRole).toHaveBeenNthCalledWith(2, 'admin');
    expect(document.querySelector('.ant-select-selection-item')).toHaveTextContent('Admin');
  });

  it('does not render the role switcher when the user only has one role', () => {
    renderView({
      userRoles: [{ name: 'admin', title: 'Admin' }],
    });

    expect(screen.getByText('No access to this Portal')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Switch role' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Switch role' })).not.toBeInTheDocument();
  });

  it('renders a read-only union role when the user has multiple roles in only-use-union mode', () => {
    renderView({
      access: {
        generation: 1,
        portalName: 'customer',
        role: '__union__',
        status: 'denied',
        denied: {
          portalName: 'customer',
          role: '__union__',
          roles: ['admin', 'member'],
          roleMode: 'only-use-union',
          allowAnonymous: false,
        },
      },
      userRoles: [
        { name: 'admin', title: 'Admin' },
        { name: 'member', title: 'Member' },
      ],
    });

    expect(screen.queryByRole('combobox', { name: 'Switch role' })).not.toBeInTheDocument();
    expect(screen.getByText('Full permissions')).toBeInTheDocument();
  });

  it('keeps ordinary errors separate and exposes a retry action', async () => {
    const user = userEvent.setup();
    const retry = vi.fn().mockResolvedValue(undefined);
    const { renderAllowed } = renderView({
      access: {
        generation: 1,
        portalName: 'customer',
        role: 'admin',
        status: 'error',
      },
      retry,
    });

    expect(screen.getByText('Failed to check Portal access')).toBeInTheDocument();
    expect(screen.queryByText('No access to this Portal')).not.toBeInTheDocument();
    expect(renderAllowed).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('calls the normal Layout renderer only after access is allowed', () => {
    const { renderAllowed } = renderView({
      access: {
        generation: 1,
        portalName: 'customer',
        role: 'member',
        status: 'allowed',
      },
    });

    expect(screen.getByText('Portal content')).toBeInTheDocument();
    expect(renderAllowed).toHaveBeenCalledTimes(1);
  });
});
