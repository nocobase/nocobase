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
import { RestoreLoadingProvider } from '../components/RestoreLoadingProvider';

const mocks = vi.hoisted(() => ({
  flowContext: {
    api: {
      request: vi.fn(),
      toErrMessages: vi.fn((error: Error) => [{ message: error.message }]),
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

const backup = {
  name: 'backup.zip',
  fileSize: '10KB',
  createdAt: '2026-07-03T00:00:00.000Z',
  inProgress: false,
};

function RestoreRouteHarness() {
  const [showRestore, setShowRestore] = React.useState(true);

  return (
    <>
      <button type="button" onClick={() => setShowRestore(false)}>
        navigate-away
      </button>
      {showRestore ? <RestoreFromBackup backup={backup} /> : <div>Other page</div>}
    </>
  );
}

function renderWithRestoreProvider(node: React.ReactNode) {
  return render(<RestoreLoadingProvider>{node}</RestoreLoadingProvider>);
}

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
    renderWithRestoreProvider(<RestoreFromBackup backup={backup} />);

    fireEvent.click(screen.getByText('Restore'));
    expect(screen.getByText('Confirm the application database schema')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backups:restore',
        method: 'post',
        skipNotify: true,
        data: {
          name: 'backup.zip',
          password: '',
          dbSchema: '',
        },
      }),
    );
    expect(mocks.restoreTaskId.current).toBe('restore-task-1');
    expect(mocks.showCheckBackupMessage).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Restoring backup')).toBeInTheDocument();
  });

  it('keeps restore loading mounted when the restore action subtree unmounts', async () => {
    renderWithRestoreProvider(<RestoreRouteHarness />);

    fireEvent.click(screen.getByText('Restore'));
    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Restoring backup')).toBeInTheDocument();

    fireEvent.click(screen.getByText('navigate-away'));

    expect(screen.getByText('Other page')).toBeInTheDocument();
    expect(screen.getByText('Restoring backup')).toBeInTheDocument();
  });

  it('disables every restore entry point while a restore is running', async () => {
    renderWithRestoreProvider(
      <>
        <RestoreFromLocal />
        <RestoreFromBackup backup={backup} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Restore', exact: true }));
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Restoring backup')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore', exact: true })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Restore backup from local/ })).toBeDisabled();
  });

  it('closes and resets the existing-backup restore dialog without submitting', () => {
    renderWithRestoreProvider(
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

  it('blocks repeated restore actions while the request is pending', async () => {
    let resolveRequest: ((value: { data: { data: { task: string } } }) => void) | undefined;
    mocks.flowContext.api.request.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderWithRestoreProvider(
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
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(mocks.flowContext.api.request).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Submit/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: /Submit/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mocks.flowContext.api.request).toHaveBeenCalledTimes(1);

    resolveRequest?.({ data: { data: { task: 'restore-task-1' } } });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('hides database schema confirmation for non-postgres restore targets', () => {
    mocks.appInfo = {
      database: {
        dialect: 'mysql',
      },
    };

    renderWithRestoreProvider(
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
    renderWithRestoreProvider(<RestoreFromLocal />);

    fireEvent.click(screen.getByText('Restore backup from local'));
    fireEvent.click(screen.getByText('Submit'));
    expect(mocks.notification.error).toHaveBeenCalledWith({ message: 'Please select a backup file' });

    fireEvent.click(screen.getByText('select-file'));
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(mocks.flowContext.api.request).toHaveBeenCalledWith({
        url: 'backups:upload',
        method: 'post',
        skipNotify: true,
        data: expect.any(FormData),
      }),
    );
    expect(mocks.restoreTaskId.current).toBe('restore-task-1');
    expect(mocks.showCheckBackupMessage).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Restoring backup')).toBeInTheDocument();
  });

  it('keeps the local restore dialog blocked when the request is interrupted', async () => {
    mocks.flowContext.api.request.mockRejectedValue(new Error('Network Error'));

    renderWithRestoreProvider(<RestoreFromLocal />);
    fireEvent.click(screen.getByText('Restore backup from local'));
    fireEvent.click(screen.getByText('select-file'));
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(mocks.notification.error).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Submit/ })).toBeDisabled();
  });

  it('allows removing the selected local backup before submitting', () => {
    renderWithRestoreProvider(<RestoreFromLocal />);

    fireEvent.click(screen.getByText('Restore backup from local'));
    fireEvent.click(screen.getByText('select-file'));
    fireEvent.click(screen.getByText('remove-file'));
    fireEvent.click(screen.getByText('Submit'));

    expect(mocks.notification.error).toHaveBeenCalledWith({ message: 'Please select a backup file' });
    expect(mocks.flowContext.api.request).not.toHaveBeenCalled();
  });

  it('closes the local restore dialog without uploading', () => {
    renderWithRestoreProvider(<RestoreFromLocal />);

    fireEvent.click(screen.getByText('Restore backup from local'));
    fireEvent.click(screen.getByText('select-file'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(mocks.flowContext.api.request).not.toHaveBeenCalled();
  });
});
