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
import { BackupsContext } from '../contexts';
import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { RefreshBackups } from '../components/RefreshBackups';
import { createMockAppWrapper } from './testUtils';

describe('RefreshBackups', () => {
  const { Wrapper, mockRequest } = createMockAppWrapper();
  const mockedRefresh = vi.fn().mockReturnValue({ data: [] });

  beforeEach(() => {
    mockRequest.reset();
  });

  const MockedRefreshBackupsBtn = () => {
    mockRequest.onGet(`${NAMESPACE}:list`).reply(() => {
      return [200, mockedRefresh()];
    });

    const useRequestValues = nocobaseClient.useRequest<{ data: BackupFile[] }>({
      url: `${NAMESPACE}:list`,
      method: 'get',
    });

    return (
      <BackupsContext.Provider value={useRequestValues}>
        <RefreshBackups />
      </BackupsContext.Provider>
    );
  };

  test('should render refresh backups button', async () => {
    render(<MockedRefreshBackupsBtn />, { wrapper: Wrapper });
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  test('should trigger refresh backup api', async () => {
    const user = userEvent.setup();
    render(<MockedRefreshBackupsBtn />, { wrapper: Wrapper });
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    const newBackupBtn = await screen.findByRole('button', { name: /Refresh/ });
    await waitFor(() => {
      expect(newBackupBtn).toBeEnabled();
    });
    await act(async () => {
      await user.click(newBackupBtn);
    });
    await waitFor(() => {
      expect(mockedRefresh.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
