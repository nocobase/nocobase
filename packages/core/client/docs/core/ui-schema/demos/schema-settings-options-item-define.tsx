/**
 * defaultShowCode: true
 */
import React from 'react';
import { Application, SchemaSettings, SchemaSettingsItem } from '@nocobase/client';
import { appOptions } from './schema-settings-common';

const Demo = () => {
  // 最终渲染 `SchemaInitializerItem`
  return <SchemaSettingsItem title="Component Demo" />;
};

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'a',
      Component: Demo, // 通过 Component 定义
    },
    {
      name: 'b',
      type: 'item', // 通过 `type` 定义，底层对应着 `SchemaInitializerItem` 组件
      componentProps: {
        title: 'type Demo',
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

export default app.getRootComponent();
