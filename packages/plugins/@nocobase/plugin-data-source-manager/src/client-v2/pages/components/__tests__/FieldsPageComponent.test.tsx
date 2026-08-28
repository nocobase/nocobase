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

const modalConfirm = vi.fn((config: { onOk?: () => void | Promise<void> }) => config.onOk?.());
const messages = {
  error: vi.fn(),
  success: vi.fn(),
};
const notifications = {
  error: vi.fn(),
};

const apiRequest = vi.fn((options: { url: string }) => {
  if (options.url === 'collectionFields:list') {
    return Promise.resolve({
      data: {
        data: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
            uiSchema: { title: 'Title' },
            description: 'Order title',
          },
          {
            name: 'status',
            type: 'string',
            interface: 'select',
            uiSchema: { title: 'Status' },
          },
        ],
      },
    });
  }
  return Promise.resolve({ data: { data: {} } });
});

const mainDataSource = {
  options: {
    type: 'main',
  },
  reload: vi.fn(() => Promise.resolve()),
  collectionManager: {
    getCollection: vi.fn(() => ({
      getOption: vi.fn((name: string) => (name === 'titleField' ? 'title' : undefined)),
      setOption: vi.fn(),
    })),
  },
};

const plugin = {
  getCollectionPresetFields: vi.fn(() => []),
  getCollectionTemplate: vi.fn(() => ({
    collection: {
      fields: [{ name: 'id', deletable: false }],
    },
  })),
  getType: vi.fn(() => ({})),
};

const syncFieldsResource = {
  syncFields: vi.fn(() => Promise.resolve()),
};

