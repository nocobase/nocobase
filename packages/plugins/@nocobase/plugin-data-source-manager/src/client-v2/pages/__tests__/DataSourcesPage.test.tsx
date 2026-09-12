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
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const externalReload = vi.fn(() => Promise.resolve());
const mainDataSource = {
  patchOptions: vi.fn(),
  reload: vi.fn(() => Promise.resolve()),
  setCollections: vi.fn(),
};
const externalDataSource = {
  patchOptions: vi.fn(),
  reload: externalReload,
  setCollections: vi.fn(),
};
const runtimeDataSources = new Map<string, typeof mainDataSource>();

const resource = {
  destroy: vi.fn(() => Promise.resolve()),
  list: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          data: [
            {
              key: 'main',
              displayName: 'Main source',
              type: 'main',
              status: 'loaded',
              enabled: true,
            },
            {
              key: 'external',
              displayName: '{{t("External source")}}',
              type: 'postgres',
              status: 'loading-failed',
              enabled: false,
              collections: [{ name: 'orders' }],
            },
          ],
          meta: {
            count: 2,
          },
        },
      },
    }),
  ),
};

const plugin = {
  getType: vi.fn((name: string) =>
    name === 'postgres'
      ? {
          name: 'postgres',
          label: 'PostgreSQL',
        }
      : undefined,
  ),
  types: new Map([
    [
      'postgres',
      {
        name: 'postgres',
        label: 'PostgreSQL',
      },
    ],
  ]),
};

const flowMocks = {
  ctx: {
    api: {
      auth: {
        locale: 'en-US',
      },
      resource: vi.fn(() => resource),
    },
    app: {
      pluginSettingsManager: {
        getRoutePath: vi.fn(() => '/settings/:name/collections'),
      },
      pm: {
        get: vi.fn(() => plugin),
      },
    },
    dataSourceManager: {
      addDataSource: vi.fn((options: { key: string }) => {
        runtimeDataSources.set(options.key, externalDataSource);
      }),
      getDataSource: vi.fn((key: string) => runtimeDataSources.get(key)),
      removeDataSource: vi.fn(),
    },
    router: {
      navigate: vi.fn(),
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
  return {
    ...actual,
    DEFAULT_PAGE_SIZE: 20,
    Table: ({
      columns,
      dataSource,
    }: {
      columns: Array<{
        dataIndex?: string;
        render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode;
        title?: React.ReactNode;
      }>;
      dataSource?: Array<Record<string, unknown>>;
    }) => (
      <div data-testid="data-source-table">
        {(dataSource || []).map((record, index) => (
          <div data-testid={`data-source-row-${record.key}`} key={String(record.key)}>
            {columns.map((column, columnIndex) => {
              const value = column.dataIndex ? record[column.dataIndex] : undefined;
              return (
                <span key={columnIndex}>{column.render ? column.render(value, record, index) : String(value)}</span>
              );
            })}
          </div>
        ))}
      </div>
    ),
  };
});

import DataSourcesPage from '../DataSourcesPage';

describe('DataSourcesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtimeDataSources.clear();
    runtimeDataSources.set('main', mainDataSource);
  });

  it('loads data sources, syncs them to runtime, and opens collection settings', async () => {
    render(
      <App>
        <DataSourcesPage />
      </App>,
    );

    expect(await screen.findByTestId('data-source-row-external')).toBeInTheDocument();
    expect(screen.getByText('t:External source')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('t:Failed')).toBeInTheDocument();
    expect(flowMocks.ctx.dataSourceManager.addDataSource).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'external',
      }),
    );

    fireEvent.click(screen.getAllByText('t:Configure')[1]);

    expect(flowMocks.ctx.router.navigate).toHaveBeenCalledWith('/settings/external/collections');
  });

  it('opens the edit drawer and refreshes failed data sources', async () => {
    render(
      <App>
        <DataSourcesPage />
      </App>,
    );

    expect(await screen.findByTestId('data-source-row-external')).toBeInTheDocument();

    fireEvent.click(screen.getByText('t:Edit'));
    expect(flowMocks.ctx.viewer.drawer).toHaveBeenCalledWith(
      expect.objectContaining({
        closable: true,
        width: 650,
      }),
    );

    fireEvent.click(screen.getByText('t:Refresh'));

    await waitFor(() => expect(externalReload).toHaveBeenCalled());
    expect(resource.list).toHaveBeenCalledTimes(2);
  });
});
