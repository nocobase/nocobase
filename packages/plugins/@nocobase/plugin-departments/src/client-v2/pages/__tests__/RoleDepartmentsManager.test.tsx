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
import RoleDepartmentsManager from '../RoleDepartmentsManager';

interface DepartmentRecord {
  id: number;
  title?: string;
  parent?: DepartmentRecord | null;
  children?: DepartmentRecord[];
  isLeaf?: boolean;
  roles?: Array<{ name: string }>;
}

interface MockColumn<RecordType> {
  title?: React.ReactNode;
  dataIndex?: string;
  render?: (value: unknown, record: RecordType, index: number) => React.ReactNode;
}

const state = vi.hoisted(() => ({
  roleDepartments: [] as DepartmentRecord[],
  pickerDepartments: [] as DepartmentRecord[],
  childDepartments: [] as DepartmentRecord[],
  listRoleDepartments: vi.fn(),
  removeRoleDepartments: vi.fn(),
  listDepartments: vi.fn(),
  addRoleDepartments: vi.fn(),
  drawer: vi.fn(),
  close: vi.fn(),
  success: vi.fn(),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  return {
    ...actual,
    Popconfirm: ({
      children,
      onConfirm,
      title,
    }: {
      children?: React.ReactNode;
      onConfirm?: () => void | Promise<void>;
      title?: React.ReactNode;
    }) => (
      <span>
        {children}
        <button type="button" onClick={() => onConfirm?.()}>
          {title}
        </button>
      </span>
    ),
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
    expandable?: {
      rowExpandable?: (record: RecordType) => boolean;
      onExpand?: (expanded: boolean, record: RecordType) => void;
      onExpandedRowsChange?: (keys: React.Key[]) => void;
    },
  ): React.ReactNode {
    return items.map((item, index) =>
      ReactModule.createElement(
        'div',
        { key: item.id, 'data-testid': `department-row-${item.id}` },
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
        expandable?.rowExpandable?.(item)
          ? ReactModule.createElement(
              'button',
              {
                type: 'button',
                onClick: () => {
                  expandable.onExpand?.(true, item);
                  expandable.onExpandedRowsChange?.([item.id]);
                },
              },
              `expand-${item.id}`,
            )
          : null,
        columns.map((column, columnIndex) => {
          const value = column.dataIndex ? getValue(item, column.dataIndex) : item;
          return ReactModule.createElement(
            'span',
            { key: `${item.id}-${columnIndex}` },
            column.render ? column.render(value, item, index) : (value as React.ReactNode),
          );
        }),
        item.children?.length ? renderRows(item.children, columns, rowSelection, expandable) : null,
      ),
    );
  }

  return {
    CollectionFilter: ({ onChange }: { onChange: (filter: Record<string, unknown>) => void }) =>
      ReactModule.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onChange({ title: { $includes: 'Eng' } }),
        },
        'Apply filter',
      ),
    Table: <RecordType extends { id: React.Key; children?: RecordType[] }>({
      dataSource = [],
      columns = [],
      rowSelection,
      expandable,
    }: {
      dataSource?: RecordType[];
      columns?: Array<MockColumn<RecordType>>;
      rowSelection?: {
        selectedRowKeys?: React.Key[];
        onChange?: (keys: React.Key[], records: RecordType[]) => void;
        getCheckboxProps?: (record: RecordType) => { disabled?: boolean };
      };
      expandable?: {
        rowExpandable?: (record: RecordType) => boolean;
        onExpand?: (expanded: boolean, record: RecordType) => void;
        onExpandedRowsChange?: (keys: React.Key[]) => void;
      };
    }) =>
      ReactModule.createElement(
        'div',
        { 'data-testid': 'departments-table' },
        renderRows(dataSource, columns, rowSelection, expandable),
      ),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: (name: string, resourceOf?: string | number) => {
          if (name === 'roles/admin/departments') {
            return {
              list: state.listRoleDepartments,
              remove: state.removeRoleDepartments,
            };
          }
          if (name === 'roles.departments' && resourceOf === 'admin') {
            return {
              add: state.addRoleDepartments,
            };
          }
          if (name === 'departments') {
            return {
              list: state.listDepartments,
            };
          }
          return {};
        },
      },
      dataSourceManager: {
        getDataSource: () => ({
          getCollection: () => ({ name: 'departments' }),
        }),
      },
      viewer: {
        drawer: state.drawer,
      },
      message: {
        success: state.success,
      },
    }),
    useFlowView: () => ({
      close: state.close,
      Header: ({ title }: { title: React.ReactNode }) => <div>{title}</div>,
      Footer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }),
  };
});

