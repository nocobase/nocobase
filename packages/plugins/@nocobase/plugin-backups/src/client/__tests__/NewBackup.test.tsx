/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as nocobaseClient from '@nocobase/client';
import { useRequest } from '@nocobase/client';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { App } from 'antd';
import React from 'react';
import { BackupFile } from '../components/BackupsTable';
import { NewBackup } from '../components/NewBackup';
import { NAMESPACE } from '../constants';
import { BackupsContext } from '../contexts';
import { createMockAppWrapper } from './testUtils';

describe('NewBackup', () => {
  const { Wrapper, mockRequest } = createMockAppWrapper();
  const mockedRefresh = vi.fn();
  const mockedCreate = vi.fn();
  const mockedStatus = vi.fn();

  beforeEach(() => {
    mockRequest.reset();
    mockedRefresh.mockReset().mockReturnValue({ data: [] });
    mockedCreate.mockReset().mockReturnValue({
      data: { name: 'backup_20240818_182302_2122.nbdata', inProgress: true },
    });
    mockedStatus.mockReset().mockReturnValue({
      data: { 'backup_20240818_182302_2122.nbdata': { inProgress: false } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const MockedNewBackupBtn = () => {
    mockRequest.onGet(`${NAMESPACE}:list`).reply(() => {
      return [200, mockedRefresh()];
    });
    mockRequest.onPost(`${NAMESPACE}:create`).reply(() => {
      return [200, mockedCreate()];
    });
    mockRequest.onGet(`${NAMESPACE}:taskStatus`).reply(() => {
      return [200, mockedStatus()];
    });

    const useRequestValues = useRequest<{ data: BackupFile[] }>({
      url: `${NAMESPACE}:list`,
      method: 'get',
    });

    return (
      <BackupsContext.Provider value={useRequestValues}>
        <NewBackup />
      </BackupsContext.Provider>
    );
  };

  test('should render new backup button', async () => {
    render(<MockedNewBackupBtn />, { wrapper: Wrapper });
    expect(screen.getByText('New backup')).toBeInTheDocument();
  });

  test('should create a new backup', async () => {
    vi.spyOn(App, 'useApp').mockReturnValue({
      // @ts-ignore
      message: {
        success: vi.fn(),
      },
      // @ts-ignore
      modal: {
        confirm: vi.fn().mockImplementation(({ onOk }) => onOk()),
      },
    });
    const user = userEvent.setup();
    render(<MockedNewBackupBtn />, { wrapper: Wrapper });
    const newBackupBtn = screen.getByText('New backup');
    await act(async () => {
      await user.click(newBackupBtn);
    });
    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalled();
      expect(mockedRefresh).toHaveBeenCalled();
    });
    await waitFor(
      () => {
        expect(mockedStatus).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });
});
