import { CollectionManagerProvider, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CustomRequestConfigurationFieldsSchema } from './schemas';
import { CustomRequestAction } from './components';
import { CustomRequestInitializer } from './initializer';

const CustomRequestProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      scope={{
        CustomRequestConfigurationFieldsSchema,
      }}
      components={{ CustomRequestAction, CustomRequestInitializer }}
    >
      <CollectionManagerProvider>{props.children}</CollectionManagerProvider>
    </SchemaComponentOptions>
  );
};

export class CustomRequestPlugin extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.use(CustomRequestProvider);
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default CustomRequestPlugin;
