/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as nocobaseClient from '@nocobase/client';
import { render, waitFor } from '@nocobase/test/client';
import React from 'react';
import { vi } from 'vitest';
import { BackupsManagement } from '../components/BackupsManagement';
import { NAMESPACE } from '../constants';
import { createMockAppWrapper } from './testUtils';

vi.mock('../components/BackupsTable', async () => {
  return {
    BackupsTable: vi.fn().mockImplementation(() => <div>Backup Table</div>),
  };
});

vi.mock('../components/NewBackup', async () => {
  return {
    NewBackup: vi.fn().mockImplementation(() => <div>New Backup</div>),
  };
});

vi.mock('../components/RefreshBackups', async () => {
  return {
    RefreshBackups: vi.fn().mockImplementation(() => <div>Refresh Backups</div>),
  };
});

vi.mock('../components/RestoreFromLocal', async () => {
  return {
    RestoreFromLocal: vi.fn().mockImplementation(() => <div>Restore From Local</div>),
  };
});

describe('BackupsManagement', () => {
  const { Wrapper } = createMockAppWrapper();

  test('should query the backups list data on render', async () => {
    const spy = vi.spyOn(nocobaseClient, 'useRequest').mockReturnValue({} as any);
    render(<BackupsManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        url: `${NAMESPACE}:list`,
        method: 'get',
      });
    });
  });
});
