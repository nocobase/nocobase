import { GeneralSchemaDesigner, SchemaSettingsRemove, useCollection } from '@nocobase/client';
import React from 'react';

export const HelloDesigner = () => {
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
