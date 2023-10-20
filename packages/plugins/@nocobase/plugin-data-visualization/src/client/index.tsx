import { Plugin } from '@nocobase/client';
import { ChartGroup } from './chart/group';
import g2plot from './chart/g2plot';
import antd from './chart/antd';
import { ChartV2Block, ChartV2BlockDesigner, ChartV2BlockInitializer, chartInitializers } from './block';
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

    this.app.schemaInitializerManager.add(chartInitializers);

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('data-blocks.chart-v2', {
      title: '{{t("Charts")}}',
      Component: 'ChartV2BlockInitializer',
    });
  }
}

export default DataVisualizationPlugin;
export { Chart } from './chart/chart';
export type { ChartType, RenderProps, ChartProps } from './chart/chart';
export type { FieldOption } from './hooks';
export type { QueryProps } from './renderer';
export { ChartConfigContext } from './configure/ChartConfigure';
