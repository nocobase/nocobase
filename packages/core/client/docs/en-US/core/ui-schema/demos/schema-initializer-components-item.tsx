/**
 * defaultShowCode: true
 */
import { useFieldSchema } from '@formily/react';
import {
  Application,
  CardItem,
  Grid,
  SchemaInitializer,
  SchemaInitializerItem,
  useSchemaInitializer,
} from '@nocobase/client';
import React from 'react';
import { appOptions } from './schema-initializer-common';

const Demo = () => {
  const { insert } = useSchemaInitializer();
  const handleClick = () => {
    insert({
      type: 'void',
      'x-decorator': 'CardItem',
      'x-component': 'Hello',
    });
  };
  return <SchemaInitializerItem title={'Demo-组件方式定义'} onClick={handleClick}></SchemaInitializerItem>;
};

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  title: 'Button Text',
  wrap: Grid.wrap,
  items: [
    {
      name: 'demo1',
      Component: Demo,
    },
    {
      name: 'demo2',
      type: 'item',
      useComponentProps() {
        const { insert } = useSchemaInitializer();
        const handleClick = () => {
          insert({
            type: 'void',
            'x-decorator': 'CardItem',
            'x-component': 'Hello',
          });
        };

        return {
          title: 'type 方式定义',
          onClick: handleClick,
        };
      },
    },
    {
      name: 'demo3',
      title: 'with items',
      type: 'item',
      onClick(args) {
        console.log(args);
      },
      items: [
        {
          label: 'aaa',
          value: 'aaa',
        },
        {
          label: 'bbb',
          value: 'bbb',
        },
      ],
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
