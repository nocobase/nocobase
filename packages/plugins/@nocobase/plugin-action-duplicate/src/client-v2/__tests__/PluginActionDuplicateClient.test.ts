/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { DuplicateActionModel, PluginActionDuplicateClient } from '../index';

describe('PluginActionDuplicateClient', () => {
  it('registers the duplicate action model loader', async () => {
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionDuplicateClient.prototype) as PluginActionDuplicateClient & {
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
      DuplicateActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.DuplicateActionModel.loader()).resolves.toHaveProperty(
      'DuplicateActionModel',
      DuplicateActionModel,
    );
  });
});
