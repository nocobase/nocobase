/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { isTitleUsableField, syncCollectionTitleField } from '../titleFieldQuickSync';

describe('titleFieldQuickSync', () => {
  it('filters title field candidates by interface metadata', () => {
    const dm: any = {
      collectionFieldInterfaceManager: {
        getFieldInterface: vi.fn((name: string) => {
          if (name === 'input') return { titleUsable: true };
          if (name === 'formula') return { titleUsable: false };
          return undefined;
        }),
      },
    };

    expect(isTitleUsableField(dm, { interface: 'input' } as any)).toBe(true);
    expect(isTitleUsableField(dm, { interface: 'formula' } as any)).toBe(false);
    expect(isTitleUsableField(dm, { interface: 'unknown' } as any)).toBe(false);
    expect(isTitleUsableField(undefined, { interface: 'input' } as any)).toBe(false);
  });

  it('syncs title field to main data source collection', async () => {
    const request = vi.fn().mockResolvedValue({});
    const reload = vi.fn().mockResolvedValue({});
    const setOption = vi.fn();

    await syncCollectionTitleField({
      api: { request },
      dataSourceManager: { getDataSource: vi.fn(() => ({ reload })) } as any,
      targetCollection: {
        name: 'users',
        dataSourceKey: 'main',
        setOption,
      },
      titleField: 'nickname',
    });

    expect(request).toHaveBeenCalledWith({
      url: 'collections:update',
      method: 'post',
      params: { filterByTk: 'users' },
      data: { titleField: 'nickname' },
    });
    expect(setOption).toHaveBeenCalledWith('titleField', 'nickname');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('syncs title field to non-main data source collection', async () => {
    const request = vi.fn().mockResolvedValue({});
    const reload = vi.fn().mockResolvedValue({});

    await syncCollectionTitleField({
      api: { request },
      dataSourceManager: { getDataSource: vi.fn(() => ({ reload })) } as any,
      targetCollection: {
        name: 'users',
        dataSource: 'analytics',
      },
      titleField: 'name',
    });

    expect(request).toHaveBeenCalledWith({
      url: 'dataSources/analytics/collections:update',
      method: 'post',
      params: { filterByTk: 'users' },
      data: { titleField: 'name' },
    });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('throws when target collection name is missing', async () => {
    const request = vi.fn().mockResolvedValue({});

    await expect(
      syncCollectionTitleField({
        api: { request },
        targetCollection: { dataSourceKey: 'main' },
        titleField: 'nickname',
      }),
    ).rejects.toThrow('Target collection name is required for syncing title field.');

    expect(request).not.toHaveBeenCalled();
  });
});
