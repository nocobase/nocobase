/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Form } from 'antd';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbViewsResource = {
  get: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          fields: {
            title: {
              name: 'title',
              source: ['orders', 'title'],
              type: 'string',
              interface: 'input',
              uiSchema: {
                title: 'Order title',
                rawTitle: 'raw',
              },
            },
            amount: {
              name: 'amount',
              possibleTypes: ['float', 'integer'],
              type: 'float',
              uiSchema: {
                title: 'Amount',
              },
            },
          },
          sources: ['orders'],
          unsupportedFields: [{ name: 'geom' }],
        },
      },
    }),
  ),
  list: vi.fn(() =>
    Promise.resolve({
      data: {
        data: [
          {
            schema: 'public',
            name: 'orders_view',
          },
        ],
      },
    }),
  ),
  query: vi.fn(() =>
    Promise.resolve({
      data: {
        data: [
          {
            title: 'Order A',
            amount: 12,
          },
        ],
      },
    }),
  ),
};

const apiRequest = vi.fn(() =>
  Promise.resolve({
    data: {
      data: [
        {
          name: 'orders',
          title: '{{t("Orders")}}',
          fields: [
            {
              name: 'id',
              type: 'bigInt',
              primaryKey: true,
              uiSchema: { title: 'ID' },
            },
            {
              name: 'title',
              type: 'string',
              interface: 'input',
              uiSchema: { title: 'Title' },
            },
            {
              name: 'items',
              type: 'hasMany',
              uiSchema: { title: 'Items' },
            },
          ],
        },
      ],
    },
  }),
);

