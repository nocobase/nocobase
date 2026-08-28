/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import UsersManagementPage from '../pages/UsersManagementPage';

const { open, destroy, list, success, deniedActions, resourceTableProps } = vi.hoisted(() => ({
  open: vi.fn(),
  destroy: vi.fn(),
  list: vi.fn(),
  success: vi.fn(),
  deniedActions: new Set<string>(),
  resourceTableProps: {
    current: null as null | Record<string, any>,
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  useACLRoleContext: () => ({
    parseAction: (action: string) => (deniedActions.has(action) ? null : {}),
  }),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    dataSourceManager: {
      getDataSource: () => ({
        getCollection: () => ({}),
      }),
    },
    viewer: {
      open,
    },
    api: {
      resource: () => ({
        destroy,
        list,
      }),
    },
    message: {
      success,
    },
  }),
}));

vi.mock('../components/resource', () => ({
  ResourceTablePage: (props: Record<string, any>) => {
    resourceTableProps.current = props;
    return <div>{props.toolbar({ refresh: vi.fn(), refreshAsync: vi.fn().mockResolvedValue(undefined) })}</div>;
  },
  SettingsActionCell: ({ record, actions }: { record: Record<string, any>; actions: Array<Record<string, any>> }) => (
    <div>
      {actions
        .filter((action) => !action.hidden)
        .map((action) => (
          <button key={action.key} onClick={() => action.onClick?.(record)}>
            {action.label}
          </button>
        ))}
    </div>
  ),
}));

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

vi.mock('../pages/UserFormDrawer', () => ({
  default: () => <div>UserFormDrawer</div>,
}));

vi.mock('../pages/ChangeUserPasswordDrawer', () => ({
  default: () => <div>ChangeUserPasswordDrawer</div>,
}));

vi.mock('../pages/UsersSettingsForm', () => ({
  default: () => <div>UsersSettingsForm</div>,
}));

describe('UsersManagementPage', () => {
  beforeEach(() => {
    deniedActions.clear();
    open.mockReset();
    destroy.mockReset();
    list.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            username: 'root',
            roles: [{ name: 'root', title: 'Root' }],
          },
        ],
        meta: {
          page: 2,
          pageSize: 10,
          count: 1,
        },
      },
    });
    success.mockReset();
    resourceTableProps.current = null;
  });

  it('shows the add user action even when users:create is not granted', () => {
    deniedActions.add('users:create');

    render(<UsersManagementPage />);

    expect(screen.getByRole('button', { name: /Add new/ })).toBeInTheDocument();
  });

  it('requests users with roles append and maps list payload', async () => {
    render(<UsersManagementPage />);

    const response = await resourceTableProps.current?.request({
      filter: { username: { $includes: 'a' } },
      page: 2,
      pageSize: 10,
    });

    expect(list).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      filter: { username: { $includes: 'a' } },
      appends: ['roles'],
      sort: ['id'],
    });
    expect(response).toEqual({
      data: [
        {
          id: 1,
          username: 'root',
          roles: [{ name: 'root', title: 'Root' }],
        },
      ],
      page: 2,
      pageSize: 10,
      total: 1,
    });
  });

  it('disables root user selection and deletes selected users', async () => {
    render(<UsersManagementPage />);

    const rowSelection = resourceTableProps.current?.tableProps.rowSelection;
    expect(rowSelection.getCheckboxProps({ id: 1, roles: [{ name: 'root', title: 'Root' }] }).disabled).toBe(true);
    expect(rowSelection.getCheckboxProps({ id: 2, roles: [{ name: 'member', title: 'Member' }] }).disabled).toBe(false);

    act(() => {
      rowSelection.onChange([2]);
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    fireEvent.click(await screen.findByText('OK'));

    await waitFor(() => {
      expect(destroy).toHaveBeenCalledWith({ filterByTk: [2] });
    });
    expect(success).toHaveBeenCalledWith('Deleted successfully');
  });

  it('hides destructive controls when destroy permission is denied', () => {
    deniedActions.add('users:destroy');

    render(<UsersManagementPage />);

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(resourceTableProps.current?.tableProps.rowSelection).toBeUndefined();
  });

  it('opens edit and password drawers from row actions while hiding delete for root', async () => {
    render(<UsersManagementPage />);

    const actionsColumn = resourceTableProps.current?.columns.find(
      (column: Record<string, any>) => column.key === 'actions',
    );
    const rootCell = actionsColumn.render(null, {
      id: 1,
      username: 'root',
      roles: [{ name: 'root', title: 'Root' }],
    });
    const memberCell = actionsColumn.render(null, {
      id: 2,
      username: 'alice',
      roles: [{ name: 'member', title: 'Member' }],
    });

    const { rerender } = render(rootCell);
    expect(screen.getByRole('button', { name: 'Edit profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    expect(open).toHaveBeenLastCalledWith(
      expect.objectContaining({ inputArgs: expect.objectContaining({ filterByTk: 1 }) }),
    );

    rerender(memberCell);
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(open).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'drawer', width: '50%' }));

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(destroy).toHaveBeenCalledWith({ filterByTk: 2 });
    });
  });
});
