/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PluginActionPrintClient, PrintActionModel } from '../index';

describe('PluginActionPrintClient', () => {
  it('registers the print action model loader', async () => {
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionPrintClient.prototype) as PluginActionPrintClient & {
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
      PrintActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.PrintActionModel.loader()).resolves.toHaveProperty('PrintActionModel', PrintActionModel);
  });
});
