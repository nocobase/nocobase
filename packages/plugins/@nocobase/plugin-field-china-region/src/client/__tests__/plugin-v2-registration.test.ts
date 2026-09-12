/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginFieldChinaRegionClient from '..';
import {
  ChinaRegionFieldModel,
  ChinaRegionFilterFieldModel,
  DisplayChinaRegionFieldModel,
} from '../../client-v2/models';
import { ChinaRegionFieldInterface } from '../chinaRegion';
import { useChinaRegionDataSource, useChinaRegionLoadData } from '../ChinaRegionProvider';

describe('plugin-field-china-region v2 registration', () => {
  test('load registers v2 models for legacy client flow runtime', async () => {
    const flowEngine = {
      registerModels: vi.fn(),
    };
    const app = {
      addScopes: vi.fn(),
      dataSourceManager: {
        addFieldInterfaces: vi.fn(),
      },
      flowEngine,
    };

    await PluginFieldChinaRegionClient.prototype.load.call({ app, flowEngine });

    expect(app.addScopes).toHaveBeenCalledWith({
      useChinaRegionDataSource,
      useChinaRegionLoadData,
    });
    expect(app.dataSourceManager.addFieldInterfaces).toHaveBeenCalledWith([ChinaRegionFieldInterface]);
    expect(flowEngine.registerModels).toHaveBeenCalledWith({
      ChinaRegionFieldModel,
      ChinaRegionFilterFieldModel,
      DisplayChinaRegionFieldModel,
    });
  });
});
