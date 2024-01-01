import React from 'react';
import { GeneralSchemaDesigner, SchemaSettingsRemove } from '../../../schema-settings';
import { useCollectionV2 } from '../../../application';

export const TableDesigner = () => {
  const collection = useCollectionV2();
  return (
    <GeneralSchemaDesigner title={collection.title || collection.name}>
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
