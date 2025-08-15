import { Plugin } from '@nocobase/client';
import echarts from './echarts';
import PluginDataVisualiztionClient from '@nocobase/plugin-data-visualization/src/client';

export class PluginEchartsClient extends Plugin {
  async load() {
    const dataVisualizationPlugin = this.app.pluginManager.get('data-visualization') as PluginDataVisualiztionClient;
    if (dataVisualizationPlugin) {
      dataVisualizationPlugin.charts.addGroup('echarts', { title: 'ECharts', charts: echarts });
    }
  }
}

export default PluginEchartsClient;
