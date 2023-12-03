/**
 * defaultShowCode: true
 */
import { Application, SchemaSettings } from '@nocobase/client';
import { appOptions } from './schema-settings-common';

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn(s) {
          return s['x-component'] === 'Grid'; // 其顶级是 Grid，这一层级不能删
        },
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

export default app.getRootComponent();
