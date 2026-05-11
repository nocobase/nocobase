/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

export class PluginBlockListClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      ListBlockModel: {
        loader: () => import('./models/ListBlockModel'),
      },
      ListItemModel: {
        loader: () => import('./models/ListItemModel'),
      },
    });
  }
}

export default PluginBlockListClient;
