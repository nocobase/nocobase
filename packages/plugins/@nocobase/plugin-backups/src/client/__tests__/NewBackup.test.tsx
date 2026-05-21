import * as nocobaseClient from '@nocobase/client';
import { useAPIClient, useRequest } from '@nocobase/client';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { App } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { BackupFile } from '../components/BackupsTable';
import { NewBackup } from '../components/NewBackup';
import { NAMESPACE } from '../constants';
import { BackupsContext } from '../contexts';

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

describe('NewBackup', () => {
  let axioMocked: MockAdapter;
  const mockedRefresh = vi.fn().mockReturnValue({ data: [] });
  const mockedCreate = vi
    .fn()
    .mockReturnValue({ data: { name: 'backup_20240818_182302_2122.nbdata', inProgress: true } });
  const mockedStatus = vi
    .fn()
    .mockReturnValue({ data: { 'backup_20240818_182302_2122.nbdata': { inProgress: false } } });

  const MockedNewBackupBtn = () => {
    const api = useAPIClient();
    axioMocked = new MockAdapter(api.axios);
    axioMocked.onGet(`${NAMESPACE}:list`).reply(() => {
      return [200, mockedRefresh()];
    });
    axioMocked.onPost(`${NAMESPACE}:create`).reply(() => {
      return [200, mockedCreate()];
    });
    axioMocked.onGet(`${NAMESPACE}:taskStatus`).reply(() => {
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
    render(<MockedNewBackupBtn />);
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
    render(<MockedNewBackupBtn />);
    const newBackupBtn = screen.getByText('New backup');
    await act(async () => {
      await user.click(newBackupBtn);
    });
    await waitFor(
      () => {
        expect(mockedCreate).toHaveBeenCalled();
        expect(mockedStatus).toHaveBeenCalled();
        expect(mockedRefresh).toHaveBeenCalled();
      },
      { interval: 1000 },
    );
  });
});
