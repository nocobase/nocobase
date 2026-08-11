/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginFieldChinaRegionClient from '../plugin';
import { ChinaRegionFieldInterface } from '../chinaRegion';
import { ChinaRegionFilterFieldModel } from '../models';

describe('PluginFieldChinaRegionClient v2', () => {
  it('registers the china region filter field model loader', async () => {
    const app = {
      addFieldInterfaces: vi.fn(),
      flowEngine: {
        registerModelLoaders: vi.fn(),
      },
    };
    const plugin = new PluginFieldChinaRegionClient({} as any, app as any);

    await plugin.load();

    expect(app.addFieldInterfaces).toHaveBeenCalledWith([ChinaRegionFieldInterface]);
    expect(app.flowEngine.registerModelLoaders).toHaveBeenCalledWith(
      expect.objectContaining({
        ChinaRegionFilterFieldModel: {
          loader: expect.any(Function),
        },
      }),
    );

    const loaders = app.flowEngine.registerModelLoaders.mock.calls[0]?.[0];
    const loaded = await loaders.ChinaRegionFilterFieldModel.loader();
    expect(loaded.ChinaRegionFilterFieldModel).toBe(ChinaRegionFilterFieldModel);
  });
});
