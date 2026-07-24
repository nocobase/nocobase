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
import type { Role } from '../../../registries';
import SystemPermissionsTab from '../SystemPermissionsTab';

const state = vi.hoisted(() => ({
  update: vi.fn(),
  success: vi.fn(),
  pluginTableProps: [] as Array<{ active: boolean; role: Role }>,
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: () => ({
          update: state.update,
        }),
      },
      message: {
        success: state.success,
      },
    }),
  };
});

vi.mock('../../../locale', () => ({
  useT: () => (value: string) => value,
}));

vi.mock('../PluginPermissionsTable', () => ({
  default: (props: { active: boolean; role: Role }) => {
    state.pluginTableProps.push(props);
    return <div data-testid="plugin-permissions-table">{props.role.name}</div>;
  },
}));

describe('SystemPermissionsTab', () => {
  beforeEach(() => {
    state.update.mockReset();
    state.update.mockResolvedValue({});
    state.success.mockReset();
    state.pluginTableProps = [];
  });

  it('prompts the user to select a role before configuring permissions', () => {
    render(
      <SystemPermissionsTab activeKey="general" activeRole={null} currentUserRole={null} onRoleChange={vi.fn()} />,
    );

    expect(screen.getByText('Select a role to configure permissions')).toBeInTheDocument();
  });

  it('saves system snippets when a permission is granted', async () => {
    const onRoleChange = vi.fn();
    const role: Role = {
      name: 'member',
      title: 'Member',
      snippets: ['ui.*'],
    };

    render(
      <SystemPermissionsTab activeKey="general" activeRole={role} currentUserRole={null} onRoleChange={onRoleChange} />,
    );

    expect(screen.queryByTestId('plugin-permissions-table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Allows to configure plugins'));

    await waitFor(() => {
      expect(state.update).toHaveBeenCalledWith({
        filterByTk: 'member',
        values: {
          snippets: ['ui.*', 'pm.*', '!pm', '!app'],
        },
      });
    });
    expect(onRoleChange).toHaveBeenCalledWith({
      ...role,
      snippets: ['ui.*', 'pm.*', '!pm', '!app'],
    });
    expect(state.success).toHaveBeenCalledWith('Saved successfully');
    expect(await screen.findByTestId('plugin-permissions-table')).toHaveTextContent('member');
    expect(state.pluginTableProps.at(-1)).toEqual({
      active: true,
      role: {
        ...role,
        snippets: ['ui.*', 'pm.*', '!pm', '!app'],
      },
    });
  });

  it('saves denied snippets when a permission is revoked', async () => {
    const onRoleChange = vi.fn();
    const role: Role = {
      name: 'admin',
      title: 'Admin',
      snippets: ['ui.*', 'pm', 'pm.*', 'app'],
    };

    render(
      <SystemPermissionsTab activeKey="menu" activeRole={role} currentUserRole={null} onRoleChange={onRoleChange} />,
    );

    expect(screen.getByTestId('plugin-permissions-table')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Allows to configure interface'));

    await waitFor(() => {
      expect(state.update).toHaveBeenCalledWith({
        filterByTk: 'admin',
        values: {
          snippets: ['pm', 'pm.*', 'app', '!ui.*'],
        },
      });
    });
    expect(onRoleChange).toHaveBeenCalledWith({
      ...role,
      snippets: ['pm', 'pm.*', 'app', '!ui.*'],
    });
    expect(state.pluginTableProps.at(-1)?.active).toBe(false);
  });
});
