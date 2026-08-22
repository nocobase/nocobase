/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackupsTable } from '../components/BackupsTable';
import { RefreshBackups } from '../components/RefreshBackups';
import { BackupsContext, useBackupsContext } from '../contexts';

const mocks = vi.hoisted(() => ({
  appInfo: { name: 'main-app' },
  flowContext: {
    api: {
      request: vi.fn(),
    },
  },
  destroy: vi.fn(),
  modal: {
    confirm: vi.fn(),
  },
  message: {
    success: vi.fn(),
  },
  saveAs: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  Table: ({
    columns,
    dataSource = [],
  }: {
    columns: Array<{
      dataIndex?: string;
      onCell?: (record: Record<string, unknown>) => Record<string, unknown>;
      render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
    }>;
    dataSource?: Array<Record<string, unknown>>;
  }) => (
    <table>
      <tbody>
        {dataSource.map((record) => (
          <tr key={String(record.name)}>
            {columns.map((column, index) => (
              <td key={column.dataIndex ?? index}>
                <span data-testid={`cell-${String(record.name)}-${column.dataIndex ?? index}`}>
                  {JSON.stringify(column.onCell?.(record) ?? {})}
                </span>
                {column.render ? column.render(column.dataIndex ? record[column.dataIndex] : undefined, record) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  useCurrentAppInfo: () => mocks.appInfo,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => mocks.flowContext,
  useFlowEngine: () => ({
    context: {
      t: (key: string) => key,
    },
  }),
}));

vi.mock('ahooks', () => ({
  useRequest: (service: (filterByTk: string) => Promise<unknown>) => ({
    runAsync: (filterByTk: string) => service(filterByTk),
  }),
}));

vi.mock('file-saver', () => ({
  saveAs: mocks.saveAs,
}));

vi.mock('../components/RestoreFromBackup', () => ({
  RestoreFromBackup: ({ backup }: { backup: { name: string } }) => <button type="button">Restore {backup.name}</button>,
}));

function renderWithBackupsContext(value: React.ContextType<typeof BackupsContext>, node: React.ReactNode) {
  return render(<BackupsContext.Provider value={value}>{node}</BackupsContext.Provider>);
}

describe('backup table and context components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.flowContext.api.request.mockReset();
    mocks.destroy.mockReset();
    vi.spyOn(App, 'useApp').mockReturnValue({
      modal: mocks.modal,
      message: mocks.message,
    } as ReturnType<typeof App.useApp>);
  });

  it('throws when backup context is missing', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Probe = () => {
      useBackupsContext();
      return null;
    };

    expect(() => render(<Probe />)).toThrow('BackupsContext provider is missing');
    consoleError.mockRestore();
  });

  it('refreshes the list from the refresh button', () => {
    const refresh = vi.fn();
    renderWithBackupsContext(
      { data: { data: [] }, loading: false, refresh, refreshAsync: vi.fn() },
      <RefreshBackups />,
    );

    fireEvent.click(screen.getByText('Refresh'));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('disables refresh while backups are loading', () => {
    const refresh = vi.fn();
    renderWithBackupsContext({ data: { data: [] }, loading: true, refresh, refreshAsync: vi.fn() }, <RefreshBackups />);

    expect(screen.getByText('Refresh').closest('button')).toBeDisabled();
  });

  it('downloads backups with the current app name', async () => {
    mocks.flowContext.api.request.mockResolvedValue({ data: 'backup-content' });
    renderWithBackupsContext(
      {
        data: {
          data: [{ name: 'backup.zip', fileSize: '10KB', createdAt: '2026-07-03T00:00:00.000Z', inProgress: false }],
        },
        loading: false,
        refresh: vi.fn(),
        refreshAsync: vi.fn(),
      },
      <BackupsTable />,
    );

    fireEvent.click(screen.getByText('Download'));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backups:download',
        method: 'get',
        params: {
          filterByTk: 'backup.zip',
          __appName: 'main-app',
        },
        responseType: 'blob',
      }),
    );
    expect(mocks.saveAs).toHaveBeenCalledWith(expect.any(Blob), 'backup.zip');
  });

  it('downloads backups with nested current app info', async () => {
    mocks.appInfo = { data: { name: 'nested-app' } };
    mocks.flowContext.api.request.mockResolvedValue({ data: 'backup-content' });
    renderWithBackupsContext(
      {
        data: {
          data: [{ name: 'backup.zip', fileSize: '10KB', createdAt: '2026-07-03T00:00:00.000Z', inProgress: false }],
        },
        loading: false,
        refresh: vi.fn(),
        refreshAsync: vi.fn(),
      },
      <BackupsTable />,
    );

    fireEvent.click(screen.getByText('Download'));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: {
            filterByTk: 'backup.zip',
            __appName: 'nested-app',
          },
        }),
      ),
    );
  });

  it('renders in-progress backups as a single progress row', () => {
    renderWithBackupsContext(
      {
        data: {
          data: [{ name: 'backup.zip', fileSize: '10KB', createdAt: '', inProgress: true }],
        },
        loading: false,
        refresh: vi.fn(),
        refreshAsync: vi.fn(),
      },
      <BackupsTable />,
    );

    expect(screen.getByText('backup.zip(Backing up...)')).toBeInTheDocument();
    expect(screen.getByTestId('cell-backup.zip-name')).toHaveTextContent('{"colSpan":4}');
    expect(screen.getByTestId('cell-backup.zip-fileSize')).toHaveTextContent('{"colSpan":0}');
  });

  it('confirms and deletes backups before refreshing the list', async () => {
    const refreshAsync = vi.fn().mockResolvedValue({ data: [] });
    mocks.flowContext.api.request.mockResolvedValue({ data: { data: [] } });
    mocks.modal.confirm.mockImplementation(({ onOk }: { onOk?: () => Promise<void> }) => onOk?.());
    renderWithBackupsContext(
      {
        data: {
          data: [{ name: 'backup.zip', fileSize: '10KB', createdAt: '2026-07-03T00:00:00.000Z', inProgress: false }],
        },
        loading: false,
        refresh: vi.fn(),
        refreshAsync,
      },
      <BackupsTable />,
    );

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backups:destroy',
        method: 'post',
        params: { filterByTk: 'backup.zip' },
      }),
    );
    expect(refreshAsync).toHaveBeenCalledTimes(1);
    expect(mocks.message.success).toHaveBeenCalledWith('The deletion was successful.');
  });
});
