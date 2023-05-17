import { SchemaComponentOptions, SchemaInitializerContext, SchemaInitializerProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartRendererInitializer, ChartRenderer, ChartBlockDesigner } from './renderer';

const Chart: React.FC = (props) => {
  const initializers = useContext(SchemaInitializerContext);
  const children = initializers.BlockInitializers.items[0].children;
  const has = children.some((initializer) => initializer.title === 'ChartV2');
  if (!has) {
    children.push({
      key: 'chart-v2',
      type: 'item',
      title: 'ChartV2',
      component: 'ChartRendererInitializer',
    });
  }
  return (
    <SchemaComponentOptions components={{ ChartRendererInitializer, ChartRenderer, ChartBlockDesigner }}>
      <SchemaInitializerProvider initializers={initializers}>{props.children}</SchemaInitializerProvider>
    </SchemaComponentOptions>
  );
};

export default Chart;
