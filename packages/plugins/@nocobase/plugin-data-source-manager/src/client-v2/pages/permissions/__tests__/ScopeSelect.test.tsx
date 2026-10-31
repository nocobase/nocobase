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
import { Collection } from '@nocobase/flow-engine';
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
              scope: {
                $and: [
                  { createdById: { $eq: '{{ ctx.state.currentUser.id }}' } },
                  { roleName: { $eq: '{{ ctx.state.currentRole }}' } },
                ],
              },
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
  create: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
};

interface VariableFilterProps {
  rightAsVariable?: boolean;
  rightMetaTree?: () => Promise<Array<{ name: string }>>;
  rightVariableConverters?: {
    resolvePathFromValue?: (value: unknown) => string[] | undefined;
    resolveValueFromPath?: (node: { paths: string[] }) => unknown;
  };
}

const flowMocks = {
  variableFilterProps: null as VariableFilterProps | null,
  filterGroupValue: null as null | {
    items: Array<{ path: string; operator: string; value: unknown }>;
  },
  filterModel: {
    context: {
      defineProperty: vi.fn(),
      getPropertyMetaTree: vi.fn(() => [
        { name: 'user', paths: ['user'] },
        { name: 'role', paths: ['role'] },
        { name: 'formValues', paths: ['formValues'] },
      ]),
    },
    remove: vi.fn(),
  },
  ctx: {
    api: {
      resource: vi.fn(() => scopeResource),
    },
    engine: {
      createModel: vi.fn(),
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
    FilterGroup: ({
      FilterItem,
      value,
    }: {
      FilterItem?: React.ComponentType<{ value: Record<string, unknown> }>;
      value: { items: Array<{ path: string; operator: string; value: unknown }> };
    }) => {
      flowMocks.filterGroupValue = value;
      if (!value.items.length) {
        value.items.push({ path: '', operator: '', value: '' });
      }
      return <div data-testid="filter-group">{FilterItem ? <FilterItem value={value.items[0]} /> : null}</div>;
    },
    VariableFilterItem: (props: VariableFilterProps) => {
      flowMocks.variableFilterProps = props;
      return <div data-testid="variable-filter-item" data-right-as-variable={String(Boolean(props.rightAsVariable))} />;
    },
    DrawerFormLayout: ({
      children,
      footer,
      title,
      onSubmit,
    }: {
      children: React.ReactNode;
      footer?: React.ReactNode;
      title: string;
      onSubmit?: () => void | Promise<void>;
    }) => (
      <section aria-label={title}>
        {children}
        {footer}
        {onSubmit ? <button onClick={onSubmit}>Submit {title}</button> : null}
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
    flowMocks.variableFilterProps = null;
    flowMocks.filterGroupValue = null;
    flowMocks.ctx.engine.createModel.mockReturnValue(flowMocks.filterModel);
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

  it('provides variable selection when creating a permission data scope', async () => {
    const collection = new Collection({ name: 'orders' });
    render(
      <App>
        <ScopeSelect collection={collection} dataSourceKey="main" resourceName="orders" t={t} />
      </App>,
    );

    fireEvent.click(screen.getByRole('combobox'));
    const pickerConfig = flowMocks.ctx.viewer.drawer.mock.calls[0][0];
    render(<App>{pickerConfig.content({ close: vi.fn() })}</App>);

    fireEvent.click(await screen.findByText('t:Add new'));
    const scopeFormConfig = flowMocks.ctx.viewer.drawer.mock.calls[1][0];
    const scopeFormView = render(<App>{scopeFormConfig.content()}</App>);

    expect(screen.getByTestId('variable-filter-item')).toHaveAttribute('data-right-as-variable', 'true');
    await expect(flowMocks.variableFilterProps?.rightMetaTree?.()).resolves.toEqual([
      expect.objectContaining({ name: 'user' }),
      expect.objectContaining({ name: 'role' }),
    ]);
    expect(
      flowMocks.variableFilterProps?.rightVariableConverters?.resolveValueFromPath?.({ paths: ['user', 'id'] }),
    ).toBe('{{$user.id}}');
    expect(flowMocks.variableFilterProps?.rightVariableConverters?.resolveValueFromPath?.({ paths: ['role'] })).toBe(
      '{{$nRole}}',
    );
    expect(
      flowMocks.variableFilterProps?.rightVariableConverters?.resolvePathFromValue?.(
        '{{ ctx.state.currentUser.department.id }}',
      ),
    ).toEqual(['user', 'department', 'id']);
    expect(
      flowMocks.variableFilterProps?.rightVariableConverters?.resolvePathFromValue?.('{{ ctx.state.currentRole }}'),
    ).toEqual(['role']);

    if (!flowMocks.filterGroupValue) {
      throw new Error('Expected the permission filter group to render');
    }
    Object.assign(flowMocks.filterGroupValue.items[0], {
      path: 'createdById',
      operator: '$eq',
      value: '{{$user.id}}',
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Current user records' } });
    fireEvent.click(screen.getByText('Submit t:Add record'));

    await waitFor(() =>
      expect(scopeResource.create).toHaveBeenCalledWith({
        values: {
          name: 'Current user records',
          resourceName: 'orders',
          scope: {
            $and: [{ createdById: { $eq: '{{$user.id}}' } }],
          },
        },
      }),
    );

    scopeFormView.unmount();
    expect(flowMocks.filterModel.remove).toHaveBeenCalled();
  });

  it('preserves legacy variable expressions when editing a permission data scope', async () => {
    const collection = new Collection({ name: 'orders' });
    render(
      <App>
        <ScopeSelect collection={collection} dataSourceKey="main" resourceName="orders" t={t} />
      </App>,
    );

    fireEvent.click(screen.getByRole('combobox'));
    const pickerConfig = flowMocks.ctx.viewer.drawer.mock.calls[0][0];
    render(<App>{pickerConfig.content({ close: vi.fn() })}</App>);

    fireEvent.click((await screen.findAllByText('t:Edit'))[0]);
    const scopeFormConfig = flowMocks.ctx.viewer.drawer.mock.calls[1][0];
    render(<App>{scopeFormConfig.content()}</App>);
    fireEvent.click(await screen.findByText('Submit t:Edit record'));

    await waitFor(() =>
      expect(scopeResource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        values: {
          name: '{{t("Custom scope")}}',
          resourceName: 'orders',
          scope: {
            $and: [
              { createdById: { $eq: '{{ ctx.state.currentUser.id }}' } },
              { roleName: { $eq: '{{ ctx.state.currentRole }}' } },
            ],
          },
        },
      }),
    );
  });
});
