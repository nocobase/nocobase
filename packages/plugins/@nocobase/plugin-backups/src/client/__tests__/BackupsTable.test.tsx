import * as nocobaseClient from '@nocobase/client';
import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { App } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import saveAs from 'file-saver';
import React from 'react';
import { describe, vi } from 'vitest';
import { BackupFile, BackupsTable } from '../components/BackupsTable';
import { NAMESPACE } from '../constants';
import { BackupsContext } from '../contexts';

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

vi.mock('file-saver', async () => {
  return {
    default: vi.fn(),
  };
});

describe('BackupsTable', () => {
  let mocked: MockAdapter;

  const MockedTable = () => {
    const api = nocobaseClient.useAPIClient();
    mocked = new MockAdapter(api.axios);
    mocked.onGet('backups:list').reply(200, mockedData);
    mocked.onPost('backups:destroy').reply(200, {});

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
    render(<MockedTable />);
    await waitFor(() => {
      expect(screen.getByText('Backup list')).toBeInTheDocument();
      expect(screen.getByText('backup_20240818_182301_9056.nbdata')).toBeInTheDocument();
    });
  });

  test('should handle download action', async () => {
    const user = userEvent.setup();
    render(<MockedTable />);
    const createElementSpy = vi.spyOn(document, 'createElement');

    await waitFor(async () => {
      await user.click(screen.getAllByText('Download')[0]);
    });
    expect(createElementSpy).toHaveBeenCalledWith('a');
    const results = createElementSpy.mock.results;
    const linkElement = results[results.length - 1].value;
    expect(linkElement.href).toContain('/api/backups:download');
    expect(linkElement.download).toBeTruthy();
    createElementSpy.mockRestore();
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
    render(<MockedTable />);
    await waitFor(async () => {
      await user.click(screen.getAllByText('Delete')[0]);
      expect(modalConfirmSpy).toHaveBeenCalled();
    });
  });

  test('should handle backing up data', async () => {
    render(<MockedTable />);
    await waitFor(async () => {
      expect(screen.getByText('Backup list')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: /Backing up/i })).toBeInTheDocument();
    });
  });
});
