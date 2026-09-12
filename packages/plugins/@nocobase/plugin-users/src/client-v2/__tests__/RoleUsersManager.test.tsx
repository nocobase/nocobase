/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import RoleUsersManager from '../pages/RoleUsersManager';

const { open, list, listExcludeRole, add, remove, success, tableProps, pickerProps } = vi.hoisted(() => ({
  open: vi.fn(),
  list: vi.fn(),
  listExcludeRole: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  success: vi.fn(),
  tableProps: {
    current: null as null | Record<string, any>,
  },
  pickerProps: {
    current: null as null | Record<string, any>,
  },
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
      resource: (name: string) => {
        if (name === 'users') {
          return {
            listExcludeRole,
          };
        }
        return {
          list,
          add,
          remove,
        };
      },
    },
    message: {
      success,
    },
  }),
}));

vi.mock('../components/resource', () => ({
  ResourceTablePage: (props: Record<string, any>) => {
    tableProps.current = props;
    return <div>{props.toolbar({ refreshAsync: vi.fn().mockResolvedValue(undefined) })}</div>;
  },
  ResourcePickerView: (props: Record<string, any>) => {
    pickerProps.current = props;
    return <div>ResourcePickerView</div>;
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

describe('RoleUsersManager', () => {
  beforeEach(() => {
    open.mockReset();
    list.mockResolvedValue({
      data: {
        data: [{ id: 1, username: 'alice' }],
        meta: {
          page: 1,
          pageSize: 20,
          total: 1,
        },
      },
    });
    listExcludeRole.mockResolvedValue({
      data: {
        data: [{ id: 2, username: 'bob' }],
        meta: {
          page: 1,
          pageSize: 20,
          count: 1,
        },
      },
    });
    add.mockReset();
    remove.mockReset();
    success.mockReset();
    tableProps.current = null;
    pickerProps.current = null;
  });

  it('shows empty state when no role is selected', () => {
    render(<RoleUsersManager role={null as never} />);

    expect(screen.getByText('Select a role to configure permissions')).toBeInTheDocument();
  });

  it('loads users for the selected role', async () => {
    render(<RoleUsersManager role={{ name: 'admin', title: 'Admin' } as never} />);

    const response = await tableProps.current?.request({
      filter: { username: { $includes: 'a' } },
      page: 2,
      pageSize: 10,
    });

    expect(list).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      filter: { username: { $includes: 'a' } },
    });
    expect(response).toEqual({
      data: [{ id: 1, username: 'alice' }],
      page: 1,
      pageSize: 20,
      total: 1,
    });
  });

  it('opens picker and adds selected users to the role', async () => {
    render(<RoleUsersManager role={{ name: 'admin', title: 'Admin' } as never} />);

    fireEvent.click(screen.getByRole('button', { name: /Add users/ }));

    expect(open).toHaveBeenCalledWith(expect.objectContaining({ type: 'drawer', width: '50%' }));

    const drawer = open.mock.calls[0][0];
    render(drawer.content());

    const pickerResponse = await pickerProps.current?.request({
      filter: { username: { $includes: 'b' } },
      page: 3,
      pageSize: 20,
    });

    expect(listExcludeRole).toHaveBeenCalledWith({
      page: 3,
      pageSize: 20,
      roleName: 'admin',
      filter: { username: { $includes: 'b' } },
    });
    expect(pickerResponse).toEqual({
      data: [{ id: 2, username: 'bob' }],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    await pickerProps.current?.onSubmit([{ id: 2, username: 'bob' }]);

    await waitFor(() => {
      expect(add).toHaveBeenCalledWith({ values: [2] });
    });
    expect(success).toHaveBeenCalledWith('Saved successfully');
  });

  it('removes a user from row actions', async () => {
    render(<RoleUsersManager role={{ name: 'admin', title: 'Admin' } as never} />);

    const actionsColumn = tableProps.current?.columns.find((column: Record<string, any>) => column.key === 'actions');
    render(actionsColumn.render(null, { id: 2, username: 'alice' }));

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith({ values: [2] });
    });
    expect(success).toHaveBeenCalledWith('Removed successfully');
  });
});
