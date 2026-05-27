/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as nocobaseClient from '@nocobase/client';
import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { App } from 'antd';
import { saveAs } from 'file-saver';
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

vi.mock('file-saver', async () => {
  return {
    saveAs: vi.fn(),
  };
});

describe('BackupsTable', () => {
  const { Wrapper, mockRequest } = createMockAppWrapper();

  beforeEach(() => {
    mockRequest.reset();
    vi.spyOn(nocobaseClient, 'useCurrentAppInfo').mockReturnValue(undefined as any);
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
    mockRequest.onGet('backups:download').reply(200, 'mocked-backup-content');
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
    const user = userEvent.setup();
    render(<MockedTable />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByText('Download')[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByText('Download')[0]);

    await waitFor(() => {
      expect(mockRequest.history.get).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: 'backups:download',
            responseType: 'blob',
            params: {
              filterByTk: 'backup_20240818_182301_9056.nbdata',
            },
          }),
        ]),
      );
      expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'backup_20240818_182301_9056.nbdata');
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
