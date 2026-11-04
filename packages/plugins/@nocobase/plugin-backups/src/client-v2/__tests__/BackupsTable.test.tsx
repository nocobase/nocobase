/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import axios from 'axios';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackupsTable } from '../components/BackupsTable';
import { RefreshBackups } from '../components/RefreshBackups';
import { BackupsContext, useBackupsContext } from '../contexts';

const mocks = vi.hoisted(() => ({
  appInfo: { name: 'main-app' } as { name?: string; data?: { name: string } },
  flowContext: {
    api: {
      request: vi.fn(),
      axios: { getUri: (config: object) => axios.getUri({ baseURL: '/api/', ...config }) },
    },
  },
  destroy: vi.fn(),
  modal: {
    confirm: vi.fn(),
  },
  message: {
    success: vi.fn(),
  },
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

vi.mock('../components/RestoreFromBackup', () => ({
  RestoreFromBackup: ({ backup }: { backup: { name: string } }) => <button type="button">Restore {backup.name}</button>,
}));

function renderWithBackupsContext(value: React.ContextType<typeof BackupsContext>, node: React.ReactNode) {
  return render(<BackupsContext.Provider value={value}>{node}</BackupsContext.Provider>);
}

describe('backup table and context components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
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
    let resolveToken: (value: { data: { data: { token: string } } }) => void;
    mocks.flowContext.api.request.mockReturnValue(
      new Promise((resolve) => {
        resolveToken = resolve;
      }),
    );
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

    const download = screen.getByRole('button', { name: 'Download' });
    expect(download.tagName).toBe('A');
    fireEvent.keyDown(download, { key: 'Enter' });
    expect(download).toHaveAttribute('aria-busy', 'true');
    expect(download).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(download);
    expect(mocks.flowContext.api.request).toHaveBeenCalledOnce();
    await act(async () => resolveToken({ data: { data: { token: 'download-token' } } }));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backups:download',
        method: 'post',
        params: {
          filterByTk: 'backup.zip',
          __appName: 'main-app',
        },
      }),
    );
    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce());
    const link = vi.mocked(HTMLAnchorElement.prototype.click).mock.instances[0] as HTMLAnchorElement;
    expect(link.href).toContain('hash=download-token');
    expect(link.href).toContain('__appName=main-app');
    expect(link.download).toBe('backup.zip');
  });

  it('downloads backups with nested current app info', async () => {
    mocks.appInfo = { data: { name: 'nested-app' } };
    mocks.flowContext.api.request.mockResolvedValue({ data: { data: { token: 'download-token' } } });
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
