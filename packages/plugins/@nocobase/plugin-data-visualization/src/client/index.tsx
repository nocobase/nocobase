import { Plugin } from '@nocobase/client';
import { DataVisualization } from './DataVisualization';
import { ChartGroup } from './chart/group';
import g2plot from './chart/g2plot';
import antd from './chart/antd';
import { ChartV2Block, ChartV2BlockDesigner, ChartV2BlockInitializer } from './block';
import { ChartRenderer, ChartRendererProvider } from './renderer';

class DataVisualizationPlugin extends Plugin {
  public charts: ChartGroup = new ChartGroup();

  async load() {
    this.charts.setGroup('Built-in', [...g2plot, ...antd]);

    this.app.addComponents({
      ChartV2BlockInitializer,
      ChartRenderer,
      ChartV2BlockDesigner,
      ChartV2Block,
      ChartRendererProvider,
    });
    this.app.addProvider(DataVisualization);
  }
}

export default DataVisualizationPlugin;
export { Chart } from './chart/chart';
export type { ChartType } from './chart/chart';
