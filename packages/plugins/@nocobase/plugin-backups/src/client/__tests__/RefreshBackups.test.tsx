import * as nocobaseClient from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import { NAMESPACE } from '../constants';
import { BackupFile } from '../components/BackupsTable';
import { BackupsContext } from '../contexts';
import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { RefreshBackups } from '../components/RefreshBackups';

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

describe('RefreshBackups', () => {
  let axioMocked: MockAdapter;
  const mockedRefresh = vi.fn().mockReturnValue({ data: [] });

  const MockedRefreshBackupsBtn = () => {
    const api = nocobaseClient.useAPIClient();
    axioMocked = new MockAdapter(api.axios);
    axioMocked.onGet(`${NAMESPACE}:list`).reply(() => {
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
    render(<MockedRefreshBackupsBtn />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  test('should trigger refresh backup api', async () => {
    const user = userEvent.setup();
    render(<MockedRefreshBackupsBtn />);
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    const newBackupBtn = screen.getByText('Refresh');
    await act(async () => {
      user.click(newBackupBtn);
    });
    await waitFor(() => {
      expect(mockedRefresh).toHaveBeenCalledTimes(2);
    });
  });
});
