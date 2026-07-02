/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { ChinaRegionFieldInterface, ChinaRegionFieldModel, DisplayChinaRegionFieldModel } from '../index';
import PluginFieldChinaRegionClient from '../plugin';

describe('PluginFieldChinaRegionClient', () => {
  it('registers the china region interface and model loaders', async () => {
    const addFieldInterfaces = vi.fn();
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginFieldChinaRegionClient.prototype) as PluginFieldChinaRegionClient & {
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

    expect(addFieldInterfaces).toHaveBeenCalledWith([ChinaRegionFieldInterface]);
    expect(registerModelLoaders).toHaveBeenCalledWith({
      ChinaRegionFieldModel: {
        loader: expect.any(Function),
      },
      DisplayChinaRegionFieldModel: {
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.ChinaRegionFieldModel.loader()).resolves.toHaveProperty(
      'ChinaRegionFieldModel',
      ChinaRegionFieldModel,
    );
    await expect(loaders.DisplayChinaRegionFieldModel.loader()).resolves.toHaveProperty(
      'DisplayChinaRegionFieldModel',
      DisplayChinaRegionFieldModel,
    );
  });
});
