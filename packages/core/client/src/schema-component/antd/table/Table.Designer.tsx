import React from 'react';
import { useCollection } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettingsRemove } from '../../../schema-settings';

export const TableDesigner = () => {
  const { name, title } = useCollection();
  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
