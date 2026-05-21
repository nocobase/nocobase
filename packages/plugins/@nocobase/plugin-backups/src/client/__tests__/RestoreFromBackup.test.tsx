import * as nocobaseClient from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import { NAMESPACE } from '../constants';
import { BackupFile } from '../components/BackupsTable';
import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { RestoreFromBackup } from '../components/RestoreFromBackup';

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

describe('RestoreFromBackup', () => {
  let axioMocked: MockAdapter;
  const mockedRestore = vi.fn().mockReturnValue({ data: { status: 'ok' } });

  const MockedRestoreFromBackup = () => {
    const api = nocobaseClient.useAPIClient();
    axioMocked = new MockAdapter(api.axios);
    axioMocked.onPost(`${NAMESPACE}:restore`).reply(() => {
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
    render(<MockedRestoreFromBackup />);
    expect(screen.getByText('Restore')).toBeInTheDocument();
  });

  test('should trigger restore api', async () => {
    const user = userEvent.setup();
    render(<MockedRestoreFromBackup />);
    await act(async () => {
      user.click(screen.getByText('Restore'));
    });
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
    await act(async () => {
      user.click(screen.getByText('Submit'));
    });
    await waitFor(() => {
      expect(mockedRestore).toHaveBeenCalled();
    });
  });
});
