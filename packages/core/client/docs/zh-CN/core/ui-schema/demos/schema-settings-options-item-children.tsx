/**
 * defaultShowCode: true
 */
import { Application, SchemaSettings } from '@nocobase/client';
import { appOptions } from './schema-settings-common';

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'a',
      type: 'itemGroup',
      componentProps: {
        title: '静态 children',
      },
      children: [
        {
          name: 'a1',
          type: 'item',
          componentProps: {
            title: 'A 1',
            onClick: () => {
              alert('a-1');
            },
          },
        },
        {
          name: 'a2',
          type: 'item',
          componentProps: {
            title: 'A 2',
          },
        },
      ],
    },
    {
      name: 'b',
      type: 'itemGroup',
      componentProps: {
        title: '动态 children',
      },
      useChildren() {
        return [
          {
            name: 'a1',
            type: 'item',
            componentProps: {
              title: 'A 1',
            },
            onClick: () => {
              alert('a-1');
            },
          },
          {
            name: 'a2',
            type: 'item',
            componentProps: {
              title: 'A 2',
            },
          },
        ];
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

export default app.getRootComponent();
