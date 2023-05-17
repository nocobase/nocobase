import { GeneralSchemaDesigner, SchemaSettings } from '@nocobase/client';
import React from 'react';

export const ChartBlockDesigner: React.FC = () => {
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.BlockTitleItem />
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
