/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Repository } from '@nocobase/database';
import { describe, expect, it, vi } from 'vitest';
import { parseUserSelectionConfig } from '../parseUserSelectionConfig';

describe('parseUserSelectionConfig', () => {
  it('accepts numeric receiver IDs while preserving the string output contract', async () => {
    const userRepo = {
      find: vi.fn().mockResolvedValue([{ id: 3 }]),
    } as unknown as Repository;

    await expect(parseUserSelectionConfig([1, '2', { filter: { id: 3 } }], userRepo)).resolves.toEqual(['1', '2', '3']);
  });

  it.each([
    { id: 3, nickname: 'Applicant' },
    {},
    { filter: {} },
    { filter: { $and: [] } },
    { filter: 'users' },
    { filter: { id: 3 }, limit: 1 },
  ])('rejects invalid recipient selections before looking up users', async (selection) => {
    const find = vi.fn();
    const repo = { find } as unknown as Repository;
    await expect(parseUserSelectionConfig([1, selection], repo)).rejects.toThrow('Select a user ID');
    expect(find).not.toHaveBeenCalled();
  });

  it('returns only IDs selected directly or by a user filter', async () => {
    const filter = { nickname: { $eq: 'Applicant' } };
    const find = vi.fn().mockResolvedValue([{ id: 2 }, { id: 3 }]);
    const repo = { find } as unknown as Repository;
    await expect(parseUserSelectionConfig([[1, '2'], { filter }], repo)).resolves.toEqual(['1', '2', '3']);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith({ filter, fields: ['id'] });
    find.mockResolvedValue([]);
    await expect(parseUserSelectionConfig([{ filter }], repo)).resolves.toEqual([]);
  });
});
