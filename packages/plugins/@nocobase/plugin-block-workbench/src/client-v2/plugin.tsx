/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

export class PluginBlockWorkbenchClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      ActionPanelBlockModel: {
        loader: () => import('./models/ActionPanelBlockModel'),
      },
      ActionPanelGroupActionModel: {
        loader: () => import('./models/actions/ActionPanelGroupAction'),
      },
      ActionPanelScanActionModel: {
        loader: () => import('./models/actions/ActionPanelScanActionModel'),
      },
    });
  }
}

export default PluginBlockWorkbenchClient;
