import React from 'react';

import { SchemaInitializerItem, useSchemaInitializer } from '../../application';

export const G2PlotInitializer = (props) => {
  const { item, ...others } = props;
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      {...others}
      onClick={() => {
        insert({
          ...item.schema,
        });
      }}
    />
  );
};
