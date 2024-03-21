import React from 'react';
import { useCollection_deprecated } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettingsRemove } from '../../../schema-settings';

export const TableDesigner = () => {
  const { name, title } = useCollection_deprecated();
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
