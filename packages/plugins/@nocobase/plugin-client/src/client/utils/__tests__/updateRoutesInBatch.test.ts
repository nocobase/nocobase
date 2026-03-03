/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { normalizeRouteIds, updateRoutesInBatch } from '../updateRoutesInBatch';

describe('normalizeRouteIds', () => {
  it('should return checked keys for tree selection object', () => {
    expect(normalizeRouteIds({ checked: [1, 2], halfChecked: [3] })).toEqual([1, 2]);
  });

  it('should fallback to selectedRowKeys in object format', () => {
    expect(normalizeRouteIds({ selectedRowKeys: [4, 5] })).toEqual([4, 5]);
  });
});

describe('updateRoutesInBatch', () => {
  it('should split selected row keys and update one by one', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);

    await updateRoutesInBatch([1, 2, 3], { hideInMenu: true }, updateRoute);

    expect(updateRoute).toHaveBeenCalledTimes(3);
    expect(updateRoute).toHaveBeenNthCalledWith(1, 1, { hideInMenu: true }, false);
    expect(updateRoute).toHaveBeenNthCalledWith(2, 2, { hideInMenu: true }, false);
    expect(updateRoute).toHaveBeenNthCalledWith(3, 3, { hideInMenu: true }, false);
  });

  it('should ignore empty ids', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);

    await updateRoutesInBatch([1, null, '', 2, undefined], { hideInMenu: false }, updateRoute);

    expect(updateRoute).toHaveBeenCalledTimes(2);
    expect(updateRoute).toHaveBeenNthCalledWith(1, 1, { hideInMenu: false }, false);
    expect(updateRoute).toHaveBeenNthCalledWith(2, 2, { hideInMenu: false }, false);
  });

  it('should handle tree selection object', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);

    await updateRoutesInBatch({ checked: [11, 12], halfChecked: [13] }, { hideInMenu: true }, updateRoute);

    expect(updateRoute).toHaveBeenCalledTimes(2);
    expect(updateRoute).toHaveBeenNthCalledWith(1, 11, { hideInMenu: true }, false);
    expect(updateRoute).toHaveBeenNthCalledWith(2, 12, { hideInMenu: true }, false);
  });
});
