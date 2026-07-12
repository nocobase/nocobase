/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RestoreFromBackup } from '../components/RestoreFromBackup';
import { RestoreFromLocal } from '../components/RestoreFromLocal';

const mocks = vi.hoisted(() => ({
  flowContext: {
    api: {
      request: vi.fn(),
    },
  },
  restoreTaskId: {
    current: null as string | null,
  },
  showCheckBackupMessage: vi.fn(),
  notification: {
    error: vi.fn(),
  },
  appInfo: {
    database: {
      dialect: 'postgres',
      schema: 'public',
    },
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

vi.mock('../hooks/useBackupAppInfo', () => ({
  useBackupAppInfo: () => mocks.appInfo,
}));

vi.mock('../hooks/useCheckBackupMessage', () => ({
  useCheckBackupMessage: () => ({
    showCheckBackupMessage: mocks.showCheckBackupMessage,
  }),
}));

vi.mock('../hooks/useRestoreTask', () => ({
  useRestoreTask: () => mocks.restoreTaskId,
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        notification: mocks.notification,
      }),
    },
    Upload: {
      ...actual.Upload,
      Dragger: ({
        beforeUpload,
        children,
        onRemove,
      }: {
        beforeUpload?: (file: File) => boolean;
        children?: React.ReactNode;
        onRemove?: () => void;
      }) => (
        <div>
          <button type="button" onClick={() => beforeUpload?.(new File(['backup'], 'backup.zip'))}>
            select-file
          </button>
          <button type="button" onClick={onRemove}>
            remove-file
          </button>
          {children}
        </div>
      ),
    },
  };
});

describe('backup restore components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.restoreTaskId.current = null;
    mocks.appInfo = {
      database: {
        dialect: 'postgres',
        schema: 'public',
      },
    };
    mocks.flowContext.api.request.mockResolvedValue({ data: { data: { task: 'restore-task-1' } } });
  });

  it('starts restoring from an existing backup and shows the checking message', async () => {
    render(
      <RestoreFromBackup
        backup={{
          name: 'backup.zip',
          fileSize: '10KB',
          createdAt: '2026-07-03T00:00:00.000Z',
          inProgress: false,
        }}
      />,
    );

    fireEvent.click(screen.getByText('Restore'));
    expect(screen.getByText('Confirm the application database schema')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backups:restore',
        method: 'post',
        data: {
          name: 'backup.zip',
          password: '',
          dbSchema: '',
        },
      }),
    );
    expect(mocks.restoreTaskId.current).toBe('restore-task-1');
    expect(mocks.showCheckBackupMessage).toHaveBeenCalledTimes(1);
  });

  it('closes and resets the existing-backup restore dialog without submitting', () => {
    render(
      <RestoreFromBackup
        backup={{
          name: 'backup.zip',
          fileSize: '10KB',
          createdAt: '2026-07-03T00:00:00.000Z',
          inProgress: false,
        }}
      />,
    );

    fireEvent.click(screen.getByText('Restore'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(mocks.flowContext.api.request).not.toHaveBeenCalled();
  });

  it('hides database schema confirmation for non-postgres restore targets', () => {
    mocks.appInfo = {
      database: {
        dialect: 'mysql',
      },
    };

    render(
      <RestoreFromBackup
        backup={{
          name: 'backup.zip',
          fileSize: '10KB',
          createdAt: '2026-07-03T00:00:00.000Z',
          inProgress: false,
        }}
      />,
    );

    fireEvent.click(screen.getByText('Restore'));

    expect(screen.queryByText('Confirm the application database schema')).not.toBeInTheDocument();
  });

  it('requires a local backup file before uploading and restoring it', async () => {
    render(<RestoreFromLocal />);

    fireEvent.click(screen.getByText('Restore backup from local'));
    fireEvent.click(screen.getByText('Submit'));
    expect(mocks.notification.error).toHaveBeenCalledWith({ message: 'Please select a backup file' });

    fireEvent.click(screen.getByText('select-file'));
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backups:upload',
        method: 'post',
        data: expect.any(FormData),
      }),
    );
    expect(mocks.restoreTaskId.current).toBe('restore-task-1');
    expect(mocks.showCheckBackupMessage).toHaveBeenCalledTimes(1);
  });

  it('allows removing the selected local backup before submitting', () => {
    render(<RestoreFromLocal />);

    fireEvent.click(screen.getByText('Restore backup from local'));
    fireEvent.click(screen.getByText('select-file'));
    fireEvent.click(screen.getByText('remove-file'));
    fireEvent.click(screen.getByText('Submit'));

    expect(mocks.notification.error).toHaveBeenCalledWith({ message: 'Please select a backup file' });
    expect(mocks.flowContext.api.request).not.toHaveBeenCalled();
  });

  it('closes the local restore dialog without uploading', () => {
    render(<RestoreFromLocal />);

    fireEvent.click(screen.getByText('Restore backup from local'));
    fireEvent.click(screen.getByText('select-file'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(mocks.flowContext.api.request).not.toHaveBeenCalled();
  });
});
