import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const AssociationFieldsFilterDesigner = (props) => {
  return (
    <GeneralSchemaDesigner {...props} disableInitializer={true} draggable={false}>
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
