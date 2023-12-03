/**
 * defaultShowCode: true
 */
import React, { ReactNode } from 'react';
import { Application, SchemaInitializer, SchemaInitializerItem, useSchemaInitializerItem } from '@nocobase/client';
import { appOptions } from './schema-initializer-common';
import { TableOutlined } from '@ant-design/icons';

const Demo = () => {
  const { name, foo, icon } = useSchemaInitializerItem<{ name: string; foo: string; icon: ReactNode }>();

  return <SchemaInitializerItem icon={icon} title={`${name} - ${foo}`} />;
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      foo: 'bar',
      icon: <TableOutlined />,
      Component: Demo,
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
});

export default app.getRootComponent();
