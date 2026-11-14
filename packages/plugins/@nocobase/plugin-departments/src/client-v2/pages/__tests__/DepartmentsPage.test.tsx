/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import DepartmentsPage from '../DepartmentsPage';

interface DepartmentRecord {
  id: number;
  title?: string;
  parentId?: number | null;
  parent?: DepartmentRecord | null;
  children?: DepartmentRecord[];
  roles?: Array<{ name: string; title?: string }>;
  owners?: UserRecord[];
  departmentsUsers?: {
    isOwner?: boolean;
  };
}

interface UserRecord {
  id: number;
  nickname?: string;
  username?: string;
  phone?: string;
  email?: string;
  mainDepartmentId?: number | null;
  departments?: DepartmentRecord[];
}

interface MockColumn<RecordType> {
  title?: React.ReactNode;
  dataIndex?: string;
  render?: (value: unknown, record: RecordType, index: number) => React.ReactNode;
}

const state = vi.hoisted(() => ({
  departments: [] as DepartmentRecord[],
  users: [] as UserRecord[],
  usersExcludeDept: [] as UserRecord[],
  roles: [] as Array<{ name: string; title?: string }>,
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  destroyDepartment: vi.fn(),
  listDepartments: vi.fn(),
  listUsers: vi.fn(),
  updateUser: vi.fn(),
  listExcludeDept: vi.fn(),
  addDepartmentMembers: vi.fn(),
  removeDepartmentMembers: vi.fn(),
  addUserDepartments: vi.fn(),
  removeUserDepartments: vi.fn(),
  aggregateSearch: vi.fn(),
  listRoles: vi.fn(),
  listDepartmentMembers: vi.fn(),
  listUserDepartments: vi.fn(),
  drawer: vi.fn(),
  success: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  const ReactModule = await import('react');

  const MockApp = Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    useApp: () => ({
      modal: {
        confirm: state.confirm,
      },
      message: {
        success: state.success,
      },
    }),
  });

  function renderDropdownItems(
    items: Array<{ key: string; label?: React.ReactNode; disabled?: boolean; type?: string; children?: Array<any> }>,
    onClick?: (event: { key: string; domEvent: { stopPropagation: () => void } }) => void,
  ): React.ReactNode {
    return items.map((item) => {
      if (item.type === 'group') {
        return ReactModule.createElement(
          'div',
          { key: item.key },
          item.label ? ReactModule.createElement('div', {}, item.label) : null,
          item.children?.length ? renderDropdownItems(item.children, onClick) : null,
        );
      }

      return ReactModule.createElement(
        'button',
        {
          key: item.key,
          type: 'button',
          disabled: item.disabled,
          onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            const itemWithClick = item as { onClick?: () => void };
            itemWithClick.onClick?.();
            onClick?.({ key: item.key, domEvent: { stopPropagation: () => undefined } });
          },
        },
        item.label,
      );
    });
  }

  function renderTreeNodes(
    nodes: Array<{ key: React.Key; title: React.ReactNode; children?: Array<any> }>,
    onSelect?: (keys: React.Key[]) => void,
  ): React.ReactNode {
    return nodes.map((node) =>
      ReactModule.createElement(
        'div',
        { key: String(node.key), 'data-testid': `tree-node-${String(node.key)}` },
        ReactModule.createElement(
          'div',
          {
            role: 'button',
            tabIndex: 0,
            onClick: () => onSelect?.([node.key]),
            onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                onSelect?.([node.key]);
              }
            },
          },
          node.title,
        ),
        node.children?.length ? renderTreeNodes(node.children, onSelect) : null,
      ),
    );
  }

  return {
    ...actual,
    App: MockApp,
    Dropdown: ({
      children,
      menu,
    }: {
      children?: React.ReactNode;
      menu?: {
        items?: Array<{
          key: string;
          label?: React.ReactNode;
          disabled?: boolean;
          type?: string;
          children?: Array<any>;
        }>;
        onClick?: (event: { key: string; domEvent: { stopPropagation: () => void } }) => void;
      };
    }) =>
      ReactModule.createElement(
        'span',
        {},
        children,
        menu?.items?.length ? renderDropdownItems(menu.items, menu.onClick) : null,
      ),
    Tree: {
      ...actual.Tree,
      DirectoryTree: ({ treeData = [], onSelect }: { treeData?: Array<any>; onSelect?: (keys: React.Key[]) => void }) =>
        ReactModule.createElement('div', { 'data-testid': 'department-tree' }, renderTreeNodes(treeData, onSelect)),
    },
  };
});

