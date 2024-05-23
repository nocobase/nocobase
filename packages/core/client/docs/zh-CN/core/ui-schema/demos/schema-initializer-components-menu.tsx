/**
 * defaultShowCode: true
 */
import { Application, SchemaInitializer, SchemaInitializerSubMenu } from '@nocobase/client';
import React from 'react';
import { appOptions } from './schema-initializer-common';

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      title: 'A subMenu',
      type: 'subMenu',
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
      title: 'B subMenu',
      type: 'subMenu',
      children: [
        {
          name: 'a1',
          type: 'item',
          title: 'B1',
        },
        {
          name: 'a2',
          type: 'item',
          title: 'B2',
        },
      ],
    },
    {
      name: 'c',
      Component: () => {
        return (
          <SchemaInitializerSubMenu
            name={'c'}
            title="C subMenu"
            items={[
              {
                name: 'c1',
                type: 'item',
                title: 'C1',
              },
            ]}
          />
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
