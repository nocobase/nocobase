/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen } from '@testing-library/react';
import { App } from 'antd';
import React, { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BACKUP_RESTORE_RUNTIME_KEY } from '../constants';
import { BackupAppInfo, useBackupAppInfo } from '../hooks/useBackupAppInfo';
import { useCheckBackupMessage } from '../hooks/useCheckBackupMessage';
import { useRestoreTask } from '../hooks/useRestoreTask';

const mocks = vi.hoisted(() => ({
  app: {} as Record<string, unknown>,
  engineContext: {} as Record<string, unknown>,
  flowContext: {
    api: {
      request: vi.fn(),
    },
  },
  requestData: undefined as BackupAppInfo | undefined,
  lastRequestService: undefined as undefined | (() => Promise<BackupAppInfo>),
  notification: {
    error: vi.fn(),
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => mocks.app,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => mocks.flowContext,
  useFlowEngine: () => ({
    context: mocks.engineContext,
  }),
}));

vi.mock('ahooks', () => ({
  useMemoizedFn: (fn: unknown) => fn,
  useRequest: (service: () => Promise<BackupAppInfo>) => {
    mocks.lastRequestService = service;
    return { data: mocks.requestData };
  },
}));

function CheckBackupMessageProbe() {
  const { showCheckBackupMessage, hideCheckBackupMessage } = useCheckBackupMessage();

  return (
    <>
      <button type="button" onClick={showCheckBackupMessage}>
        show
      </button>
      <button type="button" onClick={hideCheckBackupMessage}>
        hide
      </button>
    </>
  );
}

function BackupAppInfoProbe() {
  const appInfo = useBackupAppInfo();
  return <div>{appInfo.database.dialect || 'empty'}</div>;
}

function RestoreTaskProbe(props: { onReady: (ref: React.MutableRefObject<string | null>) => void }) {
  const restoreTaskId = useRestoreTask();

  useEffect(() => {
    props.onReady(restoreTaskId);
  }, [props, restoreTaskId]);

  return null;
}

describe('backup hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.app = {};
    mocks.engineContext = {};
    mocks.flowContext.api.request.mockReset();
    mocks.requestData = undefined;
    mocks.lastRequestService = undefined;
    vi.spyOn(App, 'useApp').mockReturnValue({
      notification: mocks.notification,
    } as ReturnType<typeof App.useApp>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('uses the registered backup restore runtime when available', () => {
    const runtime = {
      showCheckBackupMessage: vi.fn(),
      hideCheckBackupMessage: vi.fn(),
    };
    mocks.engineContext[BACKUP_RESTORE_RUNTIME_KEY] = runtime;

    render(<CheckBackupMessageProbe />);
    screen.getByText('show').click();
    screen.getByText('hide').click();

    expect(runtime.showCheckBackupMessage).toHaveBeenCalledTimes(1);
    expect(runtime.hideCheckBackupMessage).toHaveBeenCalledTimes(1);
  });

  it('falls back to app maintaining state when runtime is missing', () => {
    const setMaintaining = vi.fn();
    mocks.app = { setMaintaining };

    render(<CheckBackupMessageProbe />);
    screen.getByText('show').click();
    screen.getByText('hide').click();

    expect(setMaintaining).toHaveBeenCalledWith(true);
    expect(setMaintaining).toHaveBeenCalledWith(false);
    expect(mocks.app.error).toEqual({
      command: { name: 'APP Restoring' },
      message: 'checking backup...',
      code: 'APP_COMMANDING',
    });
  });

  it('mutates app maintaining state directly when there is no setter or runtime', () => {
    mocks.app = { maintaining: false };

    render(<CheckBackupMessageProbe />);
    screen.getByText('show').click();
    expect(mocks.app.maintaining).toBe(true);

    screen.getByText('hide').click();
    expect(mocks.app.maintaining).toBe(false);
  });

  it('loads backup application info and falls back to an empty dialect', async () => {
    mocks.flowContext.api.request.mockResolvedValue({
      data: {
        data: {
          database: {
            dialect: 'postgres',
            schema: 'public',
          },
        },
      },
    });

    render(<BackupAppInfoProbe />);
    expect(screen.getByText('empty')).toBeInTheDocument();

    await expect(mocks.lastRequestService?.()).resolves.toEqual({
      database: {
        dialect: 'postgres',
        schema: 'public',
      },
    });
    expect(mocks.flowContext.api.request).toHaveBeenCalledWith({ url: 'backups:appInfo' });
  });

  it('polls restore task status and reports restore errors', async () => {
    vi.useFakeTimers();
    const hideCheckBackupMessage = vi.fn();
    mocks.engineContext[BACKUP_RESTORE_RUNTIME_KEY] = {
      showCheckBackupMessage: vi.fn(),
      hideCheckBackupMessage,
    };
    mocks.flowContext.api.request.mockResolvedValue({
      data: {
        data: {
          inProgress: false,
          message: 'Restore failed',
        },
      },
    });
    let taskRef: React.MutableRefObject<string | null> | undefined;

    render(<RestoreTaskProbe onReady={(ref) => (taskRef = ref)} />);
    if (!taskRef) {
      throw new Error('restore task ref is missing');
    }
    taskRef.current = 'task-1';

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
      url: 'backups:restoreStatus',
      method: 'get',
      params: { task: 'task-1' },
    });
    expect(taskRef.current).toBeNull();
    expect(hideCheckBackupMessage).toHaveBeenCalledTimes(1);
    expect(mocks.notification.error).toHaveBeenCalledWith({ message: 'Restore failed', role: 'alert' });
  });

  it('skips restore polling while there is no active restore task', async () => {
    vi.useFakeTimers();
    let taskRef: React.MutableRefObject<string | null> | undefined;

    render(<RestoreTaskProbe onReady={(ref) => (taskRef = ref)} />);
    if (!taskRef) {
      throw new Error('restore task ref is missing');
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(taskRef.current).toBeNull();
    expect(mocks.flowContext.api.request).not.toHaveBeenCalled();
  });

  it('keeps polling when the restore task is still in progress', async () => {
    vi.useFakeTimers();
    mocks.flowContext.api.request.mockResolvedValue({
      data: {
        data: {
          inProgress: true,
        },
      },
    });
    let taskRef: React.MutableRefObject<string | null> | undefined;

    render(<RestoreTaskProbe onReady={(ref) => (taskRef = ref)} />);
    if (!taskRef) {
      throw new Error('restore task ref is missing');
    }
    taskRef.current = 'task-1';

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(taskRef.current).toBe('task-1');
    expect(mocks.notification.error).not.toHaveBeenCalled();
  });
});
