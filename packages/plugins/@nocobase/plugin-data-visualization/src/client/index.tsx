import { Plugin } from '@nocobase/client';
import { ChartV2Block, ChartV2BlockDesigner, ChartV2BlockInitializer, chartInitializers } from './block';
import antd from './chart/antd';
import g2plot from './chart/g2plot';
import { ChartGroup } from './chart/group';
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
    blockInitializers?.add('dataBlocks.chartV2', {
      title: '{{t("Charts")}}',
      Component: 'ChartV2BlockInitializer',
    });
  }
}

export default DataVisualizationPlugin;
export { Chart } from './chart/chart';
export type { ChartProps, ChartType, RenderProps } from './chart/chart';
export { ChartConfigContext } from './configure/ChartConfigure';
export type { FieldOption } from './hooks';
export type { QueryProps } from './renderer';
