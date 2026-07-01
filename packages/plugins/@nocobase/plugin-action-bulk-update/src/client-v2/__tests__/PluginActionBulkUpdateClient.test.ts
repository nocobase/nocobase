/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PluginActionBulkUpdateClient } from '../index';

describe('PluginActionBulkUpdateClient', () => {
  it('registers the bulk update action model loader', async () => {
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionBulkUpdateClient.prototype) as PluginActionBulkUpdateClient & {
      app: {
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(registerModelLoaders).toHaveBeenCalledWith({
      BulkUpdateActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.BulkUpdateActionModel.loader()).resolves.toHaveProperty('BulkUpdateActionModel');
  });
});
