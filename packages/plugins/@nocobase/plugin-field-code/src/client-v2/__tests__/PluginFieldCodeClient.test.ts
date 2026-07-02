/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { CodeFieldInterface, CodeFieldModel, DisplayCodeFieldModel } from '../index';
import PluginFieldCodeClient from '../plugin';

describe('PluginFieldCodeClient', () => {
  it('registers the code field interface and model loaders', async () => {
    const addFieldInterfaces = vi.fn();
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginFieldCodeClient.prototype) as PluginFieldCodeClient & {
      app: {
        addFieldInterfaces: typeof addFieldInterfaces;
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      addFieldInterfaces,
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([CodeFieldInterface]);
    expect(registerModelLoaders).toHaveBeenCalledWith({
      CodeFieldModel: {
        loader: expect.any(Function),
      },
      DisplayCodeFieldModel: {
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.CodeFieldModel.loader()).resolves.toHaveProperty('CodeFieldModel', CodeFieldModel);
    await expect(loaders.DisplayCodeFieldModel.loader()).resolves.toHaveProperty(
      'DisplayCodeFieldModel',
      DisplayCodeFieldModel,
    );
  });
});
