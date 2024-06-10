import { Application, SchemaInitializer } from '@nocobase/client';
import { appOptions } from '../../core/ui-schema/demos/schema-initializer-common';

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  title: 'Button Text',
  items: [],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
});

export default app;
