import { Plugin } from '@nocobase/client';
import echarts from './echarts';
import PluginDataVisualiztionClient from '@nocobase/plugin-data-visualization/client';

export class PluginDataVisualizationEChartsClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() { }

  // You can get and modify the app instance here
  async load() {
    const plugin = this.app.pm.get(PluginDataVisualiztionClient);
    plugin.charts.addGroup('echarts', { title: 'ECharts', charts: echarts, sort: -1 });

    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginDataVisualizationEChartsClient;
