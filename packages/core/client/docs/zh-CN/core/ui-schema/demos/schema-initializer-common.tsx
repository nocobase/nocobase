import { ApplicationOptions, Grid, Plugin, SchemaComponent } from '@nocobase/client';
import React from 'react';

const HelloPage = () => {
  return (
    <div>
      <SchemaComponent
        schema={{
          name: 'root',
          type: 'void',
          'x-component': 'Grid',
          'x-initializer': 'MyInitializer',
          properties: {},
        }}
      />
    </div>
  );
};

class PluginHello extends Plugin {
  async load() {
    this.app.addComponents({ Grid });
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
  plugins: [PluginHello],
};

export { appOptions };