vi.mock('@nocobase/client-v2', async () => {
  const ReactModule = await import('react');

  function getValue<RecordType>(record: RecordType, dataIndex?: string) {
    return dataIndex ? (record as Record<string, unknown>)[dataIndex] : undefined;
  }

  function renderRows<RecordType extends { id: React.Key; children?: RecordType[] }>(
    items: RecordType[],
    columns: Array<MockColumn<RecordType>>,
    rowSelection?: {
      selectedRowKeys?: React.Key[];
      onChange?: (keys: React.Key[], records: RecordType[]) => void;
      getCheckboxProps?: (record: RecordType) => { disabled?: boolean };
    },
  ): React.ReactNode {
    return items.map((item, index) =>
      ReactModule.createElement(
        'div',
        { key: item.id, 'data-testid': `table-row-${item.id}` },
        rowSelection
          ? ReactModule.createElement('input', {
              type: 'checkbox',
              'aria-label': `select-${item.id}`,
              checked: rowSelection.selectedRowKeys?.includes(item.id) ?? false,
              disabled: rowSelection.getCheckboxProps?.(item)?.disabled,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                rowSelection.onChange?.(event.target.checked ? [item.id] : [], event.target.checked ? [item] : []);
              },
            })
          : null,
        columns.map((column, columnIndex) => {
          const value = column.dataIndex ? getValue(item, column.dataIndex) : item;
          return ReactModule.createElement(
            'span',
            { key: `${item.id}-${columnIndex}` },
            column.render ? column.render(value, item, index) : (value as React.ReactNode),
          );
        }),
        item.children?.length ? renderRows(item.children, columns, rowSelection) : null,
      ),
    );
  }

  return {
    CollectionFilter: ({ onChange }: { onChange: (filter: Record<string, unknown>) => void }) =>
      ReactModule.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onChange({ nickname: { $includes: 'Alice' } }),
        },
        'Apply filter',
      ),
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
        ReactModule.createElement(
          'button',
          {
            type: 'button',
            onClick: async () => {
              try {
                await onSubmit?.();
              } catch {
                // Keep validation errors in the rendered form; tests assert behavior through API calls.
              }
            },
          },
          submitText ?? 'Submit',
        ),
        ReactModule.createElement('button', { type: 'button' }, cancelText ?? 'Cancel'),
      ),
    Table: <RecordType extends { id: React.Key; children?: RecordType[] }>({
      dataSource = [],
      columns = [],
      rowSelection,
    }: {
      dataSource?: RecordType[];
      columns?: Array<MockColumn<RecordType>>;
      rowSelection?: {
        selectedRowKeys?: React.Key[];
        onChange?: (keys: React.Key[], records: RecordType[]) => void;
        getCheckboxProps?: (record: RecordType) => { disabled?: boolean };
      };
    }) =>
      ReactModule.createElement('div', { 'data-testid': 'mock-table' }, renderRows(dataSource, columns, rowSelection)),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: (name: string, resourceOf?: string | number) => {
          if (name === 'departments') {
            return {
              list: state.listDepartments,
              create: state.createDepartment,
              update: state.updateDepartment,
              destroy: state.destroyDepartment,
              aggregateSearch: state.aggregateSearch,
            };
          }
          if (name === 'users') {
            return {
              list: state.listUsers,
              listExcludeDept: state.listExcludeDept,
              update: state.updateUser,
            };
          }
          if (name === 'roles') {
            return {
              list: state.listRoles,
            };
          }
          if (name === 'departments.members') {
            return {
              add: state.addDepartmentMembers,
              remove: state.removeDepartmentMembers,
            };
          }
          if (name === `departments/${resourceOf}/members` || /^departments\/[^/]+\/members$/.test(name)) {
            return {
              list: state.listDepartmentMembers,
            };
          }
          if (name === 'users.departments') {
            return {
              list: state.listUserDepartments,
              add: state.addUserDepartments,
              remove: state.removeUserDepartments,
            };
          }
          return {};
        },
      },
      dataSourceManager: {
        getDataSource: () => ({
          getCollection: () => ({ name: 'users' }),
        }),
      },
      viewer: {
        drawer: state.drawer,
      },
    }),
  };
});

vi.mock('../../locale', () => ({
  useT: () => (value: string) => value,
}));

