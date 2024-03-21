import { Application, SchemaInitializer, SchemaInitializerItemGroup } from '@nocobase/client';
import { appOptions } from './schema-initializer-common';
import React from 'react';

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      title: 'A Group Title',
      type: 'itemGroup',
      children: [
        {
          name: 'a1',
          type: 'item',
          title: 'A1',
        },
        {
          name: 'a2',
          type: 'item',
          title: 'A2',
        },
      ],
    },
    {
      name: 'b',
      title: 'B Group Title',
      type: 'itemGroup',
      divider: true, // 渲染分割线
      useChildren() {
        // 动态子元素
        return [
          {
            name: 'b1',
            type: 'item',
            title: 'B1',
          },
          {
            name: 'b2',
            type: 'item',
            title: 'B2',
          },
        ];
      },
    },
    {
      name: 'c',
      Component: () => {
        return (
          <SchemaInitializerItemGroup title="C Group Title">
            {[
              {
                name: 'c1',
                type: 'item',
                title: 'C1',
              },
            ]}
          </SchemaInitializerItemGroup>
        );
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
});

export default app.getRootComponent();
