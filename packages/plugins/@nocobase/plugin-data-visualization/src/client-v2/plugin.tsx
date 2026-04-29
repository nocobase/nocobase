/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

import { ChartGroup } from './chart';

export class PluginDataVisualizationClient extends Plugin {
  public charts = new ChartGroup();

  async load() {
    this.flowEngine.registerModelLoaders({
      ChartBlockModel: {
        loader: () => import('./flow/models/ChartBlockModel'),
      },
    });
  }
}

export { PluginDataVisualizationClient as PluginDataVisualiztionClient };

export default PluginDataVisualizationClient;
