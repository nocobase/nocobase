/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { CustomRequestActionModel, PluginActionCustomRequestClient } from '../index';
import { customRequestFlowAction } from '../customRequestFlowAction';

describe('PluginActionCustomRequestClient', () => {
  it('registers custom request action and model loader', async () => {
    const registerActions = vi.fn();
    const registerModelLoaders = vi.fn();
    const registerActionModels = vi.fn();
    const plugin = Object.create(PluginActionCustomRequestClient.prototype) as PluginActionCustomRequestClient & {
      app: {
        flowEngine: {
          registerActions: typeof registerActions;
          registerModelLoaders: typeof registerModelLoaders;
          getModelClass: (modelName: string) => { registerActionModels: typeof registerActionModels };
        };
      };
    };
    plugin.app = {
      flowEngine: {
        registerActions,
        registerModelLoaders,
        getModelClass: () => ({
          registerActionModels,
        }),
      },
    };

    await plugin.load();

    expect(registerActions).toHaveBeenCalledWith({
      customRequestFlowAction,
    });
    expect(registerModelLoaders).toHaveBeenCalledWith({
      CustomRequestActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.CustomRequestActionModel.loader()).resolves.toBe(CustomRequestActionModel);
    expect(registerActionModels).toHaveBeenCalledWith({
      CustomRequestActionModel,
    });
  });
});
