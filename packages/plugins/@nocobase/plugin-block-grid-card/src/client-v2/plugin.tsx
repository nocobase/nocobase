/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

export class PluginBlockGridCardClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      GridCardBlockModel: {
        loader: () => import('./models/GridCardBlockModel'),
      },
      GridCardItemModel: {
        loader: () => import('./models/GridCardItemModel'),
      },
    });
  }
}

export default PluginBlockGridCardClient;
