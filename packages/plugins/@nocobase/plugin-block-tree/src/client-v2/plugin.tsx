/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { treeConnectDataBlocks } from './models/treeConnectDataBlocks';

export class PluginBlockTreeClient extends Plugin {
  async load() {
    this.flowEngine.registerActions({
      treeConnectDataBlocks,
    });

    this.flowEngine.registerModelLoaders({
      TreeActionGroupModel: {
        loader: () => import('./models/TreeBlockModel'),
      },
      TreeBlockModel: {
        loader: () => import('./models/TreeBlockModel'),
      },
      TreeFilterBlockMenuModel: {
        loader: () => import('./models/TreeFilterBlockMenuModel'),
      },
      TreeTitleFieldSettingsModel: {
        loader: () => import('./models/TreeBlockModel'),
      },
    });
  }
}

export default PluginBlockTreeClient;
