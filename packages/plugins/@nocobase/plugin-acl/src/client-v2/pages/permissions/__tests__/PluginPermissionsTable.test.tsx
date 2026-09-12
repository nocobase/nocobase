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
import type { PluginSettingsPageType } from '@nocobase/client-v2';
import PluginPermissionsTable from '../PluginPermissionsTable';

const state = vi.hoisted(() => ({
  settings: [] as PluginSettingsPageType[],
  aclSnippets: [] as string[],
  roleSnippets: [] as string[],
  add: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async () => {
  const ReactModule = await import('react');

  function renderRows(items: PluginSettingsPageType[], columns: Array<Record<string, unknown>>): React.ReactNode {
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
            | ((value: unknown, record: PluginSettingsPageType, index: number) => React.ReactNode)
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
    Table: ({ dataSource = [], columns = [] }: { dataSource?: PluginSettingsPageType[]; columns?: unknown[] }) =>
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
  beforeEach(() => {
    state.settings = [];
    state.aclSnippets = [];
    state.roleSnippets = ['pm.*'];
    state.add.mockReset();
    state.remove.mockReset();
    state.list.mockReset();
    state.success.mockReset();
    state.list.mockResolvedValue({
      data: {
        data: state.roleSnippets,
      },
    });
    state.add.mockResolvedValue({});
    state.remove.mockResolvedValue({});
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

    render(<PluginPermissionsTable active role={{ name: 'admin', snippets: ['pm.*'] }} />);

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

    render(<PluginPermissionsTable active role={{ name: 'admin', snippets: ['pm.*'] }} />);

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

    render(<PluginPermissionsTable active role={{ name: 'admin', snippets: ['pm.*'] }} />);

    const routesRow = await screen.findByTestId('row-routes');
    fireEvent.click(within(routesRow).getByRole('checkbox'));

    await waitFor(() => {
      expect(state.add).toHaveBeenCalledWith({
        values: ['!pm.routes'],
      });
    });
  });
});
