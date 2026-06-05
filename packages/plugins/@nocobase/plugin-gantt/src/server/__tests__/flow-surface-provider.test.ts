/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PluginGanttServer } from '../plugin';

describe('Gantt flow surface provider regression', () => {
  it('should not register or unregister Flow Surface providers during server lifecycle', async () => {
    const registerProvider = vi.fn();
    const unregisterProvider = vi.fn();
    const plugin = Object.create(PluginGanttServer.prototype) as {
      app: {
        pm: {
          get: (name: string) => unknown;
        };
      };
      load: () => Promise<void>;
      afterEnable: () => Promise<void>;
      afterDisable: () => Promise<void>;
      remove: () => Promise<void>;
    };
    plugin.app = {
      pm: {
        get: vi.fn(() => {
          throw new Error('plugin manager must not be queried');
        }),
      },
    };

    await plugin.load();
    await plugin.afterEnable();
    await plugin.afterDisable();
    await plugin.remove();

    expect(plugin.app.pm.get).not.toHaveBeenCalled();
    expect(registerProvider).not.toHaveBeenCalled();
    expect(unregisterProvider).not.toHaveBeenCalled();
  });
});
