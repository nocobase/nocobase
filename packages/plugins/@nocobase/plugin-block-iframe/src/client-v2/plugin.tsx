/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';

export class PluginBlockIframeClient extends Plugin<any, Application> {
  async load() {
    this.flowEngine.registerModelLoaders({
      IframeBlockModel: {
        loader: () => import('./models/IframeBlockModel'),
      },
    });
  }
}

export default PluginBlockIframeClient;
