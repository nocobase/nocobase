import { SchemaComponentOptions, SchemaInitializerContext, SchemaInitializerProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartV2BlockInitializer, ChartV2BlockDesigner, ChartInitializers, ChartV2Block } from './block';
import { ChartRenderer } from './renderer';

const Chart: React.FC = (props) => {
  const initializers = useContext(SchemaInitializerContext);
  const children = initializers.BlockInitializers.items[0].children;
  const has = children.some((initializer) => initializer.title === 'ChartV2');
  if (!has) {
    children.push({
      key: 'chart-v2',
      type: 'item',
      title: 'ChartV2',
      component: 'ChartV2BlockInitializer',
    });
  }
  return (
    <SchemaComponentOptions components={{ ChartV2BlockInitializer, ChartRenderer, ChartV2BlockDesigner, ChartV2Block }}>
      <SchemaInitializerProvider initializers={{ ...initializers, ChartInitializers }}>
        {props.children}
      </SchemaInitializerProvider>
    </SchemaComponentOptions>
  );
};

export default Chart;
