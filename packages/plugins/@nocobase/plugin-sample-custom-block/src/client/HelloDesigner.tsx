import { GeneralSchemaDesigner, SchemaSettingsRemove, useCollectionV2 } from '@nocobase/client';
import React from 'react';

export const HelloDesigner = () => {
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
