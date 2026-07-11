/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as nocobaseClient from '@nocobase/client';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { App } from 'antd';
import React from 'react';
import { describe, vi } from 'vitest';
import { BackupFile, BackupsTable } from '../components/BackupsTable';
import { NAMESPACE } from '../constants';
import { BackupsContext } from '../contexts';
import { createMockAppWrapper } from './testUtils';

const mockedData = {
  data: [
    {
      name: 'backup_20240818_182302_2122.nbdata',
      inProgress: true,
    },
    {
      name: 'backup_20240818_182301_9056.nbdata',
      fileSize: '51.8 KiB',
      createdAt: '2024-08-18T10:23:01.859Z',
      inProgress: false,
    },
  ],
};

describe('BackupsTable', () => {
  const { Wrapper, apiClient, mockRequest } = createMockAppWrapper();

  beforeEach(() => {
    mockRequest.reset();
    mockRequest.onGet(`${NAMESPACE}:appInfo`).reply(200, {
      data: {
        database: {
          dialect: 'sqlite',
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const MockedTable = () => {
    mockRequest.onGet('backups:list').reply(200, mockedData);
    mockRequest.onPost('backups:destroy').reply(200, {});

    const useRequestValues = nocobaseClient.useRequest<{ data: BackupFile[] }>({
      url: `${NAMESPACE}:list`,
      method: 'get',
    });

    return (
      <BackupsContext.Provider value={useRequestValues}>
        <BackupsTable />
      </BackupsContext.Provider>
    );
  };

  test('should render table with correct columns and data', async () => {
    render(<MockedTable />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Backup list')).toBeInTheDocument();
      expect(screen.getByText('backup_20240818_182301_9056.nbdata')).toBeInTheDocument();
    });
  });

  test('should handle download action', async () => {
    let resolveTemporaryUrl!: (value: { url: string; expiresAt: number }) => void;
    const temporaryUrlPromise = new Promise<{ url: string; expiresAt: number }>((resolve) => {
      resolveTemporaryUrl = resolve;
    });
    const createTemporaryUrlSpy = vi.spyOn(apiClient.auth, 'createTemporaryUrl').mockReturnValue(temporaryUrlPromise);
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<MockedTable />, { wrapper: Wrapper });
    const downloadButton = await screen.findByRole('button', { name: 'Download' });

    await user.click(downloadButton);
    await user.click(downloadButton);

    await waitFor(() => {
      expect(downloadButton).toHaveAttribute('aria-busy', 'true');
      expect(createTemporaryUrlSpy).toHaveBeenCalledTimes(1);
      expect(createTemporaryUrlSpy).toHaveBeenCalledWith({
        url: 'backups:download',
        params: {
          filterByTk: 'backup_20240818_182301_9056.nbdata',
        },
      });
    });

    await act(async () => {
      resolveTemporaryUrl({
        url: '/api/backups:download?filterByTk=backup_20240818_182301_9056.nbdata&accessCode=test-code',
        expiresAt: Date.now() + 30_000,
      });
    });

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
      expect(downloadButton).toHaveAttribute('aria-busy', 'false');
    });

    const link = anchorClickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(
      '/api/backups:download?filterByTk=backup_20240818_182301_9056.nbdata&accessCode=test-code',
    );
    expect(link.download).toBe('backup_20240818_182301_9056.nbdata');
    expect(link).not.toBeInTheDocument();
  });

  test('should reset download state when temporary URL creation fails', async () => {
    let rejectTemporaryUrl!: (reason: Error) => void;
    const createTemporaryUrlSpy = vi.spyOn(apiClient.auth, 'createTemporaryUrl').mockReturnValue(
      new Promise<{ url: string; expiresAt: number }>((_resolve, reject) => {
        rejectTemporaryUrl = reject;
      }),
    );
    const user = userEvent.setup();
    render(<MockedTable />, { wrapper: Wrapper });
    const downloadButton = await screen.findByRole('button', { name: 'Download' });

    await user.click(downloadButton);
    await waitFor(() => {
      expect(downloadButton).toHaveAttribute('aria-busy', 'true');
      expect(createTemporaryUrlSpy).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      rejectTemporaryUrl(new Error('temporary URL failed'));
    });
    await waitFor(() => {
      expect(downloadButton).toHaveAttribute('aria-busy', 'false');
    });
  });

  test('should handle delete action', async () => {
    const modalConfirmSpy = vi.fn().mockImplementation(({ onOk }) => onOk());
    vi.spyOn(App, 'useApp').mockReturnValue({
      // @ts-ignore
      modal: {
        confirm: modalConfirmSpy,
      },
    });
    const user = userEvent.setup();
    render(<MockedTable />, { wrapper: Wrapper });
    await waitFor(async () => {
      await user.click(screen.getAllByText('Delete')[0]);
      expect(modalConfirmSpy).toHaveBeenCalled();
    });
  });

  test('should handle backing up data', async () => {
    render(<MockedTable />, { wrapper: Wrapper });
    await waitFor(async () => {
      expect(screen.getByText('Backup list')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: /Backing up/i })).toBeInTheDocument();
    });
  });
});
