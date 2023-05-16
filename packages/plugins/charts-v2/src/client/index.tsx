import { SchemaComponentOptions, SchemaInitializerContext, SchemaInitializerProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartBlockInitializer as ChartV2BlockInitializer } from './ChartBlockInitializer';

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
    <SchemaComponentOptions components={{ ChartV2BlockInitializer }}>
      <SchemaInitializerProvider initializers={initializers}>{props.children}</SchemaInitializerProvider>
    </SchemaComponentOptions>
  );
};

export default Chart;
