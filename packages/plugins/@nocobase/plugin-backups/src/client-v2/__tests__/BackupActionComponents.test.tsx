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
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewBackup } from '../components/NewBackup';
import { BackupsContext } from '../contexts';

const mocks = vi.hoisted(() => ({
  flowContext: {
    api: {
      request: vi.fn(),
    },
  },
  modal: {
    confirm: vi.fn(),
  },
  message: {
    success: vi.fn(),
  },
  notification: {
    error: vi.fn(),
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => mocks.flowContext,
  useFlowEngine: () => ({
    context: {
      t: (key: string, options?: Record<string, unknown>) =>
        options?.names ? `${key}:${options.names as string}` : key,
    },
  }),
}));

vi.mock('ahooks', () => ({
  useRequest: (service: (...args: unknown[]) => Promise<unknown>, options?: { throttleWait?: number }) => ({
    loading: false,
    runAsync: (...args: unknown[]) => service(...args),
    options,
  }),
}));

describe('backup action components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.flowContext.api.request.mockReset();
    mocks.modal.confirm.mockReset();
    vi.spyOn(App, 'useApp').mockReturnValue({
      modal: mocks.modal,
      message: mocks.message,
      notification: mocks.notification,
    } as ReturnType<typeof App.useApp>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('creates a backup after confirmation and refreshes the list', async () => {
    const refreshAsync = vi.fn().mockResolvedValue({ data: [] });
    mocks.flowContext.api.request.mockResolvedValue({ data: { data: { name: 'backup-1.zip' } } });

    render(
      <BackupsContext.Provider value={{ data: { data: [] }, loading: false, refresh: vi.fn(), refreshAsync }}>
        <NewBackup />
      </BackupsContext.Provider>,
    );

    fireEvent.click(screen.getByText('New backup'));
    expect(mocks.modal.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New backup',
        onOk: expect.any(Function),
      }),
    );

    const confirmOptions = mocks.modal.confirm.mock.calls[0][0] as { onOk: () => Promise<void> };
    await act(async () => {
      await confirmOptions.onOk();
    });

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backups:create',
        method: 'post',
      }),
    );
    expect(mocks.message.success).toHaveBeenCalledWith('New backup operation started');
    expect(refreshAsync).toHaveBeenCalledTimes(1);
  });

  it('polls created backups and reports completed backup names', async () => {
    vi.useFakeTimers();
    const refreshAsync = vi.fn().mockResolvedValue({ data: [] });
    mocks.flowContext.api.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'backups:create') {
        return Promise.resolve({ data: { data: { name: 'backup-1.zip' } } });
      }
      if (url === 'backups:taskStatus') {
        return Promise.resolve({
          data: {
            data: {
              'backup-1.zip': {
                inProgress: false,
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    const { unmount } = render(
      <BackupsContext.Provider value={{ data: { data: [] }, loading: false, refresh: vi.fn(), refreshAsync }}>
        <NewBackup />
      </BackupsContext.Provider>,
    );

    fireEvent.click(screen.getByText('New backup'));
    const confirmOptions = mocks.modal.confirm.mock.calls[0][0] as { onOk: () => Promise<void> };
    await act(async () => {
      await confirmOptions.onOk();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
      url: 'backups:taskStatus',
      method: 'get',
      params: { names: ['backup-1.zip'] },
    });
    expect(mocks.message.success).toHaveBeenCalledWith('NEW_BACKUPS_CREATED:backup-1.zip');
    expect(refreshAsync).toHaveBeenCalledTimes(2);

    unmount();
    vi.useRealTimers();
  });

  it('reports failed backup creation status during polling', async () => {
    vi.useFakeTimers();
    const refreshAsync = vi.fn().mockResolvedValue({ data: [] });
    mocks.flowContext.api.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'backups:create') {
        return Promise.resolve({ data: { data: { name: 'backup-1.zip' } } });
      }
      if (url === 'backups:taskStatus') {
        return Promise.resolve({
          data: {
            data: {
              'backup-1.zip': {
                inProgress: false,
                message: 'Backup failed',
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    const { unmount } = render(
      <BackupsContext.Provider value={{ data: { data: [] }, loading: false, refresh: vi.fn(), refreshAsync }}>
        <NewBackup />
      </BackupsContext.Provider>,
    );

    fireEvent.click(screen.getByText('New backup'));
    const confirmOptions = mocks.modal.confirm.mock.calls[0][0] as { onOk: () => Promise<void> };
    await act(async () => {
      await confirmOptions.onOk();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.notification.error).toHaveBeenCalledWith({ message: 'Backup failed', role: 'alert' });
    expect(refreshAsync).toHaveBeenCalledTimes(1);

    unmount();
    vi.useRealTimers();
  });
});
