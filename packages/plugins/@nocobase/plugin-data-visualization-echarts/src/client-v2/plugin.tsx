/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import PluginDataVisualizationClient from '@nocobase/plugin-data-visualization/client-v2';

import echarts from './charts';

export class PluginDataVisualizationEChartsClient extends Plugin {
  async load() {
    const plugin = this.app.pm.get(PluginDataVisualizationClient as any) as PluginDataVisualizationClient;
    if (!plugin) {
      return;
    }

    plugin.charts.addGroup('echarts', {
      title: 'ECharts',
      charts: echarts,
      sort: -1,
    });
  }
}

export default PluginDataVisualizationEChartsClient;
