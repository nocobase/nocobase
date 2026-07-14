/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const availableActions = [
  {
    name: 'view',
    displayName: '{{t("View")}}',
    allowConfigureFields: true,
  },
  {
    name: 'create',
    displayName: '{{t("Create")}}',
    allowConfigureFields: true,
    onNewRecord: true,
  },
];

const availableActionsResource = {
  list: vi.fn(() =>
    Promise.resolve({
      data: {
        data: availableActions,
      },
    }),
  ),
};

const dataSourcesResource = {
  list: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          rows: [
            {
              key: 'external',
              displayName: '{{t("External source")}}',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 50,
        },
      },
    }),
  ),
};

const generalRoleResource = {
  get: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          strategy: {
            actions: ['view:own'],
          },
        },
      },
    }),
  ),
  update: vi.fn(() => Promise.resolve()),
};

const collectionPermissionsResource = {
  list: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          rows: [
            {
              name: 'orders',
              title: '{{t("Orders")}}',
              usingConfig: 'resourceAction',
              exists: true,
              fields: [{ name: 'title', uiSchema: { title: 'Title' } }],
            },
            {
              name: 'logs',
              title: 'Logs',
              usingConfig: 'strategy',
              exists: false,
              fields: [{ name: 'message', uiSchema: { title: 'Message' } }],
            },
          ],
          total: 2,
        },
      },
    }),
  ),
};

const roleResourcePermissionsResource = {
  create: vi.fn(() => Promise.resolve()),
  get: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          usingActionsConfig: true,
          actions: [
            {
              name: 'view',
              fields: ['title'],
            },
          ],
        },
      },
    }),
  ),
  update: vi.fn(() => Promise.resolve()),
};

const plugin = {
  getPermissionTabs: vi.fn(() => []),
};

const flowMocks = {
  ctx: {
    api: {
      resource: vi.fn((name: string) => {
        if (name === 'availableActions') {
          return availableActionsResource;
        }
        if (name === 'dataSources') {
          return dataSourcesResource;
        }
        if (name === 'dataSources/external/roles') {
          return generalRoleResource;
        }
        if (name === 'roles.dataSourcesCollections') {
          return collectionPermissionsResource;
        }
        if (name === 'roles.dataSourceResources') {
          return roleResourcePermissionsResource;
        }
        throw new Error(`Unexpected resource: ${name}`);
      }),
    },
    app: {
      pm: {
        get: vi.fn(() => plugin),
      },
    },
    dataSourceManager: {
      getDataSource: vi.fn(() => ({
        getCollection: vi.fn(() => ({ name: 'orders' })),
      })),
    },
    viewer: {
      drawer: vi.fn(),
    },
  },
  engine: {
    context: {
      t: vi.fn((key: string) => `t:${key}`),
    },
  },
};

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => flowMocks.ctx,
    useFlowEngine: () => flowMocks.engine,
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();

  type TestColumn = {
    dataIndex?: string | string[];
    render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode;
    title?: React.ReactNode;
  };

  function getCellValue(record: Record<string, unknown>, dataIndex?: string | string[]) {
    if (Array.isArray(dataIndex)) {
      return dataIndex.reduce<unknown>(
        (memo, key) => (memo && typeof memo === 'object' ? (memo as Record<string, unknown>)[key] : undefined),
        record,
      );
    }
    return dataIndex ? record[dataIndex] : undefined;
  }

  return {
    ...actual,
    CollectionFilter: ({ onChange }: { onChange?: (value: unknown) => void }) => (
      <button type="button" onClick={() => onChange?.({ title: { $includes: 'orders' } })}>
        Filter orders
      </button>
    ),
    DrawerFormLayout: ({
      children,
      footer,
      onSubmit,
      submitText,
      title,
    }: {
      children: React.ReactNode;
      footer?: React.ReactNode;
      onSubmit?: () => void | Promise<void>;
      submitText?: string;
      title: string;
    }) => (
      <section aria-label={title}>
        {children}
        {footer === undefined ? (
          <button type="button" onClick={() => onSubmit?.()}>
            {submitText || 'Submit'}
          </button>
        ) : (
          footer
        )}
      </section>
    ),
    ExtendCollectionsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Table: ({
      columns,
      dataSource,
      rowKey = 'name',
    }: {
      columns: TestColumn[];
      dataSource?: Record<string, unknown>[];
      rowKey?: string;
    }) => (
      <div data-testid="permission-table">
        <div data-testid="permission-table-header">
          {columns.map((column, index) => (
            <span key={index}>{column.title}</span>
          ))}
        </div>
        {(dataSource || []).map((record, rowIndex) => (
          <div data-testid={`permission-row-${String(record[rowKey])}`} key={String(record[rowKey])}>
            {columns.map((column, columnIndex) => (
              <span key={columnIndex}>
                {column.render
                  ? column.render(getCellValue(record, column.dataIndex), record, rowIndex)
                  : String(getCellValue(record, column.dataIndex) ?? '')}
              </span>
            ))}
          </div>
        ))}
      </div>
    ),
  };
});

import DataSourcePermissionsTab from '../DataSourcePermissionsTab';

function renderWithApp(children: React.ReactNode) {
  return render(<App>{children}</App>);
}

describe('DataSourcePermissionsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads data sources and updates general action permissions from the drawer', async () => {
    renderWithApp(<DataSourcePermissionsTab activeRole={{ name: 'admin', title: 'Admin' }} />);

    expect(await screen.findByTestId('permission-row-external')).toBeInTheDocument();
    expect(screen.getByText('t:External source')).toBeInTheDocument();

    fireEvent.click(screen.getByText('t:Configure'));

    const drawerContent = flowMocks.ctx.viewer.drawer.mock.calls[0][0].content();
    renderWithApp(drawerContent);

    await waitFor(() =>
      expect(generalRoleResource.get).toHaveBeenCalledWith({
        filterByTk: 'admin',
      }),
    );

    fireEvent.click(within(await screen.findByTestId('permission-row-view')).getByRole('checkbox'));

    await waitFor(() =>
      expect(generalRoleResource.update).toHaveBeenCalledWith({
        filterByTk: 'admin',
        values: {
          strategy: {
            actions: [],
          },
        },
      }),
    );
  });

  it('filters role collection permissions inside the action permissions tab', async () => {
    renderWithApp(<DataSourcePermissionsTab activeRole={{ name: 'admin', title: 'Admin' }} />);

    fireEvent.click(await screen.findByText('t:Configure'));
    renderWithApp(flowMocks.ctx.viewer.drawer.mock.calls[0][0].content());

    fireEvent.click(screen.getByText('t:Action permissions'));

    expect(await screen.findByTestId('permission-row-orders')).toBeInTheDocument();
    expect(screen.getByTestId('permission-row-logs')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Filter orders'));

    await waitFor(() => expect(screen.queryByTestId('permission-row-logs')).not.toBeInTheDocument());
    expect(screen.getByTestId('permission-row-orders')).toBeInTheDocument();
  });
});
