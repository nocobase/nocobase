import React from 'react';
import { GeneralSchemaDesigner, SchemaSettingsRemove } from '../../../schema-settings';

export const TableArrayDesigner = () => {
  return (
    <GeneralSchemaDesigner>
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
