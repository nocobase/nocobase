import { Plugin } from '@nocobase/client';
import DataVisualizationPlugin from '@nocobase/plugin-data-visualization/client';
import echarts from './echarts';

export class PluginSampleAddCustomChartClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {
    const plugin = this.app.pm.get(DataVisualizationPlugin);
    plugin.charts.addGroup('ECharts', echarts);
  }

  // You can get and modify the app instance here
  async load() {}
}

export default PluginSampleAddCustomChartClient;