describe('DepartmentsPage', () => {
  beforeEach(() => {
    state.departments = [
      {
        id: 1,
        title: 'Headquarters',
        parentId: null,
      },
      {
        id: 2,
        title: 'Engineering',
        parentId: 1,
        parent: { id: 1, title: 'Headquarters' },
        roles: [{ name: 'admin', title: 'Admin' }],
        owners: [{ id: 10, nickname: 'Alice' }],
      },
    ];
    state.users = [
      {
        id: 10,
        nickname: 'Alice',
        username: 'alice',
        email: 'alice@example.com',
        departments: [
          {
            id: 2,
            title: 'Engineering',
            parent: { id: 1, title: 'Headquarters' },
            departmentsUsers: { isOwner: true },
          },
        ],
      },
    ];
    state.usersExcludeDept = [
      {
        id: 11,
        nickname: 'Bob',
        username: 'bob',
        email: 'bob@example.com',
      },
    ];
    state.roles = [{ name: 'admin', title: 'Admin' }];
    state.listDepartments.mockReset();
    state.listDepartments.mockResolvedValue({ data: { data: state.departments } });
    state.listUsers.mockReset();
    state.listUsers.mockResolvedValue({ data: { data: state.users, meta: { count: state.users.length } } });
    state.updateUser.mockReset();
    state.updateUser.mockResolvedValue({});
    state.listExcludeDept.mockReset();
    state.listExcludeDept.mockResolvedValue({
      data: { data: state.usersExcludeDept, meta: { count: state.usersExcludeDept.length } },
    });
    state.listRoles.mockReset();
    state.listRoles.mockResolvedValue({ data: { data: state.roles } });
    state.listDepartmentMembers.mockReset();
    state.listDepartmentMembers.mockResolvedValue({ data: { data: state.users } });
    state.listUserDepartments.mockReset();
    state.listUserDepartments.mockResolvedValue({ data: { data: [state.departments[1]] } });
    state.createDepartment.mockReset();
    state.createDepartment.mockResolvedValue({});
    state.updateDepartment.mockReset();
    state.updateDepartment.mockResolvedValue({});
    state.destroyDepartment.mockReset();
    state.destroyDepartment.mockResolvedValue({});
    state.addDepartmentMembers.mockReset();
    state.addDepartmentMembers.mockResolvedValue({});
    state.removeDepartmentMembers.mockReset();
    state.removeDepartmentMembers.mockResolvedValue({});
    state.addUserDepartments.mockReset();
    state.addUserDepartments.mockResolvedValue({});
    state.removeUserDepartments.mockReset();
    state.removeUserDepartments.mockResolvedValue({});
    state.aggregateSearch.mockReset();
    state.aggregateSearch.mockResolvedValue({ data: { data: { users: [], departments: [] } } });
    state.drawer.mockReset();
    state.success.mockReset();
    state.confirm.mockReset();
    state.confirm.mockImplementation(({ onOk }: { onOk?: () => Promise<void> | void }) => onOk?.());
  });

  it('loads departments and filters members after selecting a department', async () => {
    render(<DepartmentsPage />);

    expect(await screen.findByText('Engineering')).toBeInTheDocument();
    expect(await screen.findByText('Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Engineering'));

    await waitFor(() => {
      expect(state.listUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filter: { 'departments.id': 2 },
        }),
      );
    });
    expect(screen.getByText('Add members')).toBeInTheDocument();
  });

  it('opens the department form and creates a department with default relations', async () => {
    render(<DepartmentsPage />);

    fireEvent.click(await screen.findByText('New department'));

    expect(state.drawer).toHaveBeenCalledWith(
      expect.objectContaining({
        closable: true,
        width: '50%',
        content: expect.any(Function),
      }),
    );

    const drawerOptions = state.drawer.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<>{drawerOptions.content()}</>);

    fireEvent.change(screen.getByLabelText('Department name'), { target: { value: 'Product' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(state.createDepartment).toHaveBeenCalledWith({
        values: {
          title: 'Product',
          parent: null,
          roles: [],
        },
      });
    });
  });

  it('adds selected users to the selected department', async () => {
    render(<DepartmentsPage />);

    fireEvent.click(await screen.findByText('Engineering'));
    fireEvent.click(await screen.findByText('Add members'));

    expect(state.drawer).toHaveBeenCalledWith(
      expect.objectContaining({
        width: '50%',
        content: expect.any(Function),
      }),
    );

    const drawerOptions = state.drawer.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<>{drawerOptions.content()}</>);

    expect(await screen.findByText('Bob')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('select-11'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(state.addDepartmentMembers).toHaveBeenCalledWith({ values: [11] });
    });
  });

  it('edits and deletes a department from the tree actions', async () => {
    render(<DepartmentsPage />);

    const engineeringNode = await screen.findByTestId('tree-node-2');
    fireEvent.click(within(engineeringNode).getByText('Edit department'));

    const drawerOptions = state.drawer.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<>{drawerOptions.content()}</>);

    const departmentNameInputs = screen.getAllByLabelText('Department name');
    fireEvent.change(departmentNameInputs[departmentNameInputs.length - 1], { target: { value: 'Engineering Ops' } });
    const submitButtons = screen.getAllByRole('button', { name: 'Submit' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(state.updateDepartment).toHaveBeenCalledWith({
        filterByTk: 2,
        values: {
          title: 'Engineering Ops',
          parent: { id: 1 },
          roles: [{ name: 'admin' }],
          owners: [{ id: 10 }],
        },
      });
    });

    state.drawer.mockClear();
    fireEvent.click(within(engineeringNode).getByText('Delete department'));

    await waitFor(() => {
      expect(state.destroyDepartment).toHaveBeenCalledWith({ filterByTk: 2 });
    });
    expect(state.success).toHaveBeenCalledWith('Deleted successfully');
  });

  it('creates a sub department from the department tree actions', async () => {
    render(<DepartmentsPage />);

    const engineeringNode = await screen.findByTestId('tree-node-2');
    fireEvent.click(within(engineeringNode).getByText('New sub department'));

    const drawerOptions = state.drawer.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<>{drawerOptions.content()}</>);
    fireEvent.change(screen.getByLabelText('Department name'), { target: { value: 'Platform' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(state.createDepartment).toHaveBeenCalledWith({
        values: {
          title: 'Platform',
          parent: { id: 2 },
          roles: [],
        },
      });
    });
  });

  it('removes a member from the selected department', async () => {
    render(<DepartmentsPage />);

    fireEvent.click(await screen.findByText('Engineering'));
    const aliceRow = await screen.findByTestId('table-row-10');
    fireEvent.click(within(aliceRow).getByText('Remove'));

    await waitFor(() => {
      expect(state.removeDepartmentMembers).toHaveBeenCalledWith({ values: [10] });
    });
  });

  it('configures user departments by setting the main department and removing a department', async () => {
    state.users[0].mainDepartmentId = 1;
    state.listUserDepartments.mockResolvedValue({ data: { data: [state.departments[0], state.departments[1]] } });

    render(<DepartmentsPage />);

    const aliceRow = await screen.findByTestId('table-row-10');
    fireEvent.click(within(aliceRow).getByText('Configure'));

    const drawerOptions = state.drawer.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<>{drawerOptions.content()}</>);

    expect(await screen.findByText('Headquarters / Engineering')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Set as main department'));

    await waitFor(() => {
      expect(state.updateUser).toHaveBeenCalledWith({
        filterByTk: 10,
        values: { mainDepartmentId: 2 },
      });
    });
    expect(state.success).toHaveBeenCalledWith('Set successfully');

    fireEvent.click(screen.getAllByText('Remove')[0]);

    await waitFor(() => {
      expect(state.removeUserDepartments).toHaveBeenCalledWith({ values: [1] });
    });
    expect(state.success).toHaveBeenCalledWith('Deleted successfully');
  });

  it('adds departments to a user from the user departments drawer', async () => {
    render(<DepartmentsPage />);

    const aliceRow = await screen.findByTestId('table-row-10');
    fireEvent.click(within(aliceRow).getByText('Configure'));

    const userDepartmentsDrawer = state.drawer.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<>{userDepartmentsDrawer.content()}</>);

    fireEvent.click(await screen.findByLabelText('Add departments'));

    const departmentPickerDrawer = state.drawer.mock.calls[1][0] as { content: () => React.ReactNode };
    render(<>{departmentPickerDrawer.content()}</>);

    expect(await screen.findByText('Headquarters')).toBeInTheDocument();
    expect(screen.getByLabelText('select-2')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('select-1'));
    const submitButtons = screen.getAllByRole('button', { name: 'Submit' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(state.addUserDepartments).toHaveBeenCalledWith({ values: [1] });
    });
  });
});
