import React from 'react';
import { useCollection } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const FormDesigner = () => {
  const { name, title } = useCollection();
  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettings.Template componentName={'Form'} collectionName={name} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
