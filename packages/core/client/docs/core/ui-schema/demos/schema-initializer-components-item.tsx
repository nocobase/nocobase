/**
 * defaultShowCode: true
 */
import {
  Grid,
  SchemaInitializer,
  useSchemaInitializer,
  SchemaInitializerItem,
  CardItem,
  Application,
} from '@nocobase/client';
import React from 'react';
import { appOptions } from './schema-initializer-common';
import { useFieldSchema } from '@formily/react';

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  wrap: Grid.wrap,
  items: [
    {
      name: 'demo1',
      Component: () => {
        const { insert } = useSchemaInitializer();
        const handleClick = () => {
          insert({
            type: 'void',
            'x-decorator': 'CardItem',
            'x-component': 'Hello',
          });
        };
        return <SchemaInitializerItem title={'Demo1'} onClick={handleClick}></SchemaInitializerItem>;
      },
    },
  ],
});

const Hello = () => {
  const schema = useFieldSchema();
  return <h1>Hello, world! {schema.name}</h1>;
};

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
  components: { CardItem, Hello },
});

export default app.getRootComponent();
