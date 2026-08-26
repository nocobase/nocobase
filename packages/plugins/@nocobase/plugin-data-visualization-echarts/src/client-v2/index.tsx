/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { createECharts } from './echarts';
import PluginDataVisualiztionClient from '@nocobase/plugin-data-visualization/client-v2';

export class PluginDataVisualizationEChartsClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    const plugin = this.app.pm.get(PluginDataVisualiztionClient as any) as PluginDataVisualiztionClient;
    const namespace = this.options.packageName || '@nocobase/plugin-data-visualization-echarts';
    const t = (key: string) => this.app.i18n.t(key, { ns: [namespace, 'data-visualization', 'client'] });
    const echarts = createECharts(t);
    plugin.charts.addGroup('echarts', { title: 'ECharts', charts: echarts, sort: -1 });

    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginDataVisualizationEChartsClient;
