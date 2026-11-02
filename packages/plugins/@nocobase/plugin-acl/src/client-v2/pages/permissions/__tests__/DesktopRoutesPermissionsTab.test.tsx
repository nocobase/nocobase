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
              list: async () => ({
                data: {
                  data: [
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
              }),
            }
          : { list: state.list, add: state.add, remove: state.remove },
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
    state.list.mockImplementation(async () => ({ data: { data: state.selected.map((id) => ({ id })) } }));
    state.add.mockImplementation(async ({ values }: { values: number[] }) => {
      state.selected = [...new Set([...state.selected, ...values])];
    });
    state.remove.mockImplementation(async ({ values }: { values: number[] }) => {
      state.selected = state.selected.filter((id) => !values.includes(id));
    });
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
