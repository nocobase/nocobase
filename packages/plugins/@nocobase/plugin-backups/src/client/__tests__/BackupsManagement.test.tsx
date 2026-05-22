import * as nocobaseClient from '@nocobase/client';
import { render, waitFor } from '@nocobase/test/client';
import React from 'react';
import { vi } from 'vitest';
import { BackupsManagement } from '../components/BackupsManagement';
import { NAMESPACE } from '../constants';

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

vi.mock('../BackupsTable', async () => {
  return {
    BackupsTable: vi.fn().mockImplementation(() => <div>Backup Table</div>),
  };
});

describe('BackupsManagement', () => {
  test('should query the backups list data on render', async () => {
    const spy = vi.spyOn(nocobaseClient, 'useRequest').mockReturnValue({} as any);
    render(<BackupsManagement />);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        url: `${NAMESPACE}:list`,
        method: 'get',
      });
    });
  });
});
