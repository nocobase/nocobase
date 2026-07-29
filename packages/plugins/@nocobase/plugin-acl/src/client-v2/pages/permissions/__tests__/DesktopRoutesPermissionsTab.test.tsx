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
import DesktopRoutesPermissionsTab from '../DesktopRoutesPermissionsTab';

interface RouteRecord {
  id: number;
  title?: string;
  children?: RouteRecord[];
}

interface MockColumn<RecordType> {
  dataIndex?: string;
  title?: React.ReactNode;
  render?: (value: unknown, record: RecordType, index: number) => React.ReactNode;
}

const state = vi.hoisted(() => ({
  desktopRoutes: [] as RouteRecord[],
  roleRoutes: [] as RouteRecord[],
  listDesktopRoutes: vi.fn(),
  listRoleRoutes: vi.fn(),
  addRoleRoutes: vi.fn(),
  removeRoleRoutes: vi.fn(),
  setRoleRoutes: vi.fn(),
  updateRole: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async () => {
  const ReactModule = await import('react');

  function renderRows(items: RouteRecord[], columns: Array<MockColumn<RouteRecord>>): React.ReactNode {
    return items.map((item, index) =>
      ReactModule.createElement(
        'div',
        { key: item.id, 'data-testid': `route-row-${item.id}` },
        columns.map((column, columnIndex) => {
          const value = column.dataIndex ? (item as unknown as Record<string, unknown>)[column.dataIndex] : undefined;
          return ReactModule.createElement(
            'span',
            { key: `${item.id}-${columnIndex}` },
            column.render ? column.render(value, item, index) : (value as React.ReactNode),
          );
        }),
        item.children?.length
          ? ReactModule.createElement(
              'div',
              { 'data-testid': `route-children-${item.id}` },
              renderRows(item.children, columns),
            )
          : null,
      ),
    );
  }

  return {
    Table: ({
      dataSource = [],
      columns = [],
    }: {
      dataSource?: RouteRecord[];
      columns?: Array<MockColumn<RouteRecord>>;
    }) =>
      ReactModule.createElement(
        'div',
        { 'data-testid': 'routes-table' },
        ReactModule.createElement('div', { 'data-testid': 'route-access-header' }, columns[1]?.title),
        renderRows(dataSource, columns),
      ),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: (name: string) => {
          if (name === 'desktopRoutes') {
            return {
              list: state.listDesktopRoutes,
            };
          }
          if (name === 'roles.desktopRoutes') {
            return {
              list: state.listRoleRoutes,
              add: state.addRoleRoutes,
              remove: state.removeRoleRoutes,
              set: state.setRoleRoutes,
            };
          }
          return {
            update: state.updateRole,
          };
        },
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

describe('DesktopRoutesPermissionsTab', () => {
  beforeEach(() => {
    state.desktopRoutes = [
      {
        id: 1,
        title: 'Operations',
        children: [
          { id: 2, title: 'Orders' },
          { id: 3, title: 'Invoices' },
        ],
      },
    ];
    state.roleRoutes = [{ id: 2, title: 'Orders' }];
    state.listDesktopRoutes.mockReset();
    state.listDesktopRoutes.mockResolvedValue({ data: { data: state.desktopRoutes } });
    state.listRoleRoutes.mockReset();
    state.listRoleRoutes.mockImplementation(async () => ({ data: { data: state.roleRoutes } }));
    state.addRoleRoutes.mockReset();
    state.addRoleRoutes.mockResolvedValue({});
    state.removeRoleRoutes.mockReset();
    state.removeRoleRoutes.mockResolvedValue({});
    state.setRoleRoutes.mockReset();
    state.setRoleRoutes.mockResolvedValue({});
    state.updateRole.mockReset();
    state.updateRole.mockResolvedValue({});
    state.success.mockReset();
  });

  it('prompts the user to select a role before configuring route permissions', () => {
    render(
      <DesktopRoutesPermissionsTab
        activeKey="general"
        activeRole={null}
        currentUserRole={null}
        onRoleChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Select a role to configure permissions')).toBeInTheDocument();
  });

  it('loads visible desktop routes and grants a child route with its parent', async () => {
    render(
      <DesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'member', title: 'Member' }}
        currentUserRole={null}
        onRoleChange={vi.fn()}
      />,
    );

    await screen.findByText('Operations');
    expect(state.listDesktopRoutes).toHaveBeenCalledWith({
      tree: true,
      sort: 'sort',
      paginate: false,
      filter: {
        hidden: { $ne: true },
      },
    });
    expect(state.listRoleRoutes).toHaveBeenCalledWith({
      paginate: false,
      filter: {
        hidden: { $ne: true },
      },
    });

    fireEvent.click(within(screen.getByTestId('route-row-3')).getByRole('checkbox'));

    await waitFor(() => {
      expect(state.addRoleRoutes).toHaveBeenCalledWith({ values: [3, 1] });
    });
    expect(state.success).toHaveBeenCalledWith('Saved successfully');
  });

  it('removes a selected child route and parent when no siblings remain selected', async () => {
    state.roleRoutes = [
      { id: 1, title: 'Operations' },
      { id: 2, title: 'Orders' },
    ];

    render(
      <DesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'member', title: 'Member' }}
        currentUserRole={null}
        onRoleChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(within(screen.getByTestId('route-row-2')).getByRole('checkbox')).toBeChecked();
    });
    fireEvent.click(within(screen.getByTestId('route-row-2')).getByRole('checkbox'));

    await waitFor(() => {
      expect(state.removeRoleRoutes).toHaveBeenCalledWith({ values: [1, 2] });
    });
  });

  it('sets all route permissions from the table header', async () => {
    render(
      <DesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={{ name: 'member', title: 'Member' }}
        currentUserRole={null}
        onRoleChange={vi.fn()}
      />,
    );

    await screen.findByText('Operations');
    fireEvent.click(within(screen.getByTestId('route-access-header')).getByRole('checkbox'));

    await waitFor(() => {
      expect(state.setRoleRoutes).toHaveBeenCalledWith({ values: [1, 2, 3] });
    });
  });

  it('updates whether new routes are allowed by default', async () => {
    const onRoleChange = vi.fn();
    const role = {
      name: 'member',
      title: 'Member',
      allowNewMenu: false,
    };

    render(
      <DesktopRoutesPermissionsTab
        activeKey="menu"
        activeRole={role}
        currentUserRole={null}
        onRoleChange={onRoleChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('New routes are allowed to be accessed by default'));

    await waitFor(() => {
      expect(state.updateRole).toHaveBeenCalledWith({
        filterByTk: 'member',
        values: { allowNewMenu: true },
      });
    });
    expect(onRoleChange).toHaveBeenCalledWith({
      ...role,
      allowNewMenu: true,
    });
  });
});
