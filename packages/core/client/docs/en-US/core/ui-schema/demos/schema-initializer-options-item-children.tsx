/**
 * defaultShowCode: true
 */
import { Application, SchemaInitializer, SchemaInitializerItem } from '@nocobase/client';
import { appOptions } from './schema-initializer-common';

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      type: 'itemGroup',
      title: '静态 children',
      children: [
        {
          name: 'a1',
          type: 'item',
          title: 'A 1',
          onClick: () => {
            alert('a-1');
          },
        },
        {
          name: 'a2',
          type: 'item',
          title: 'A 2',
        },
      ],
    },
    {
      name: 'a',
      type: 'itemGroup',
      title: '动态 children',
      useChildren() {
        return [
          {
            name: 'a1',
            type: 'item',
            title: 'A 1',
            onClick: () => {
              alert('a-1');
            },
          },
          {
            name: 'a2',
            type: 'item',
            title: 'A 2',
          },
        ];
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
});

export default app.getRootComponent();
