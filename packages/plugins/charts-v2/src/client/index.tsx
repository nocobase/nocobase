import { SchemaComponentOptions, SchemaInitializerContext, SchemaInitializerProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartV2BlockInitializer, ChartV2BlockDesigner, ChartInitializers, ChartV2Block } from './block';
import { ChartRenderer, ChartRendererProvider, InternalLibrary } from './renderer';
import { ChartLibraryProvider } from './renderer/ChartLibrary';
import { useChartsTranslation } from './locale';

const Chart: React.FC = (props) => {
  const { t } = useChartsTranslation();
  const initializers = useContext(SchemaInitializerContext);
  const children = initializers.BlockInitializers.items[0].children;
  const has = children.some((initializer) => initializer.component === 'ChartV2BlockInitializer');
  if (!has) {
    children.push({
      key: 'chart-v2',
      type: 'item',
      title: t('ChartV2'),
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
        <ChartLibraryProvider name="Built-in" charts={InternalLibrary}>
          {props.children}
        </ChartLibraryProvider>
      </SchemaInitializerProvider>
    </SchemaComponentOptions>
  );
};

export default Chart;
export { ChartLibraryProvider };
