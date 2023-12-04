import { CollectionManagerProvider, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CustomRequestConfigurationFieldsSchema } from './schemas';
import { CustomRequestAction } from './components';
import { CustomRequestInitializer } from './initializer';
import { customRequestActionSettings } from './components/CustomRequestActionDesigner';

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
  async load() {
    this.app.use(CustomRequestProvider);
    this.app.schemaSettingsManager.add(customRequestActionSettings);
  }
}

export default CustomRequestPlugin;
