/**
 * defaultShowCode: true
 */
import React from 'react';
import { Application, SchemaInitializer, SchemaInitializerItem } from '@nocobase/client';
import { appOptions } from './schema-initializer-common';

const CommonDemo = (props) => {
  return <SchemaInitializerItem title={props.title} />;
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  items: [
    {
      name: 'a',
      Component: CommonDemo,
      componentProps: {
        title: 'componentProps',
      },
    },
    {
      name: 'b',
      Component: CommonDemo,
      useComponentProps() {
        return {
          title: 'useComponentProps',
        };
      },
    },
  ],
});

const app = new Application({
  ...appOptions,
  schemaInitializers: [myInitializer],
});

export default app.getRootComponent();
