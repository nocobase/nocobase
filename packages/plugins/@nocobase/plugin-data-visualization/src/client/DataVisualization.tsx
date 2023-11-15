import { SchemaInitializerContext, SchemaInitializerProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartInitializers } from './block';
import { useChartsTranslation } from './locale';

export const DataVisualization: React.FC = (props) => {
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
    <SchemaInitializerProvider initializers={{ ...initializers, ChartInitializers }}>
      {props.children}
    </SchemaInitializerProvider>
  );
};
