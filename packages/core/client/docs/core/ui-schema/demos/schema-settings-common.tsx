import { ApplicationOptions, CardItem, Grid, Plugin, SchemaComponent } from '@nocobase/client';
import React from 'react';

const Hello = () => {
  return <h1>Hello, world!</h1>;
};

const HelloPage = () => {
  return (
    <div>
      <SchemaComponent
        schema={{
          name: 'root',
          type: 'void',
          'x-component': 'Grid',
          properties: {
            hello: Grid.wrap({
              type: 'void',
              'x-settings': 'mySettings',
              'x-decorator': 'CardItem',
              'x-component': 'Hello',
            }),
          },
        }}
      />
    </div>
  );
};

class PluginHello extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/',
      Component: HelloPage,
    });
  }
}

const appOptions: ApplicationOptions = {
  router: {
    type: 'memory',
  },
  designable: true,
  components: { Grid, CardItem, Hello },
  plugins: [PluginHello],
};

export { appOptions };
