/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FileStoragePage from '../pages/FileStoragePage';

const pageMocks = vi.hoisted(() => {
  const records = [
    {
      id: 1,
      title: 'Local files',
      name: 'local_files',
      type: 'local',
      default: true,
      rules: { size: 1024 },
      renameMode: 'appendRandomID',
    },
    { id: 2, title: 'Unknown files', name: 'unknown_files', type: 'missing', default: false },
  ];
  const storageTypes = new Map([
    [
      'local',
      {
        name: 'local',
        title: 'Local storage',
        formLoader: async () => ({ default: () => <div>local form</div> }),
        defaultValues: {
          baseUrl: '/storage/uploads',
          name: 'local_files',
          renameMode: 'appendRandomID',
          rules: { size: 1024 },
          title: 'Local files',
        },
      },
    ],
  ]);

  return {
    confirm: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
    drawer: vi.fn(),
    lastRequestService: undefined as undefined | (() => Promise<unknown>),
    list: vi.fn().mockResolvedValue({
      data: {
        data: {
          data: records,
          meta: { count: records.length },
        },
      },
    }),
    messageError: vi.fn(),
    records,
    refresh: vi.fn(),
    storageTypes,
    update: vi.fn(),
  };
});

vi.mock('@nocobase/client-v2', () => ({
  DEFAULT_PAGE_SIZE: 20,
  DrawerFormLayout: ({
    children,
    onSubmit,
    title,
  }: React.PropsWithChildren<{ onSubmit: () => void; title: string }>) => (
    <section>
      <h1>{title}</h1>
      <button type="button" onClick={onSubmit}>
        submit form
      </button>
      {children}
    </section>
  ),
  Table: ({
    columns,
    dataSource,
    pagination,
    rowSelection,
  }: {
    columns: Array<{
      dataIndex?: string;
      render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
      title?: string;
    }>;
    dataSource: Array<Record<string, unknown>>;
    pagination: { onChange: (page: number, pageSize: number) => void };
    rowSelection: { onChange: (keys: React.Key[]) => void };
  }) => (
    <div>
      <button type="button" onClick={() => rowSelection.onChange([1])}>
        select rows
      </button>
      <button type="button" onClick={() => pagination.onChange(2, 20)}>
        next page
      </button>
      <button type="button" onClick={() => pagination.onChange(3, 50)}>
        change page size
      </button>
      {dataSource.map((record) => (
        <div key={String(record.id)} data-testid={`row-${record.id}`}>
          {columns.map((column) => (
            <span key={column.title || column.dataIndex}>
              {column.render
                ? column.render(record[column.dataIndex || ''], record)
                : String(record[column.dataIndex || ''])}
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
  Plugin: class Plugin {},
}));

vi.mock('@nocobase/flow-engine', () => ({
  randomId: () => 's_generated',
  useFlowContext: () => ({
    api: {
      resource: () => ({
        create: pageMocks.create,
        destroy: pageMocks.destroy,
        list: pageMocks.list,
        update: pageMocks.update,
      }),
    },
    app: {
      pm: {
        get: () => ({
          getStorageType: (name: string) => pageMocks.storageTypes.get(name),
          storageTypes: pageMocks.storageTypes,
        }),
      },
    },
    viewer: {
      drawer: pageMocks.drawer,
    },
  }),
}));

vi.mock('ahooks', () => ({
  useMemoizedFn: (fn: unknown) => fn,
  useRequest: (service: () => Promise<unknown>) => {
    pageMocks.lastRequestService = service;
    return {
      data: {
        records: pageMocks.records,
        total: pageMocks.records.length,
      },
      loading: false,
      refresh: pageMocks.refresh,
    };
  },
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        message: {
          error: pageMocks.messageError,
        },
        modal: {
          confirm: pageMocks.confirm,
        },
      }),
    },
    Dropdown: ({ children, menu }: React.PropsWithChildren<{ menu: { onClick: (info: { key: string }) => void } }>) => (
      <div>
        {children}
        <button type="button" onClick={() => menu.onClick({ key: 'local' })}>
          add local storage
        </button>
      </div>
    ),
    theme: {
      ...actual.theme,
      useToken: () => ({
        token: {
          colorSuccess: 'green',
          marginSM: 8,
        },
      }),
    },
  };
});

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

describe('FileStoragePage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders storage records and opens the create drawer from registered storage types', () => {
    render(<FileStoragePage />);

    expect(screen.getByText('Local files')).toBeInTheDocument();
    expect(screen.getByText('local_files')).toBeInTheDocument();

    fireEvent.click(screen.getByText('add local storage'));

    expect(pageMocks.drawer).toHaveBeenCalledWith(
      expect.objectContaining({
        width: '50%',
        closable: true,
        content: expect.any(Function),
      }),
    );
  });

  it('submits the create drawer with storage type default values', async () => {
    render(<FileStoragePage />);

    fireEvent.click(screen.getByText('add local storage'));
    const drawerContent = pageMocks.drawer.mock.calls[0][0].content;
    render(drawerContent());

    expect(await screen.findByText('Add new - Local storage')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText('submit form'));
    });

    await waitFor(() => {
      expect(pageMocks.create).toHaveBeenCalledWith({
        values: {
          type: 'local',
        },
      });
    });
    expect(pageMocks.refresh).toHaveBeenCalled();
  });

  it('opens edit drawer for registered rows and reports unknown storage types', () => {
    render(<FileStoragePage />);

    fireEvent.click(within(screen.getByTestId('row-1')).getByText('Edit'));
    expect(pageMocks.drawer).toHaveBeenCalled();

    fireEvent.click(within(screen.getByTestId('row-2')).getByText('Edit'));
    expect(pageMocks.messageError).toHaveBeenCalledWith(
      'Storage type missing is not registered, please check if related plugin is enabled.',
    );
  });

  it('submits the edit drawer with the selected storage record', async () => {
    render(<FileStoragePage />);

    fireEvent.click(within(screen.getByTestId('row-1')).getByText('Edit'));
    const drawerContent = pageMocks.drawer.mock.calls[0][0].content;
    render(drawerContent());

    expect(await screen.findByText('Edit - Local storage')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText('submit form'));
    });

    await waitFor(() => {
      expect(pageMocks.update).toHaveBeenCalledWith({
        filterByTk: 1,
        values: {
          type: 'local',
        },
      });
    });
    expect(pageMocks.refresh).toHaveBeenCalled();
  });

  it('confirms row deletion and clears selection after deletion', async () => {
    render(<FileStoragePage />);

    fireEvent.click(within(screen.getByTestId('row-1')).getByText('Delete'));

    expect(pageMocks.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete',
        content: 'Are you sure you want to delete it?',
        onOk: expect.any(Function),
      }),
    );

    const confirmOptions = pageMocks.confirm.mock.calls[0][0];
    await act(async () => {
      await confirmOptions.onOk();
    });

    expect(pageMocks.destroy).toHaveBeenCalledWith({ filterByTk: 1 });
    expect(pageMocks.refresh).toHaveBeenCalled();
  });

  it('confirms deletion for selected rows from the toolbar action', async () => {
    render(<FileStoragePage />);

    fireEvent.click(screen.getByText('select rows'));
    fireEvent.click(screen.getAllByRole('button', { name: /Delete/ })[0]);

    const confirmOptions = pageMocks.confirm.mock.calls[0][0];
    await act(async () => {
      await confirmOptions.onOk();
    });

    expect(pageMocks.destroy).toHaveBeenCalledWith({ filterByTk: [1] });
    expect(pageMocks.refresh).toHaveBeenCalled();
  });

  it('updates pagination state for page and page-size changes', () => {
    render(<FileStoragePage />);

    fireEvent.click(screen.getByText('next page'));
    fireEvent.click(screen.getByText('change page size'));

    expect(screen.getByText('Local files')).toBeInTheDocument();
  });

  it('normalizes storage list responses from the resource request', async () => {
    render(<FileStoragePage />);

    await expect(pageMocks.lastRequestService?.()).resolves.toEqual({
      records: pageMocks.records,
      total: pageMocks.records.length,
    });
    expect(pageMocks.list).toHaveBeenCalledWith({
      appends: [],
      page: 1,
      pageSize: 20,
      sort: ['id'],
    });
  });
});
