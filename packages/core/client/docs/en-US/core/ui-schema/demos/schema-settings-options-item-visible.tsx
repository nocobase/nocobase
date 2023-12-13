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
      type: 'item',
      componentProps: {
        title: 'Demo A',
      },
    },
    {
      name: 'b',
      type: 'item',
      componentProps: {
        title: 'Demo B',
      },
      useVisible() {
        return false;
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

export default app.getRootComponent();
