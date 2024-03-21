import { Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CustomRequestAction } from './components';
import { customRequestActionSettings } from './components/CustomRequestActionDesigner';
import { CustomRequestInitializer } from './initializer';
import { customizeCustomRequestActionSettings } from './schemaSettings';
import { CustomRequestConfigurationFieldsSchema } from './schemas';

const CustomRequestProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      scope={{
        CustomRequestConfigurationFieldsSchema,
      }}
      components={{ CustomRequestAction, CustomRequestInitializer }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};

export class CustomRequestPlugin extends Plugin {
  async load() {
    this.app.use(CustomRequestProvider);
    this.app.schemaSettingsManager.add(customizeCustomRequestActionSettings);

    // @deprecated
    this.app.schemaSettingsManager.add(customRequestActionSettings);
  }
}

export default CustomRequestPlugin;
