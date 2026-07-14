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

const scopeResource = {
  get: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          id: 1,
          key: 'custom',
          name: '{{t("Fetched scope")}}',
        },
      },
    }),
  ),
  list: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          rows: [
            {
              id: 1,
              key: 'custom',
              name: '{{t("Custom scope")}}',
              resourceName: 'orders',
            },
            {
              id: 2,
              key: 'own',
              name: '{{t("Own records")}}',
              resourceName: null,
            },
          ],
          total: 2,
          page: 1,
          pageSize: 20,
        },
      },
    }),
  ),
};

const flowMocks = {
  ctx: {
    api: {
      resource: vi.fn(() => scopeResource),
    },
    viewer: {
      drawer: vi.fn(),
    },
  },
};

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => flowMocks.ctx,
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    CollectionFilterPanel: React.forwardRef((_props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getFilter: () => ({ status: 'active' }),
      }));
      return <div data-testid="collection-filter-panel" />;
    }),
    DrawerFormLayout: ({
      children,
      footer,
      title,
    }: {
      children: React.ReactNode;
      footer?: React.ReactNode;
      title: string;
    }) => (
      <section aria-label={title}>
        {children}
        {footer}
      </section>
    ),
    Table: ({
      columns,
      dataSource,
      rowSelection,
    }: {
      columns: Array<{
        dataIndex?: string;
        render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode;
      }>;
      dataSource?: Array<Record<string, unknown>>;
      rowSelection?: {
        onChange?: (keys: React.Key[]) => void;
        selectedRowKeys?: React.Key[];
      };
    }) => (
      <div data-testid="scope-table">
        {(dataSource || []).map((record, index) => (
          <div data-testid={`scope-row-${record.id}`} key={String(record.id)}>
            <button onClick={() => rowSelection?.onChange?.([record.id as React.Key])}>
              Select {String(record.id)}
            </button>
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

import { ScopeSelect } from '../ScopeSelect';

const t = (key: string) => `t:${key}`;

describe('ScopeSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the selected scope record when value only contains an id', async () => {
    render(
      <App>
        <ScopeSelect collection={undefined} dataSourceKey="main" resourceName="orders" value={1} t={t} />
      </App>,
    );

    await waitFor(() =>
      expect(scopeResource.get).toHaveBeenCalledWith({
        filterByTk: 1,
      }),
    );
    expect(await screen.findByText('t:Fetched scope')).toBeInTheDocument();
  });

  it('opens the scope picker and submits the selected record', async () => {
    const onChange = vi.fn();
    const close = vi.fn();
    render(
      <App>
        <ScopeSelect collection={undefined} dataSourceKey="main" resourceName="orders" onChange={onChange} t={t} />
      </App>,
    );

    fireEvent.click(screen.getByRole('combobox'));
    expect(flowMocks.ctx.viewer.drawer).toHaveBeenCalledWith(expect.objectContaining({ closable: true }));

    const drawerConfig = flowMocks.ctx.viewer.drawer.mock.calls[0][0];
    render(<App>{drawerConfig.content({ close })}</App>);

    expect(await screen.findByTestId('scope-row-1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Select 1'));
    fireEvent.click(screen.getByText('t:Submit'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        key: 'custom',
      }),
    );
    expect(close).toHaveBeenCalled();
  });
});