const flowMocks = {
  ctx: {
    api: {
      request: apiRequest,
      resource: vi.fn((name: string) => {
        if (name === 'dbViews') {
          return dbViewsResource;
        }
        throw new Error(`Unexpected resource: ${name}`);
      }),
    },
    dataSourceManager: {
      collectionFieldInterfaceManager: {
        getFieldInterface: vi.fn((name?: string) =>
          name === 'input'
            ? {
                name: 'input',
                title: '{{t("Input")}}',
                default: {
                  type: 'string',
                  uiSchema: {
                    type: 'string',
                  },
                },
              }
            : undefined,
        ),
        getFieldInterfaceGroups: vi.fn(() => ({
          basic: { label: 'Basic', order: 1 },
        })),
        getFieldInterfaces: vi.fn(() => [
          {
            name: 'input',
            title: '{{t("Input")}}',
            group: 'basic',
            availableTypes: ['string'],
            default: {
              type: 'string',
              uiSchema: {
                type: 'string',
              },
            },
          },
          {
            name: 'number',
            title: 'Number',
            group: 'basic',
            availableTypes: ['float', 'integer'],
            default: {
              type: 'float',
              uiSchema: {
                type: 'number',
              },
            },
          },
        ]),
      },
      getDataSource: vi.fn(() => ({
        getCollection: vi.fn(() => ({
          title: '{{t("Orders")}}',
          getFields: vi.fn(() => [
            {
              name: 'title',
              type: 'string',
              interface: 'input',
              uiSchema: { title: 'Title' },
            },
            {
              name: 'items',
              type: 'hasMany',
              uiSchema: { title: 'Items' },
            },
          ]),
        })),
      })),
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

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();

  type TestColumn = {
    dataIndex?: string | string[];
    render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode;
    title?: React.ReactNode;
  };

  function flattenOptions(options?: Array<Record<string, unknown>>): Array<{ label: React.ReactNode; value: string }> {
    return (options || []).flatMap((option) =>
      Array.isArray(option.options)
        ? flattenOptions(option.options as Array<Record<string, unknown>>)
        : [{ label: option.label as React.ReactNode, value: String(option.value) }],
    );
  }

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
    Cascader: ({ onChange }: { onChange?: (value: string[]) => void }) => (
      <button type="button" onClick={() => onChange?.(['orders', 'title'])}>
        Pick source
      </button>
    ),
    Select: ({
      disabled,
      mode,
      onChange,
      options,
      value,
    }: {
      disabled?: boolean;
      mode?: string;
      onChange?: (value: string | string[]) => void;
      options?: Array<Record<string, unknown>>;
      value?: string | string[];
    }) => {
      const items = flattenOptions(options);
      return (
        <select
          data-testid="mock-select"
          disabled={disabled}
          multiple={mode === 'multiple'}
          value={value}
          onChange={(event) =>
            onChange?.(mode === 'multiple' ? [event.currentTarget.value] : event.currentTarget.value)
          }
        >
          <option value="" />
          {items.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    },
    Table: ({
      columns,
      dataSource,
      rowKey = 'name',
    }: {
      columns: TestColumn[];
      dataSource?: Record<string, unknown>[];
      rowKey?: string | ((record: Record<string, unknown>, index?: number) => string);
    }) => (
      <div data-testid="view-table">
        {(dataSource || []).map((record, rowIndex) => {
          const key = typeof rowKey === 'function' ? rowKey(record, rowIndex) : String(record[rowKey]);
          return (
            <div data-testid={`view-row-${key}`} key={key}>
              {columns.map((column, columnIndex) => (
                <span key={columnIndex}>
                  {column.render
                    ? column.render(getCellValue(record, column.dataIndex), record, rowIndex)
                    : String(getCellValue(record, column.dataIndex) ?? '')}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    ),
  };
});

import {
  ViewDatabaseConfigureItem,
  ViewFieldsConfigureItem,
  ViewPreviewConfigureItem,
  ViewSourcesConfigureItem,
} from '../ViewCollectionConfigure';

function ViewConfigureHarness() {
  const [form] = Form.useForm();
  const [snapshot, setSnapshot] = useState('');

  return (
    <Form
      form={form}
      initialValues={{
        name: 't_fixed',
      }}
    >
      <ViewDatabaseConfigureItem form={form} mode="create" template={{ name: 'view' }} />
      <ViewSourcesConfigureItem form={form} mode="create" template={{ name: 'view' }} />
      <ViewFieldsConfigureItem form={form} mode="create" template={{ name: 'view' }} />
      <ViewPreviewConfigureItem form={form} mode="create" template={{ name: 'view' }} />
      <button type="button" onClick={() => setSnapshot(JSON.stringify(form.getFieldsValue(true)))}>
        Snapshot
      </button>
      <output>{snapshot}</output>
    </Form>
  );
}

describe('ViewCollectionConfigure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads database view fields, edits field mapping, and previews rows', async () => {
    render(<ViewConfigureHarness />);

    await waitFor(() => expect(dbViewsResource.list).toHaveBeenCalled());
    fireEvent.change(screen.getAllByTestId('mock-select')[0], {
      target: { value: 'public@orders_view' },
    });

    await waitFor(() =>
      expect(dbViewsResource.get).toHaveBeenCalledWith({
        filterByTk: 'orders_view',
        schema: 'public',
      }),
    );
    await waitFor(() =>
      expect(dbViewsResource.query).toHaveBeenCalledWith({
        filterByTk: 'orders_view',
        schema: 'public',
        fieldTypes: {},
      }),
    );

    const titleRow = await screen.findByTestId('view-row-title');
    expect(titleRow).toHaveTextContent('title');
    expect(screen.getByText('t:Unsupported fields')).toBeInTheDocument();

    fireEvent.click(within(titleRow).getByText('Pick source'));
    fireEvent.change(within(titleRow).getByDisplayValue('Title'), {
      target: { value: 'Mapped title' },
    });
    fireEvent.click(screen.getByText('Snapshot'));

    expect(screen.getByText(/"databaseView":"public@orders_view"/)).toBeInTheDocument();
    expect(screen.getByText(/"source":"orders.title"/)).toBeInTheDocument();
    expect(screen.getByText(/"title":"Mapped title"/)).toBeInTheDocument();
  });
});
