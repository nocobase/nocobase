/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { updateRoutesInBatch } from '../updateRoutesInBatch';

describe('updateRoutesInBatch', () => {
  it('should split selected row keys and update by batch', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);

    await updateRoutesInBatch([1, 2, 3], { hideInMenu: true }, updateRoute);

    expect(updateRoute).toHaveBeenCalledTimes(1);
    expect(updateRoute).toHaveBeenNthCalledWith(1, [1, 2, 3], { hideInMenu: true }, false);
  });

  it('should ignore empty ids', async () => {
    const updateRoute = vi.fn().mockResolvedValue(undefined);

    await updateRoutesInBatch([1, null, '', 2, undefined], { hideInMenu: false }, updateRoute);

    expect(updateRoute).toHaveBeenCalledTimes(1);
    expect(updateRoute).toHaveBeenNthCalledWith(1, [1, 2], { hideInMenu: false }, false);
  });

  it('should trigger all batches concurrently', async () => {
    let resolveFirstBatch!: () => void;
    const updateRoute = vi.fn((routeIds: number[]) => {
      if (routeIds[0] === 1) {
        return new Promise<void>((resolve) => {
          resolveFirstBatch = resolve;
        });
      }
      return Promise.resolve();
    });

    const promise = updateRoutesInBatch(
      Array.from({ length: 25 }, (_, index) => index + 1),
      { hideInMenu: true },
      updateRoute,
    );

    await Promise.resolve();

    expect(updateRoute).toHaveBeenCalledTimes(2);
    expect(updateRoute).toHaveBeenNthCalledWith(
      1,
      Array.from({ length: 20 }, (_, index) => index + 1),
      { hideInMenu: true },
      false,
    );
    expect(updateRoute).toHaveBeenNthCalledWith(2, [21, 22, 23, 24, 25], { hideInMenu: true }, false);

    resolveFirstBatch();
    await promise;
  });
});
