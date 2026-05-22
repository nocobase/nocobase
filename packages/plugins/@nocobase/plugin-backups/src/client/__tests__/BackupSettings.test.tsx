import { observer } from '@formily/react';
import * as nocobaseClient from '@nocobase/client';
import { SchemaComponentProvider } from '@nocobase/client';
import { sleep } from '@nocobase/test';
import { act, render, screen, userEvent } from '@nocobase/test/client';
import { App } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { BackupSettings } from '../components/BackupSettings';

vi.mock('@nocobase/client', async () => {
  const actual = await vi.importActual<typeof nocobaseClient>('@nocobase/client');
  return {
    ...actual,
    useApp: () => ({
      i18n: {
        t: vi.fn().mockImplementation((key) => key), // Mock translation function, return the key directly
      },
    }),
  };
});

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
  const mockedStorages = vi.fn().mockReturnValue(storagesData);
  const mockedGetSettings = vi.fn().mockReturnValue(settingsData);
  const mockedUpdateSettings = vi.fn().mockReturnValue({ data: { status: 'ok' } });

  const MockedBackupSettings = observer(() => {
    const api = nocobaseClient.useAPIClient();
    const axioMocked = new MockAdapter(api.axios);
    axioMocked.onGet(`backupSettings:get/1`).reply(() => {
      return [200, mockedGetSettings()];
    });
    axioMocked.onGet(`storages:list`).reply(() => {
      return [200, mockedStorages()];
    });
    axioMocked.onPost(`backupSettings:update/1`).reply((config) => {
      return [200, mockedUpdateSettings(config.data)];
    });

    return (
      <SchemaComponentProvider>
        <BackupSettings />
      </SchemaComponentProvider>
    );
  });

  test('should render backup settings', async () => {
    render(<MockedBackupSettings />);
    expect(screen.getByText('Restore password')).toBeInTheDocument();
  });

  test('should list "sync backup to cloud storage" options', async () => {
    const user = userEvent.setup();
    render(<MockedBackupSettings />);
    await sleep(3000);
    const inputEle: HTMLElement = document.querySelector('div.ant-formily-item-control') as HTMLInputElement;
    await act(async () => {
      await user.click(inputEle);
    });
    const optionItems = document.querySelectorAll('span.ant-select-selection-item');
    expect(optionItems.length).toBe(2);
  });

  test('should trigger update backup settings api', async () => {
    vi.spyOn(App, 'useApp').mockReturnValue({
      // @ts-ignore
      message: {
        success: vi.fn(),
      },
    });
    const user = userEvent.setup();
    render(<MockedBackupSettings />);
    await sleep(3000);
    await act(async () => {
      await user.click(screen.getByText('Restore password').parentElement.firstElementChild);
      await user.click(document.querySelector('div.ant-formily-item-control'));
      await user.click(screen.getByText('ali'));
      await user.type(document.querySelector('input[type=password]'), '123456');
      await user.click(screen.getByText('Submit'));
    });
    expect(mockedUpdateSettings).toHaveBeenCalled();
    expect(mockedUpdateSettings.mock.calls[0][0]).toEqual(
      '{"id":1,"createdAt":"2024-08-15T07:08:38.808Z","updatedAt":"2024-08-21T09:10:58.261Z","scheduled":false,"cron":"0 0 * * *","keep":100,"enableFilesBackup":false,"storageId":2,"encryptionPassword":"123456"}',
    );
  });
});
