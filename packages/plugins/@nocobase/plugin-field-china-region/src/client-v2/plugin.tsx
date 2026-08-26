/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { ChinaRegionFieldInterface } from './chinaRegion';

export class PluginFieldChinaRegionClient extends Plugin<any, Application> {
  async load() {
    this.app.addFieldInterfaces([ChinaRegionFieldInterface]);
    this.flowEngine.registerModelLoaders({
      ChinaRegionFieldModel: {
        loader: () => import('./models/ChinaRegionFieldModel'),
      },
      DisplayChinaRegionFieldModel: {
        loader: () => import('./models/DisplayChinaRegionFieldModel'),
      },
    });
  }
}

export default PluginFieldChinaRegionClient;
