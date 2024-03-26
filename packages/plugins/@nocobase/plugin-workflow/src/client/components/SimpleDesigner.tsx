import React from 'react';
import { useFieldSchema } from '@formily/react';

import {
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
  useCompile,
} from '@nocobase/client';

export function SimpleDesigner() {
  const schema = useFieldSchema();
  const compile = useCompile();
  return (
    <GeneralSchemaDesigner title={compile(schema.title)}>
      <SchemaSettingsBlockTitleItem />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
}
