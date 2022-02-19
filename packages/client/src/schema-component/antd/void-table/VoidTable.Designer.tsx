import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const VoidTableDesigner = () => {
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};
