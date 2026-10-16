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
import type { PluginSettingsPageType } from '@nocobase/client-v2';
import PluginPermissionsTable from '../PluginPermissionsTable';
import SystemPermissionsTab from '../SystemPermissionsTab';

type TestSettingsPage = Pick<PluginSettingsPageType, 'key' | 'title' | 'aclSnippet' | 'showTabs'> & {
  children?: TestSettingsPage[];
};

const state = vi.hoisted(() => ({
  settings: [] as TestSettingsPage[],
  aclSnippets: [] as string[],
  roleSnippets: [] as string[],
  add: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
  success: vi.fn(),
  setSystemSnippet: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async () => {
  const ReactModule = await import('react');

  function renderRows(items: readonly TestSettingsPage[], columns: Array<Record<string, unknown>>): React.ReactNode {
    return items.map((item, index) =>
      ReactModule.createElement(
        'div',
        {
          key: item.key,
          'data-testid': `row-${item.key}`,
        },
        columns.map((column, columnIndex) => {
          const dataIndex = typeof column.dataIndex === 'string' ? column.dataIndex : undefined;
          const value = dataIndex ? (item as unknown as Record<string, unknown>)[dataIndex] : undefined;
          const renderCell = column.render as
            | ((value: unknown, record: TestSettingsPage, index: number) => React.ReactNode)
            | undefined;
          return ReactModule.createElement(
            'span',
            { key: `${item.key}-${columnIndex}` },
            renderCell ? renderCell(value, item, index) : (value as React.ReactNode),
          );
        }),
        item.children?.length
          ? ReactModule.createElement(
              'div',
              { 'data-testid': `children-${item.key}` },
              renderRows(item.children, columns),
            )
          : null,
      ),
    );
  }

  return {
    Table: ({ dataSource = [], columns = [] }: { dataSource?: TestSettingsPage[]; columns?: unknown[] }) =>
      ReactModule.createElement(
        'div',
        { 'data-testid': 'plugin-permissions-table' },
        renderRows(dataSource, columns as Array<Record<string, unknown>>),
      ),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: () => ({
          list: state.list,
          add: state.add,
          remove: state.remove,
          setSystemSnippet: state.setSystemSnippet,
        }),
      },
      app: {
        pluginSettingsManager: {
          getList: () => state.settings,
          getAclSnippets: () => state.aclSnippets,
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

describe('PluginPermissionsTable', () => {
  afterEach(cleanup);
  beforeEach(() => {
    state.settings = [];
    state.aclSnippets = [];
    state.roleSnippets = ['pm.*'];
    state.add.mockReset();
    state.remove.mockReset();
    state.list.mockReset();
    state.success.mockReset();
    state.list.mockImplementation(async () => ({ data: { data: [...state.roleSnippets] } }));
    state.add.mockImplementation(async ({ values }: { values: string[] }) => {
      state.roleSnippets = [...new Set([...state.roleSnippets, ...values])];
    });
    state.remove.mockImplementation(async ({ values }: { values: string[] }) => {
      state.roleSnippets = state.roleSnippets.filter((snippet) => !values.includes(snippet));
    });
    state.setSystemSnippet.mockReset();
    state.setSystemSnippet.mockImplementation(async ({ values }: { values: { snippet: string; enabled: boolean } }) => {
      state.roleSnippets = state.roleSnippets.filter(
        (snippet) => snippet !== values.snippet && snippet !== `!${values.snippet}`,
      );
      state.roleSnippets.push(values.enabled ? values.snippet : `!${values.snippet}`);
      return { data: { data: [...state.roleSnippets] } };
    });
  });

  it('should hide child settings that use the same plugin ACL snippet as their parent', async () => {
    state.settings = [
      {
        key: 'routes',
        title: 'Routes',
        aclSnippet: 'pm.routes',
        showTabs: true,
        children: [
          {
            key: 'routes.index',
            title: 'Desktop routes',
            aclSnippet: 'pm.routes',
          },
          {
            key: 'routes.mobile',
            title: 'Mobile routes',
            aclSnippet: 'pm.routes',
          },
        ],
      },
    ];

    render(<PluginPermissionsTable active role={{ name: 'admin', title: 'Admin', snippets: ['pm.*'] }} />);

    expect(await screen.findByText('Routes')).toBeInTheDocument();
    expect(screen.queryByText('Desktop routes')).not.toBeInTheDocument();
    expect(screen.queryByText('Mobile routes')).not.toBeInTheDocument();
  });

  it('should keep child settings that use a different plugin ACL snippet from their parent', async () => {
    state.settings = [
      {
        key: 'data',
        title: 'Data',
        aclSnippet: 'pm.data',
        showTabs: true,
        children: [
          {
            key: 'data-sources',
            title: 'Data sources',
            aclSnippet: 'pm.data-sources',
          },
        ],
      },
    ];

    render(<PluginPermissionsTable active role={{ name: 'admin', title: 'Admin', snippets: ['pm.*'] }} />);

    expect(await screen.findByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Data sources')).toBeInTheDocument();
  });

  it('should persist deduplicated denied snippets for parent settings', async () => {
    state.settings = [
      {
        key: 'routes',
        title: 'Routes',
        aclSnippet: 'pm.routes',
        showTabs: true,
        children: [
          {
            key: 'routes.index',
            title: 'Desktop routes',
            aclSnippet: 'pm.routes',
          },
          {
            key: 'routes.mobile',
            title: 'Mobile routes',
            aclSnippet: 'pm.routes',
          },
        ],
      },
    ];

    render(<PluginPermissionsTable active role={{ name: 'admin', title: 'Admin', snippets: ['pm.*'] }} />);

    const routesRow = await screen.findByTestId('row-routes');
    fireEvent.click(within(routesRow).getByRole('checkbox'));

    await waitFor(() => {
      expect(state.add).toHaveBeenCalledWith({
        values: ['!pm.routes'],
      });
    });
  });
  it('keeps newly granted plugin access when subsequently saving a system permission', async () => {
    state.settings = [{ key: 'logger', title: 'Logger', aclSnippet: 'pm.logger' }];
    state.roleSnippets = ['ui.*', 'pm', 'pm.*', '!app', '!pm.logger', '!pm.v1-only'];
    const onRoleChange = vi.fn();
    render(
      <SystemPermissionsTab
        activeKey="general"
        activeRole={{ name: 'admin', title: 'Admin', snippets: [...state.roleSnippets] }}
        currentUserRole={null}
        onRoleChange={onRoleChange}
      />,
    );
    const logger = within(await screen.findByTestId('row-logger')).getByRole('checkbox');
    await waitFor(() => expect(logger).not.toBeChecked());
    fireEvent.click(logger);
    await waitFor(() => expect(logger).toBeChecked());
    expect(state.roleSnippets).not.toContain('!pm.logger');
    // A separate editor may change a V1 permission without updating this component's role snapshot.
    state.roleSnippets.push('!pm.another-v1-only');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Allows to configure interface' }));
    await waitFor(() =>
      expect(state.setSystemSnippet).toHaveBeenCalledWith({
        filterByTk: 'admin',
        values: { snippet: 'ui.*', enabled: false },
      }),
    );
    await waitFor(() =>
      expect(onRoleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ snippets: expect.arrayContaining(['!ui.*', '!pm.v1-only', '!pm.another-v1-only']) }),
      ),
    );
    expect(logger).toBeChecked();
    expect(state.roleSnippets).not.toContain('!pm.logger');
    expect(state.roleSnippets).not.toContain('ui.*');
  });

  it('synchronizes the complete saved snippet list including settings only registered in v1', async () => {
    state.settings = [{ key: 'logger', title: 'Logger', aclSnippet: 'pm.logger' }];
    state.roleSnippets = ['pm.*', '!pm.v1-only'];
    const onSnippetsChange = vi.fn();
    render(
      <PluginPermissionsTable
        active
        role={{ name: 'admin', title: 'Admin', snippets: ['pm.*'] }}
        onSnippetsChange={onSnippetsChange}
      />,
    );
    await waitFor(() => expect(onSnippetsChange).toHaveBeenCalledWith(['pm.*', '!pm.v1-only']));
    fireEvent.click(within(screen.getByTestId('row-logger')).getByRole('checkbox'));
    await waitFor(() => expect(onSnippetsChange).toHaveBeenLastCalledWith(['pm.*', '!pm.v1-only', '!pm.logger']));
  });
});
