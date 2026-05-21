/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { useChinaRegionDataSource, useChinaRegionLoadData } from './ChinaRegionProvider';
import { ChinaRegionFieldInterface } from './chinaRegion';
import { ChinaRegionFieldModel, DisplayChinaRegionFieldModel } from '../client-v2/models';

export class PluginFieldChinaRegionClient extends Plugin {
  async load() {
    this.app.addScopes({
      useChinaRegionDataSource,
      useChinaRegionLoadData,
    });
    this.app.dataSourceManager.addFieldInterfaces([ChinaRegionFieldInterface]);
    this.flowEngine.registerModels({
      ChinaRegionFieldModel,
      DisplayChinaRegionFieldModel,
    });
  }
}

export { ChinaRegionFieldModel, DisplayChinaRegionFieldModel } from '../client-v2/models';
export default PluginFieldChinaRegionClient;
