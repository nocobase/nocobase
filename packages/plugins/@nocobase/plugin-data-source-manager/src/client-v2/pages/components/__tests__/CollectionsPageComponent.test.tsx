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
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const messages = {
  success: vi.fn(),
  warning: vi.fn(),
};
const modalConfirm = vi.fn();
const notifications = {
  error: vi.fn(),
};

const apiRequest = vi.fn((options: { url: string }) => {
  if (options.url === 'collectionCategories:list') {
    return Promise.resolve({
      data: {
        data: [
          {
            id: 1,
            name: 'Business',
            color: 'blue',
          },
        ],
      },
    });
  }
  if (options.url.includes('collections:list')) {
    return Promise.resolve({
      data: {
        data: [
          {
            name: 'orders',
            title: '{{t("Orders")}}',
            template: 'general',
            description: 'Order records',
            category: [{ id: 1, name: 'Business', color: 'blue' }],
            fields: [{ name: 'id', primaryKey: true }],
          },
          {
            name: 'customers',
            title: 'Customers',
            template: 'general',
            description: 'Customer records',
            category: [],
            fields: [{ name: 'id', primaryKey: true }],
          },
        ],
        meta: {
          count: 1,
        },
      },
    });
  }
  if (options.url.includes('/fields:list')) {
    return Promise.resolve({
      data: {
        data: [
          {
            name: 'id',
            primaryKey: true,
            uiSchema: { title: 'ID' },
          },
        ],
      },
    });
  }
  if (options.url.startsWith('dataSources:refresh')) {
    return Promise.resolve({
      data: {
        data: {
          status: 'loaded',
        },
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
  status: 'loaded',
};

const externalDataSource = {
  options: {
    type: 'postgres',
  },
  reload: vi.fn(() => Promise.resolve()),
  status: 'loading-failed',
};

const plugin = {
  getCollectionPresetFields: vi.fn(() => []),
  getCollectionTemplate: vi.fn(() => ({
    name: 'general',
    title: '{{t("General collection")}}',
    collection: {
      fields: [],
    },
  })),
  getCollectionTemplates: vi.fn(() => [
    {
      name: 'general',
      title: '{{t("General collection")}}',
      collection: {
        fields: [],
      },
    },
  ]),
  getType: vi.fn(() => ({})),
};

const collectionsResource = {
  destroy: vi.fn(() => Promise.resolve()),
  move: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
};

const flowMocks = {
  ctx: {
    api: {
      request: apiRequest,
      resource: vi.fn((name: string) => {
        if (name === 'collectionCategories') {
          return {
            create: vi.fn(() => Promise.resolve()),
            destroy: vi.fn(() => Promise.resolve()),
            move: vi.fn(() => Promise.resolve()),
            update: vi.fn(() => Promise.resolve()),
          };
        }
        if (name === 'collections') {
          return collectionsResource;
        }
        if (name === 'mainDataSource') {
          return {
            syncFields: vi.fn(() => Promise.resolve()),
          };
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
        getFieldInterface: vi.fn(() => ({ title: 'Input' })),
      },
      getDataSource: vi.fn((key: string) => (key === 'external' ? externalDataSource : mainDataSource)),
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

  return {
    ...actual,
    App: MockApp,
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
    DEFAULT_PAGE_SIZE: 20,
    DrawerFormLayout: ({
      children,
      onSubmit,
      submitText,
      title,
    }: {
      children: React.ReactNode;
      onSubmit?: () => void | Promise<void>;
      submitText?: string;
      title: string;
    }) => (
      <section aria-label={title}>
        {children}
        <button type="button" onClick={() => onSubmit?.()}>
          {submitText || 'Submit'}
        </button>
      </section>
    ),
    FilterContent: ({ ctx }: { ctx: { model: { dispatchEvent: (eventName: string) => void } } }) => (
      <button type="button" onClick={() => ctx.model.dispatchEvent('submit')}>
        Submit filter
      </button>
    ),
    SortableCategoryTabs: ({
      allTab,
      categories,
      onChange,
    }: {
      allTab: { key: string; label: React.ReactNode };
      categories: Array<{ id: string | number; label: React.ReactNode }>;
      onChange: (key: string) => void;
    }) => (
      <div>
        <button type="button" onClick={() => onChange(allTab.key)}>
          {allTab.label}
        </button>
        {categories.map((category) => (
          <button key={String(category.id)} type="button" onClick={() => onChange(String(category.id))}>
            {category.label}
          </button>
        ))}
      </div>
    ),
    Table: ({
      columns,
      dataSource,
      onSortEnd,
      rowKey = 'name',
      rowSelection,
    }: {
      columns: TestColumn[];
      dataSource?: Record<string, unknown>[];
      onSortEnd?: (from: Record<string, unknown>, to: Record<string, unknown>) => void;
      rowKey?: string;
      rowSelection?: {
        onChange?: (keys: React.Key[]) => void;
      };
    }) => (
      <div data-testid="collections-table">
        {onSortEnd && dataSource?.length && dataSource.length > 1 ? (
          <button type="button" onClick={() => onSortEnd(dataSource[0], dataSource[1])}>
            Sort first collection
          </button>
        ) : null}
        {(dataSource || []).map((record, rowIndex) => (
          <div data-testid={`collection-row-${String(record[rowKey])}`} key={String(record[rowKey])}>
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
    normalizeCollectionTemplateFields: (fields: unknown[]) => fields,
  };
});

vi.mock('../FieldsPage', () => ({
  default: ({ collection, dataSourceKey }: { collection: { name: string }; dataSourceKey: string }) => (
    <div data-testid="fields-page">
      {dataSourceKey}:{collection.name}
    </div>
  ),
}));

vi.mock('../RecordUniqueKey', () => ({
  getCollectionRecordUniqueKey: () => ['id'],
  RecordUniqueKeyWarningIcon: () => null,
}));

import CollectionsPage from '../CollectionsPage';

function renderCollectionsPage(dataSourceKey = 'main') {
  return render(
    <App>
      <CollectionsPage dataSourceKey={dataSourceKey} title="Collections" />
    </App>,
  );
}

describe('CollectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads main collections, filters by category, and opens field configuration', async () => {
    renderCollectionsPage();

    const row = await screen.findByTestId('collection-row-orders');
    expect(row).toHaveTextContent('t:Orders');
    expect(row).toHaveTextContent('t:General collection');
    expect(row).toHaveTextContent('Business');

    fireEvent.click(screen.getByRole('button', { name: 'Business' }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'collections:list',
          params: expect.objectContaining({
            filter: expect.stringContaining('"category.id":1'),
          }),
        }),
      ),
    );

    fireEvent.click(within(screen.getByTestId('collection-row-orders')).getByText('t:Configure fields'));

    expect(flowMocks.ctx.viewer.drawer).toHaveBeenCalledWith(
      expect.objectContaining({
        closable: true,
        width: '80%',
      }),
    );
  });

  it('refreshes an external data source before reloading collections', async () => {
    renderCollectionsPage('external');

    expect(await screen.findByTestId('collection-row-orders')).toBeInTheDocument();
    fireEvent.click(screen.getByText('t:Refresh'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'dataSources:refresh?filterByTk=external&clientStatus=loading-failed',
          method: 'post',
        }),
      ),
    );
    expect(externalDataSource.reload).toHaveBeenCalled();
  });

  it('submits main collection edits through the collections resource', async () => {
    renderCollectionsPage();

    const row = await screen.findByTestId('collection-row-orders');
    fireEvent.click(within(row).getByText('t:Edit'));

    const drawerContent = flowMocks.ctx.viewer.drawer.mock.calls[0][0].content();
    render(<App>{drawerContent}</App>);
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(collectionsResource.update).toHaveBeenCalledWith({
        filterByTk: 'orders',
        values: expect.objectContaining({
          title: '{{t("Orders")}}',
          category: ['1'],
        }),
      }),
    );
    expect(mainDataSource.reload).toHaveBeenCalled();
  });

  it('submits external collection edits through the data source collection endpoint', async () => {
    renderCollectionsPage('external');

    const row = await screen.findByTestId('collection-row-orders');
    fireEvent.click(within(row).getByText('t:Edit'));

    const drawerContent = flowMocks.ctx.viewer.drawer.mock.calls[0][0].content();
    render(<App>{drawerContent}</App>);
    fireEvent.click(screen.getByText('t:Submit'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'dataSources/external/collections:update',
          method: 'post',
          params: {
            filterByTk: 'orders',
          },
          data: expect.objectContaining({
            title: '{{t("Orders")}}',
            description: 'Order records',
          }),
        }),
      ),
    );
    expect(externalDataSource.reload).toHaveBeenCalled();
  });

  it('persists main collection sorting and reloads the runtime data source', async () => {
    renderCollectionsPage();

    await screen.findByTestId('collection-row-orders');
    fireEvent.click(screen.getByText('Sort first collection'));

    await waitFor(() =>
      expect(collectionsResource.move).toHaveBeenCalledWith({
        sourceId: 'orders',
        targetId: 'customers',
      }),
    );
    expect(mainDataSource.reload).toHaveBeenCalled();
  });

  it('confirms collection deletion and forwards the cascade option', async () => {
    renderCollectionsPage();

    const row = await screen.findByTestId('collection-row-orders');
    fireEvent.click(within(row).getByText('t:Delete'));

    expect(modalConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 't:Delete collection' }));
    const confirmConfig = modalConfirm.mock.calls[0][0];
    render(<App>{confirmConfig.content}</App>);
    fireEvent.click(
      screen.getByText(
        't:Automatically drop objects that depend on the collection (such as views), and in turn all objects that depend on those objects',
      ),
    );
    await act(async () => {
      await confirmConfig.onOk();
    });

    expect(collectionsResource.destroy).toHaveBeenCalledWith({
      filterByTk: ['orders'],
      cascade: true,
    });
    expect(mainDataSource.reload).toHaveBeenCalled();
  });
});