vi.mock('../../locale', () => ({
  useT: () => (value: string) => value,
}));

describe('RoleDepartmentsManager', () => {
  beforeEach(() => {
    state.roleDepartments = [
      {
        id: 2,
        title: 'Engineering',
        parent: {
          id: 1,
          title: 'Headquarters',
        },
      },
    ];
    state.pickerDepartments = [
      {
        id: 3,
        title: 'Sales',
        isLeaf: true,
        roles: [],
      },
      {
        id: 4,
        title: 'Already bound',
        isLeaf: true,
        roles: [{ name: 'admin' }],
      },
      {
        id: 5,
        title: 'Product',
        isLeaf: false,
        roles: [],
      },
    ];
    state.childDepartments = [{ id: 6, title: 'Platform', isLeaf: true, roles: [] }];
    state.listRoleDepartments.mockReset();
    state.listRoleDepartments.mockResolvedValue({
      data: {
        data: state.roleDepartments,
        meta: {
          page: 1,
          pageSize: 20,
          total: 1,
        },
      },
    });
    state.removeRoleDepartments.mockReset();
    state.removeRoleDepartments.mockResolvedValue({});
    state.listDepartments.mockReset();
    state.listDepartments.mockImplementation(async ({ filter }: { filter?: Record<string, unknown> } = {}) => ({
      data: {
        data: filter?.parentId === 5 ? state.childDepartments : state.pickerDepartments,
        meta: {
          page: 1,
          pageSize: 20,
          total: 3,
        },
      },
    }));
    state.addRoleDepartments.mockReset();
    state.addRoleDepartments.mockResolvedValue({});
    state.drawer.mockReset();
    state.close.mockReset();
    state.close.mockResolvedValue(undefined);
    state.success.mockReset();
  });

  it('prompts when no role is selected', () => {
    render(<RoleDepartmentsManager active={false} role={null} onRoleChange={vi.fn()} />);

    expect(screen.getByText('Select a role to configure permissions')).toBeInTheDocument();
  });

  it('loads role departments and removes a selected department', async () => {
    render(<RoleDepartmentsManager active role={{ name: 'admin', title: 'Admin' }} onRoleChange={vi.fn()} />);

    expect(await screen.findByText('Headquarters / Engineering')).toBeInTheDocument();
    expect(state.listRoleDepartments).toHaveBeenCalledWith({
      appends: ['parent(recursively=true)'],
      filter: undefined,
      page: 1,
      pageSize: 20,
    });

    fireEvent.click(screen.getByLabelText('select-2'));
    const removeButton = screen.getAllByText('Remove').find((element) => element.tagName === 'BUTTON');
    expect(removeButton).toBeDefined();
    fireEvent.click(removeButton as HTMLElement);

    await waitFor(() => {
      expect(state.removeRoleDepartments).toHaveBeenCalledWith({ values: [2] });
    });
    expect(state.success).toHaveBeenCalledWith('Removed successfully');
  });

  it('opens the department picker and adds selected departments to the role', async () => {
    render(<RoleDepartmentsManager active role={{ name: 'admin', title: 'Admin' }} onRoleChange={vi.fn()} />);

    fireEvent.click(await screen.findByText('Add departments'));

    expect(state.drawer).toHaveBeenCalledWith(
      expect.objectContaining({
        closable: true,
        width: '50%',
        content: expect.any(Function),
      }),
    );

    const drawerOptions = state.drawer.mock.calls[0][0] as { content: () => React.ReactNode };
    render(<>{drawerOptions.content()}</>);

    expect(await screen.findByText('Sales')).toBeInTheDocument();
    expect(screen.getByLabelText('select-4')).toBeDisabled();
    fireEvent.click(screen.getByText('expand-5'));

    await waitFor(() => {
      expect(state.listDepartments).toHaveBeenCalledWith({
        appends: ['parent(recursively=true)', 'roles'],
        filter: { parentId: 5 },
        paginate: false,
        sort: ['sort'],
      });
    });

    fireEvent.click(screen.getByLabelText('select-3'));
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(state.addRoleDepartments).toHaveBeenCalledWith({ values: [3] });
    });
    expect(state.success).toHaveBeenCalledWith('Saved successfully');
    expect(state.close).toHaveBeenCalled();
  });
});
