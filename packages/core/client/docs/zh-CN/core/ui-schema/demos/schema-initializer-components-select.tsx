/**
 * defaultShowCode: true
 */
import { Grid, SchemaInitializer, Application, SchemaInitializerSelect, useDesignable } from '@nocobase/client';
import React from 'react';
import { appOptions } from './schema-initializer-common';
import { useFieldSchema } from '@formily/react';

const OpenModeSelect = () => {
  const fieldSchema = useFieldSchema();
  const openModeValue = fieldSchema?.['x-component-props']?.['openMode'] || 'drawer';

  const { patch } = useDesignable();
  const handleChange = (value) => {
    // 修改当前节点的 Schema 的属性
    patch({
      'x-component-props': {
        openMode: value,
      },
    });
  };

  return (
    <SchemaInitializerSelect
      title={'Open mode'}
      options={[
        { label: 'Drawer', value: 'drawer' },
        { label: 'Dialog', value: 'modal' },
      ]}
      value={openModeValue}
      onChange={handleChange}
    />
  );
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  wrap: Grid.wrap,
  items: [
    {
      name: 'openMode',
      Component: OpenModeSelect,
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
});

export default app.getRootComponent();
