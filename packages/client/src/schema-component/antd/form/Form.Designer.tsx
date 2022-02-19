import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const FormDesigner = () => {
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};
