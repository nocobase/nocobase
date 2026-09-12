/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { deleteSourceRecord, saveSourceRecord, type SourceResource } from '../pages/sourceRequests';

describe('user-data-sync client-v2 source requests', () => {
  it('fires resource.create on submit in create mode', async () => {
    const resource: SourceResource = {
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    await saveSourceRecord({
      mode: 'create',
      resource,
      values: { name: 'wecom', sourceType: 'wecom', options: { corpId: 'corp' } },
    });

    expect(resource.create).toHaveBeenCalledWith({
      values: { name: 'wecom', sourceType: 'wecom', options: { corpId: 'corp' } },
    });
    expect(resource.update).not.toHaveBeenCalled();
  });

  it('fires resource.update with the correct filterByTk on submit in edit mode', async () => {
    const resource: SourceResource = {
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    await saveSourceRecord({
      mode: 'edit',
      resource,
      record: { id: 12, name: 'wecom', sourceType: 'wecom', options: { corpId: 'old', token: 'keep' } },
      values: { name: 'wecom', sourceType: 'wecom', options: { corpId: 'new' } },
    });

    expect(resource.update).toHaveBeenCalledWith({
      filterByTk: 12,
      values: {
        id: 12,
        name: 'wecom',
        sourceType: 'wecom',
        options: { corpId: 'new', token: 'keep' },
      },
    });
    expect(resource.create).not.toHaveBeenCalled();
  });

  it('fires resource.destroy on row-level delete', async () => {
    const resource: SourceResource = {
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    await deleteSourceRecord(resource, { id: 12, name: 'wecom' });

    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: 12 });
  });
});
