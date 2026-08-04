/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App as AntdApp, ConfigProvider } from 'antd';
import React from 'react';
import { getPortalUserRoles, PortalAccessView, type PortalAccessViewProps } from '../PortalAccessBoundary';

const translations: Record<string, string> = {
  Anonymous: 'Anonymous',
  'Current role': 'Current role',
  'Failed to check Portal access': 'Failed to check Portal access',
  'Failed to switch role': 'Failed to switch role',
  'Full permissions': 'Full permissions',
  'No access to this Portal': 'No access to this Portal',
  'Please switch to a role that can access this Portal.': 'Please switch to a role that can access this Portal.',
  Retry: 'Retry',
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

    expect(screen.getByText('No access to this Portal')).toBeInTheDocument();
    expect(screen.getByText('Current role')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Switch role' })).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.queryByText('Portal content')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(renderAllowed).not.toHaveBeenCalled();
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

  it.each([
    ['only-use-union', '__union__', 'Full permissions'],
    ['default', 'admin', 'Admin'],
  ])('renders a read-only current role for %s when switching is unavailable', (roleMode, role, label) => {
    renderView({
      access: {
        generation: 1,
        portalName: 'customer',
        role,
        status: 'denied',
        denied: {
          portalName: 'customer',
          role,
          roles: role === '__union__' ? ['admin', 'member'] : ['admin'],
          roleMode,
          allowAnonymous: false,
        },
      },
      userRoles: roleMode === 'default' ? [{ name: 'admin', title: 'Admin' }] : [{ name: 'admin', title: 'Admin' }],
    });

    expect(screen.queryByRole('combobox', { name: 'Switch role' })).not.toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
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
