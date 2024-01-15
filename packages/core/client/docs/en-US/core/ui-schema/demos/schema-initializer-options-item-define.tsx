/**
 * defaultShowCode: true
 */
import React from 'react';
import { Application, SchemaInitializer, SchemaInitializerItem } from '@nocobase/client';
import { appOptions } from './schema-initializer-common';

const Demo = () => {
  // 最终渲染 `SchemaInitializerItem`
  return <SchemaInitializerItem title="Component Demo" />;
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      Component: Demo, // 通过 Component 定义
    },
    {
      name: 'b',
      type: 'item', // 通过 `type` 定义，底层对应着 `SchemaInitializerItem` 组件
      title: 'type Demo',
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
});

export default app.getRootComponent();