const flowMocks = {
  ctx: {
    api: {
      request: apiRequest,
      resource: vi.fn((name: string) => {
        if (name === 'mainDataSource') {
          return syncFieldsResource;
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
      collectionFieldInterfaceManager: {
        getFieldInterfaceGroups: vi.fn(() => ({
          basic: { label: 'Basic', order: 1 },
          choices: { label: 'Choices', order: 20 },
        })),
        getFieldInterfaces: vi.fn(() => [
          {
            name: 'input',
            title: 'Input',
            group: 'basic',
            default: { type: 'string', uiSchema: { type: 'string' } },
            availableTypes: ['string'],
          },
          {
            name: 'select',
            title: 'Select',
            group: 'choices',
            default: { type: 'string', uiSchema: { enum: [] } },
            availableTypes: ['string'],
          },
        ]),
      },
      getDataSource: vi.fn(() => mainDataSource),
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

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const MockApp = Object.assign(({ children }: { children: React.ReactNode }) => <div>{children}</div>, {
    useApp: () => ({
      message: messages,
      modal: {
        confirm: modalConfirm,
      },
      notification: notifications,
    }),
  });

  function flattenOptions(options?: Array<Record<string, unknown>>): Array<{ label: React.ReactNode; value: string }> {
    return (options || []).flatMap((option) =>
      Array.isArray(option.options)
        ? flattenOptions(option.options as Array<Record<string, unknown>>)
        : [{ label: option.label as React.ReactNode, value: String(option.value) }],
    );
  }

  return {
    ...actual,
    App: MockApp,
    Select: ({
      disabled,
      onChange,
      options,
      value,
    }: {
      disabled?: boolean;
      onChange?: (value?: string) => void;
      options?: Array<Record<string, unknown>>;
      value?: string;
    }) => {
      const items = flattenOptions(options);
      return (
        <select
          data-testid="mock-select"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange?.(event.currentTarget.value || undefined)}
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
    if (!dataIndex) {
      return record;
    }
    if (Array.isArray(dataIndex)) {
      return dataIndex.reduce<unknown>(
        (memo, key) => (memo && typeof memo === 'object' ? (memo as Record<string, unknown>)[key] : undefined),
        record,
      );
    }
    return record[dataIndex];
  }

  return {
    ...actual,
    isTitleField: () => true,
    Table: ({
      columns,
      dataSource,
      rowKey = 'name',
      rowSelection,
    }: {
      columns: TestColumn[];
      dataSource?: Record<string, unknown>[];
      rowKey?: string;
      rowSelection?: {
        onChange?: (keys: React.Key[]) => void;
        selectedRowKeys?: React.Key[];
      };
    }) => (
      <div data-testid="fields-table">
        {(dataSource || []).map((record, rowIndex) => (
          <div data-testid={`field-row-${String(record[rowKey])}`} key={String(record[rowKey])}>
            {rowSelection ? (
              <button type="button" onClick={() => rowSelection.onChange?.([record[rowKey] as React.Key])}>
                Select {String(record[rowKey])}
              </button>
            ) : null}
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
    useCurrentAppInfo: () => ({
      database: {
        dialect: 'postgres',
      },
    }),
  };
});

vi.mock('../collectionFieldApi', () => ({
  getCollectionFieldActionUrl: (_dataSourceKey: string, _collectionName: string, action: string, fieldName?: string) =>
    fieldName ? `collectionFields:${action}:${fieldName}` : `collectionFields:${action}`,
}));

import FieldsPage from '../FieldsPage';

const collection = {
  name: 'orders',
  template: 'general',
  titleField: 'title',
  fields: [{ name: 'id', primaryKey: true }],
};

function renderFieldsPage(onCollectionChange = vi.fn()) {
  return render(
    <App>
      <FieldsPage collection={collection} dataSourceKey="main" onCollectionChange={onCollectionChange} />
    </App>,
  );
}

describe('FieldsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads fields and opens the edit field drawer', async () => {
    renderFieldsPage();

    expect(await screen.findByTestId('field-row-title')).toBeInTheDocument();
    expect(screen.getByTestId('field-row-status')).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('field-row-title')).getByText('t:Edit'));

    expect(flowMocks.ctx.viewer.drawer).toHaveBeenCalledWith(
      expect.objectContaining({
        closable: true,
        width: 800,
      }),
    );
  });

  it('saves field display names and title field changes', async () => {
    const onCollectionChange = vi.fn();
    renderFieldsPage(onCollectionChange);

    const titleRow = await screen.findByTestId('field-row-title');
    const displayNameInput = within(titleRow).getByDisplayValue('Title');

    fireEvent.change(displayNameInput, { target: { value: 'Order title' } });
    fireEvent.blur(displayNameInput);

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'collectionFields:update:title',
          method: 'post',
          data: expect.objectContaining({
            uiSchema: expect.objectContaining({
              title: 'Order title',
            }),
          }),
        }),
      ),
    );

    fireEvent.click(screen.getByLabelText('switch-title-field-status'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'collections:update',
          method: 'post',
          params: { filterByTk: 'orders' },
          data: { titleField: 'status' },
        }),
      ),
    );
    expect(onCollectionChange).toHaveBeenCalledWith('orders', { titleField: 'status' });
  });

  it('syncs fields from the main data source', async () => {
    renderFieldsPage();

    await screen.findByTestId('field-row-title');
    fireEvent.click(screen.getByText('t:Sync from database'));

    await waitFor(() =>
      expect(syncFieldsResource.syncFields).toHaveBeenCalledWith({
        values: {
          collections: ['orders'],
        },
      }),
    );
    expect(mainDataSource.reload).toHaveBeenCalled();
  });

  it('updates a field interface using the selected compatible interface defaults', async () => {
    renderFieldsPage();

    const statusRow = await screen.findByTestId('field-row-status');
    fireEvent.change(within(statusRow).getByTestId('mock-select'), { target: { value: 'input' } });

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'collectionFields:update:status',
          method: 'post',
          data: expect.objectContaining({
            name: 'status',
            interface: 'input',
            type: 'string',
            uiSchema: expect.objectContaining({
              title: 'Status',
              type: 'string',
            }),
          }),
        }),
      ),
    );
    expect(mainDataSource.reload).toHaveBeenCalled();
  });

  it('confirms and deletes a configurable field', async () => {
    renderFieldsPage();

    const statusRow = await screen.findByTestId('field-row-status');
    fireEvent.click(within(statusRow).getByText('t:Delete'));

    expect(modalConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 't:Delete record' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'collectionFields:destroy:status',
          method: 'post',
        }),
      ),
    );
    expect(mainDataSource.reload).toHaveBeenCalled();
  });
});
