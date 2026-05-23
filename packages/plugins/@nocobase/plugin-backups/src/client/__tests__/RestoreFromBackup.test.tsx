/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as nocobaseClient from '@nocobase/client';
import { NAMESPACE } from '../constants';
import { BackupFile } from '../components/BackupsTable';
import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { RestoreFromBackup } from '../components/RestoreFromBackup';
import { createMockAppWrapper } from './testUtils';

describe('RestoreFromBackup', () => {
  const { Wrapper, mockRequest } = createMockAppWrapper();
  const mockedRestore = vi.fn().mockReturnValue({ data: { status: 'ok' } });

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

  const MockedRestoreFromBackup = () => {
    mockRequest.onPost(`${NAMESPACE}:restore`).reply(() => {
      return [200, mockedRestore()];
    });

    const backupRecord: BackupFile = {
      name: 'backup_20240818_182302_2122.nbdata',
      inProgress: false,
      fileSize: '51.8 KiB',
      createdAt: '2024-08-18T10:23:01.859Z',
    };

    return <RestoreFromBackup backup={backupRecord} />;
  };

  test('should render restore from backup button', async () => {
    render(<MockedRestoreFromBackup />, { wrapper: Wrapper });
    expect(screen.getByText('Restore')).toBeInTheDocument();
  });

  test('should trigger restore api', async () => {
    const user = userEvent.setup();
    render(<MockedRestoreFromBackup />, { wrapper: Wrapper });
    await act(async () => {
      await user.click(screen.getByText('Restore'));
    });
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
    await act(async () => {
      await user.click(screen.getByText('Submit'));
    });
    await waitFor(() => {
      expect(mockedRestore).toHaveBeenCalled();
    });
  });
});
