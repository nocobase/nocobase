/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { EntryActionManager } from '../EntryActionManager';

describe('EntryActionManager', () => {
  it('should share in-flight app:getPortals requests', async () => {
    const manager = new EntryActionManager();
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                data: {
                  apps: [{ name: 'app1' }],
                  portals: [{ appName: 'main', routePath: '/workspace' }],
                },
              },
            });
          }, 0);
        }),
    );
    const apiClient = {
      request,
    };

    const [first, second] = await Promise.all([manager.loadAppPortals(apiClient), manager.loadAppPortals(apiClient)]);

    expect(request).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first.apps).toEqual([{ name: 'app1' }]);
    expect(first.portals).toEqual([{ appName: 'main', routePath: '/workspace' }]);
  });

  it('should request fresh app:getPortals data after the previous request settles', async () => {
    const manager = new EntryActionManager();
    const request = vi.fn(async () => ({
      data: {
        data: {
          apps: [],
          portals: [],
        },
      },
    }));
    const apiClient = {
      request,
    };

    await manager.loadAppPortals(apiClient);
    await manager.loadAppPortals(apiClient);

    expect(request).toHaveBeenCalledTimes(2);
  });
});
