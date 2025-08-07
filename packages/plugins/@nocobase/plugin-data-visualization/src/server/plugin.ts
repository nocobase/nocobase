/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import { InstallOptions, Plugin } from '@nocobase/server';
import { query } from './actions/query';
import PluginAIServer from '@nocobase/plugin-ai';
import { buildChartBlock } from './ai/tools/build-chart-block';

export class PluginDataVisualizationServer extends Plugin {
  cache: Cache;

  afterAdd() {}

  beforeLoad() {
    this.app.resourceManager.define({
      name: 'charts',
      actions: {
        query,
      },
    });
    this.app.acl.allow('charts', 'query', 'loggedIn');
  }

  async load() {
    this.cache = await this.app.cacheManager.createCache({
      name: 'data-visualization',
      store: 'memory',
      ttl: 30 * 1000, // millseconds
      max: 1000,
    });

    const ai = this.app.pm.get('ai') as PluginAIServer;
    if (ai) {
      ai.aiManager.toolManager.registerTools([
        {
          groupName: 'frontend',
          tool: buildChartBlock,
        },
      ]);
    }
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginDataVisualizationServer;
