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
        title: 'group A',
      },
      children: [
        {
          name: 'a1',
          type: 'item',
          componentProps: {
            title: 'A1',
          },
        },
        {
          name: 'a2',
          type: 'item',
          componentProps: {
            title: 'A2',
          },
        },
      ],
    },
    {
      name: 'b',
      type: 'itemGroup',
      componentProps: {
        title: 'group B',
      },
      children: [
        {
          name: 'b1',
          type: 'item',
          componentProps: {
            title: 'B1',
          },
        },
        {
          name: 'b2',
          type: 'item',
          componentProps: {
            title: 'B2',
          },
        },
      ],
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

export default app.getRootComponent();
