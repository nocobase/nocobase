import React from 'react';

import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '../../application';

export const G2PlotInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      {...itemConfig}
      onClick={() => {
        insert({
          ...itemConfig.schema,
        });
      }}
    />
  );
};
