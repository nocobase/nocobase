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
import BackupSettings from '../pages/BackupSettings';
import BackupsManagement from '../pages/BackupsManagement';

type RequestConfig = {
  data?: unknown;
  loading?: boolean;
  callOnSuccess?: boolean;
  mutate?: ReturnType<typeof vi.fn>;
  refresh?: ReturnType<typeof vi.fn>;
  refreshAsync?: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
  flowContext: {
    api: {
      request: vi.fn(),
    },
  },
  requestQueue: [] as RequestConfig[],
  requestIndex: 0,
  requestCalls: [] as Array<{
    service: () => Promise<unknown>;
    options?: {
      onSuccess?: (data: unknown) => void;
    };
  }>,
  message: {
    success: vi.fn(),
  },
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
  useRequest: (
    service: () => Promise<unknown>,
    options?: {
      onSuccess?: (data: unknown) => void;
    },
  ) => {
    const config =
      mocks.requestQueue.length > 0 ? mocks.requestQueue[mocks.requestIndex % mocks.requestQueue.length] ?? {} : {};
    mocks.requestIndex += 1;
    mocks.requestCalls.push({ service, options });
    React.useEffect(() => {
      if (config.callOnSuccess) {
        options?.onSuccess?.(config.data);
      }
    }, [config.callOnSuccess, config.data, options]);

    return {
      data: config.data,
      loading: config.loading ?? false,
      mutate: config.mutate ?? vi.fn(),
      refresh: config.refresh ?? vi.fn(),
      refreshAsync: config.refreshAsync ?? vi.fn(),
    };
  },
}));

vi.mock('react-js-cron', () => ({
  Cron: ({ setValue, value }: { setValue: (value: string) => void; value: string }) => (
    <button type="button" onClick={() => setValue('0 1 * * *')}>
      cron:{value}
    </button>
  ),
}));

vi.mock('react-js-cron/dist/styles.css', () => ({}));

vi.mock('../components/BackupsTable', () => ({
  BackupsTable: () => <div>backups-table</div>,
}));

vi.mock('../components/NewBackup', () => ({
  NewBackup: () => <button type="button">new-backup</button>,
}));

vi.mock('../components/RefreshBackups', () => ({
  RefreshBackups: () => <button type="button">refresh-backups</button>,
}));

vi.mock('../components/RestoreFromLocal', () => ({
  RestoreFromLocal: () => <button type="button">restore-local</button>,
}));

describe('backup pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.flowContext.api.request.mockReset();
    mocks.requestQueue = [];
    mocks.requestIndex = 0;
    mocks.requestCalls = [];
    vi.spyOn(App, 'useApp').mockReturnValue({
      message: mocks.message,
    } as ReturnType<typeof App.useApp>);
  });

  it('loads the backups list and renders management actions', async () => {
    mocks.flowContext.api.request.mockResolvedValue({ data: { data: [{ name: 'backup.zip' }] } });
    mocks.requestQueue = [{ data: { data: [] } }];

    render(<BackupsManagement />);

    expect(screen.getByText('refresh-backups')).toBeInTheDocument();
    expect(screen.getByText('restore-local')).toBeInTheDocument();
    expect(screen.getByText('new-backup')).toBeInTheDocument();
    expect(screen.getByText('backups-table')).toBeInTheDocument();

    await expect(mocks.requestCalls[0].service()).resolves.toEqual({ data: [{ name: 'backup.zip' }] });
    expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
      url: 'backups:list',
      method: 'get',
    });
  });

  it('falls back to an empty backups list when the list response is empty', async () => {
    mocks.flowContext.api.request.mockResolvedValue({});
    mocks.requestQueue = [{ data: { data: [] } }];

    render(<BackupsManagement />);

    await expect(mocks.requestCalls[0].service()).resolves.toEqual({ data: [] });
  });

  it('loads backup settings and filters out local storage options', async () => {
    mocks.flowContext.api.request
      .mockResolvedValueOnce({ data: { data: { id: 1, keep: 5, scheduled: true } } })
      .mockResolvedValueOnce({
        data: {
          data: [
            { id: 1, title: 'Local', type: 'local' },
            { id: 2, title: 'S3', type: 's3' },
          ],
        },
      });
    mocks.requestQueue = [{ data: { id: 1, keep: 5, scheduled: true }, callOnSuccess: true }, { data: [] }];

    render(<BackupSettings />);

    await expect(mocks.requestCalls[0].service()).resolves.toEqual({ id: 1, keep: 5, scheduled: true });
    await expect(mocks.requestCalls[1].service()).resolves.toEqual([{ id: 2, title: 'S3', type: 's3' }]);
    expect(mocks.flowContext.api.request).toHaveBeenNthCalledWith(1, { url: 'backupSettings:get/1' });
    expect(mocks.flowContext.api.request).toHaveBeenNthCalledWith(2, { url: 'storages:list' });
  });

  it('falls back to empty settings and storage lists when responses are empty', async () => {
    mocks.flowContext.api.request.mockResolvedValue({});
    mocks.requestQueue = [{ data: undefined, callOnSuccess: true }, { data: undefined }];

    render(<BackupSettings />);

    await expect(mocks.requestCalls[0].service()).resolves.toBeUndefined();
    await expect(mocks.requestCalls[1].service()).resolves.toEqual([]);
  });

  it('submits merged backup settings values', async () => {
    const mutate = vi.fn();
    mocks.flowContext.api.request.mockResolvedValue({ data: { data: {} } });
    mocks.requestQueue = [
      { data: { id: 1, keep: 5, scheduled: true, cron: '0 0 * * *' }, callOnSuccess: true, mutate },
      { data: [] },
    ];

    render(<BackupSettings />);

    fireEvent.click(screen.getByText('cron:0 0 * * *'));
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backupSettings:update/1',
        method: 'post',
        data: expect.objectContaining({
          id: 1,
          keep: 5,
          scheduled: true,
          cron: '0 1 * * *',
        }),
      }),
    );
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        cron: '0 1 * * *',
      }),
    );
    expect(mocks.message.success).toHaveBeenCalledWith('Saved successfully');
  });
});
