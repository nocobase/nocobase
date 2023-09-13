import { Plugin, SchemaComponentOptions, SchemaInitializerContext, SchemaInitializerProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartInitializers, ChartV2Block, ChartV2BlockDesigner, ChartV2BlockInitializer } from './block';
import { useChartsTranslation } from './locale';
import { ChartRenderer, ChartRendererProvider } from './renderer';
import { ChartLibraryProvider } from './chart/library';
import g2plot from './chart/g2plot';
import antd from './chart/antd';

const DataVisualization: React.FC = (props) => {
  const { t } = useChartsTranslation();
  const initializers = useContext<any>(SchemaInitializerContext);
  const children = initializers.BlockInitializers.items[0].children;
  const has = children.some((initializer) => initializer.component === 'ChartV2BlockInitializer');
  if (!has) {
    children.push({
      key: 'chart-v2',
      type: 'item',
      title: t('Charts'),
      component: 'ChartV2BlockInitializer',
    });
  }
  return (
    <SchemaComponentOptions
      components={{
        ChartV2BlockInitializer,
        ChartRenderer,
        ChartV2BlockDesigner,
        ChartV2Block,
        ChartRendererProvider,
      }}
    >
      <SchemaInitializerProvider initializers={{ ...initializers, ChartInitializers }}>
        <ChartLibraryProvider name="Built-in" charts={[...g2plot, ...antd]}>
          {props.children}
        </ChartLibraryProvider>
      </SchemaInitializerProvider>
    </SchemaComponentOptions>
  );
};

class DataVisualizationPlugin extends Plugin {
  async load() {
    this.app.addProvider(DataVisualization);
  }
}

export default DataVisualizationPlugin;
export { ChartLibraryProvider };
export { Chart } from './chart/chart';
export type { ChartType } from './chart/chart';
