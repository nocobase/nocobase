/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import DesktopRoutesPermissionsTab from '../DesktopRoutesPermissionsTab';

const state = vi.hoisted(() => ({
  selected: [] as number[],
  routes: [] as Array<{ id: number; title: string; type: string }>,
  routesList: vi.fn(),
  set: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async () => ({ Table: (await import('antd')).Table }));
vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      resource: (name: string) =>
        name === 'desktopRoutes'
          ? {
              list: state.routesList.mockImplementation(async () => ({
                data: {
                  data: [
                    ...state.routes,
                    {
                      id: 1,
                      title: 'Root',
                      children: [
                        {
                          id: 2,
                          title: 'Group',
                          children: [
                            { id: 3, title: 'Page', children: [{ id: 4, title: 'Leaf' }] },
                            { id: 5, title: 'Sibling' },
                          ],
                        },
                      ],
                    },
                  ],
                },
              })),
            }
          : { list: state.list, add: state.add, remove: state.remove, set: state.set },
    },
    message: { success: state.success },
  }),
}));
vi.mock('../../../locale', () => ({ useT: () => (value: string) => value }));

function renderPermissions() {
  return render(
    <DesktopRoutesPermissionsTab
      activeKey="menu"
      activeRole={{ name: 'member', title: 'Member' }}
      currentUserRole={null}
      onRoleChange={vi.fn()}
    />,
  );
}

function checkbox(title: string) {
  return within(screen.getByText(title).closest('tr')!).getByRole('checkbox');
}

async function expandRoutes() {
  for (const title of ['Root', 'Group', 'Page']) {
    const row = (await screen.findByText(title)).closest('tr');
    fireEvent.click(within(row!).getByRole('button', { name: 'Expand row' }));
  }
  await waitFor(() => expect(state.list).toHaveBeenCalled());
}

describe('DesktopRoutesPermissionsTab', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    state.selected = [];
    state.routes = [];
    state.set.mockImplementation(async ({ values }: { values: number[] }) => {
      state.selected = values;
    });
    state.list.mockImplementation(async () => ({ data: { data: state.selected.map((id) => ({ id })) } }));
    state.add.mockImplementation(async ({ values }: { values: number[] }) => {
      state.selected = [...new Set([...state.selected, ...values])];
    });
    state.remove.mockImplementation(async ({ values }: { values: number[] }) => {
      state.selected = state.selected.filter((id) => !values.includes(id));
    });
  });

  it('lists v1 and v2 menus in the same admin layout and grants access to both', async () => {
    state.routes = [
      { id: 6, title: 'V1 page', type: 'page' },
      { id: 7, title: 'V2 page', type: 'flowPage' },
    ];
    state.selected = [6];
    renderPermissions();
    expect(await screen.findByText('V1 page')).toBeInTheDocument();
    expect(await screen.findByText('V2 page')).toBeInTheDocument();
    await waitFor(() => expect(checkbox('V1 page')).toBeChecked());
    expect(checkbox('V2 page')).not.toBeChecked();
    const filter = { hidden: { $ne: true }, 'uiLayouts.uid': 'admin-layout-model' };
    expect(state.routesList).toHaveBeenCalledWith({ tree: true, sort: 'sort', paginate: false, filter });
    expect(state.list).toHaveBeenCalledWith({ paginate: false, filter });

    fireEvent.click(checkbox('V2 page'));
    await waitFor(() => expect(state.success).toHaveBeenCalledTimes(1));
    expect(state.add).toHaveBeenCalledWith({ values: [7] });
    expect(checkbox('V1 page')).toBeChecked();
    expect(checkbox('V2 page')).toBeChecked();

    fireEvent.click(checkbox('V1 page'));
    await waitFor(() => expect(state.success).toHaveBeenCalledTimes(2));
    expect(state.remove).toHaveBeenCalledWith({ values: [6] });
    expect(checkbox('V1 page')).not.toBeChecked();
    expect(checkbox('V2 page')).toBeChecked();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Allow access' }));
    await waitFor(() => expect(state.success).toHaveBeenCalledTimes(3));
    expect(state.set).toHaveBeenCalledWith({ values: [6, 7, 1, 2, 3, 4, 5] });
    expect(checkbox('V1 page')).toBeChecked();
    expect(checkbox('V2 page')).toBeChecked();
  });

  it('selects and persists every ancestor without selecting siblings, including after reloading', async () => {
    const view = renderPermissions();
    await expandRoutes();
    fireEvent.click(checkbox('Leaf'));
    await waitFor(() => expect(state.success).toHaveBeenCalled());
    expect(state.add).toHaveBeenCalledWith({ values: [4, 3, 2, 1] });
    for (const title of ['Root', 'Group', 'Page', 'Leaf']) {
      expect(checkbox(title)).toBeChecked();
    }
    expect(checkbox('Sibling')).not.toBeChecked();
    view.unmount();
    renderPermissions();
    await expandRoutes();
    for (const title of ['Root', 'Group', 'Page', 'Leaf']) {
      expect(checkbox(title)).toBeChecked();
    }
    expect(checkbox('Sibling')).not.toBeChecked();
  });

  it.each([false, true])('removes empty ancestors and preserves sibling permissions (sibling: %s)', async (sibling) => {
    state.selected = [1, 2, 3, 4, ...(sibling ? [5] : [])];
    renderPermissions();
    await expandRoutes();
    await waitFor(() => expect(checkbox('Leaf')).toBeChecked());
    fireEvent.click(checkbox('Leaf'));
    await waitFor(() => expect(state.success).toHaveBeenCalled());
    expect(state.remove).toHaveBeenCalledWith({ values: sibling ? [3, 4] : [1, 2, 3, 4] });
    expect(checkbox('Leaf')).not.toBeChecked();
    expect(checkbox('Page')).not.toBeChecked();
    for (const title of ['Root', 'Group', 'Sibling']) {
      expect(checkbox(title)).toHaveProperty('checked', sibling);
    }
  });

  it('adds descendants and missing ancestors even when the immediate parent is already selected', async () => {
    state.selected = [2, 5];
    renderPermissions();
    await expandRoutes();
    await waitFor(() => expect(checkbox('Group')).toBeChecked());
    fireEvent.click(checkbox('Page'));
    await waitFor(() => expect(state.success).toHaveBeenCalled());
    expect(state.add).toHaveBeenCalledWith({ values: [3, 4, 1] });
    expect([...state.selected].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('removes a group and all descendants while preserving another selected branch', async () => {
    state.selected = [1, 2, 3, 4, 5];
    renderPermissions();
    await expandRoutes();
    await waitFor(() => expect(checkbox('Page')).toBeChecked());
    fireEvent.click(checkbox('Page'));
    await waitFor(() => expect(state.success).toHaveBeenCalled());
    expect(state.remove).toHaveBeenCalledWith({ values: [3, 4] });
    expect(state.selected).toEqual([1, 2, 5]);
  });
});
