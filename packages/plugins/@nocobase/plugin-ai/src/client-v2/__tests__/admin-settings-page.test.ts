/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { listStorageOptions, loadAdminSettings, saveAdminSettings } from '../pages/AdminSettingsPage';

describe('AdminSettingsPage request helpers', () => {
  it('loads AI settings from aiSettings.get', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: {
          storage: 's3',
        },
      },
    });
    const apiClient = {
      resource: () => ({
        get,
      }),
    };

    await expect(loadAdminSettings(apiClient)).resolves.toEqual({ storage: 's3' });
    expect(get).toHaveBeenCalledWith(undefined);
  });

  it('loads storage options from aiSettings.listStorages', async () => {
    const listStorages = vi.fn().mockResolvedValue({
      data: {
        data: [{ label: 'Local', value: 'local' }, { label: 'S3', value: 's3' }, { label: 'Invalid' }],
      },
    });
    const apiClient = {
      resource: () => ({
        listStorages,
      }),
    };

    await expect(listStorageOptions(apiClient)).resolves.toEqual([
      { label: 'Local', value: 'local' },
      { label: 'S3', value: 's3' },
    ]);
  });

  it('saves settings with the aiSettings singleton primary key', async () => {
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({
        update,
      }),
    };

    await saveAdminSettings(apiClient, { storage: 's3' });

    expect(update).toHaveBeenCalledWith({
      values: {
        storage: 's3',
      },
      filterByTk: 1,
    });
  });
});
