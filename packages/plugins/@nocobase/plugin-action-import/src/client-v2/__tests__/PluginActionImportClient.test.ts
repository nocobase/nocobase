/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { ImportActionModel, PluginActionImportClient } from '../index';

describe('PluginActionImportClient', () => {
  it('registers the import action model loader', async () => {
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionImportClient.prototype) as PluginActionImportClient & {
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
      ImportActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.ImportActionModel.loader()).resolves.toHaveProperty('ImportActionModel', ImportActionModel);
  });
});
