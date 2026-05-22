/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { SchemaComponentProvider } from '@nocobase/client';
import { sleep } from '@nocobase/test/web';
import { act, render, screen, userEvent } from '@nocobase/test/client';
import { App } from 'antd';
import React from 'react';
import { BackupSettings } from '../components/BackupSettings';
import { createMockAppWrapper } from './testUtils';

const storagesData = {
  data: [
    {
      id: 1,
      createdAt: '2023-03-30T07:53:10.897Z',
      updatedAt: '2023-05-06T00:45:19.634Z',
      title: 'LocalStorage',
      name: 'local',
      type: 'local',
      options: {
        serve: true,
        documentRoot: 'storage/uploads',
      },
      rules: {},
      path: '',
      baseUrl: '/storage/uploads',
      default: true,
      paranoid: false,
    },
    {
      id: 2,
      createdAt: '2024-08-21T09:10:27.811Z',
      updatedAt: '2024-08-21T09:10:27.811Z',
      title: 'ali',
      name: 's_zhcg6tu6tgm',
      type: 'ali-oss',
      options: {
        bucket: 'test',
        region: 'oss-cn-beijing',
        accessKeyId: 'admin@nocobase.com',
        accessKeySecret: 'admin123',
      },
      rules: {
        size: 20971520,
      },
      path: '',
      baseUrl: 'https://cdn.nocobase.com',
      default: false,
      paranoid: false,
    },
  ],
};

const settingsData = {
  data: {
    id: 1,
    createdAt: '2024-08-15T07:08:38.808Z',
    updatedAt: '2024-08-21T09:10:58.261Z',
    scheduled: false,
    cron: '0 0 * * *',
    keep: 100,
    enableFilesBackup: false,
    storageId: 2,
    encryptionPassword: '',
  },
  meta: {
    allowedActions: {
      view: [1],
      update: [1],
      destroy: [1],
    },
  },
};

describe('BackupSettings', () => {
  const { Wrapper, mockRequest } = createMockAppWrapper();
  const mockedStorages = vi.fn();
  const mockedGetSettings = vi.fn();
  const mockedUpdateSettings = vi.fn();

  beforeEach(() => {
    mockRequest.reset();
    mockedStorages.mockReset().mockReturnValue(storagesData);
    mockedGetSettings.mockReset().mockReturnValue(settingsData);
    mockedUpdateSettings.mockReset().mockReturnValue({ data: { status: 'ok' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const MockedBackupSettings = observer(() => {
    mockRequest.onGet(`backupSettings:get/1`).reply(() => {
      return [200, mockedGetSettings()];
    });
    mockRequest.onGet(`storages:list`).reply(() => {
      return [200, mockedStorages()];
    });
    mockRequest.onPost(`backupSettings:update/1`).reply((config) => {
      return [200, mockedUpdateSettings(config.data)];
    });

    return (
      <SchemaComponentProvider>
        <BackupSettings />
      </SchemaComponentProvider>
    );
  });

  test('should render backup settings', async () => {
    render(<MockedBackupSettings />, { wrapper: Wrapper });
    expect(await screen.findByText('Restore password')).toBeInTheDocument();
  });

  test('should list "sync backup to cloud storage" options', async () => {
    const user = userEvent.setup();
    render(<MockedBackupSettings />, { wrapper: Wrapper });
    await sleep(3000);
    const storageCombobox = screen.getAllByRole('combobox').at(-1) as HTMLElement;
    await act(async () => {
      await user.click(storageCombobox);
    });
    expect(await screen.findByText('ali')).toBeInTheDocument();
  });

  test('should trigger update backup settings api', async () => {
    vi.spyOn(App, 'useApp').mockReturnValue({
      // @ts-ignore
      message: {
        success: vi.fn(),
      },
    });
    const user = userEvent.setup();
    render(<MockedBackupSettings />, { wrapper: Wrapper });
    await sleep(3000);
    const passwordInput = document.querySelector('input[type=password]') as HTMLInputElement;
    await act(async () => {
      await user.clear(passwordInput);
      await user.type(passwordInput, '123456');
      await user.click(screen.getByRole('button', { name: /Submit/ }));
    });
    expect(mockedUpdateSettings).toHaveBeenCalled();
    expect(mockedUpdateSettings.mock.calls[0][0]).toEqual(
      '{"id":1,"createdAt":"2024-08-15T07:08:38.808Z","updatedAt":"2024-08-21T09:10:58.261Z","scheduled":false,"cron":"0 0 * * *","keep":100,"enableFilesBackup":false,"storageId":2,"encryptionPassword":"123456"}',
    );
  });
});
