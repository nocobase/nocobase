/**
 * defaultShowCode: true
 */
import { Application, SchemaInitializer } from '@nocobase/client';
import { appOptions } from './schema-initializer-common';

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      type: 'item',
      title: 'Demo A',
    },
    {
      name: 'b',
      type: 'item',
      title: 'Demo B',
      useVisible() {
        return false;
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
});

export default app.getRootComponent();
