import React from 'react';

import { SchemaInitializerItem, useSchemaInitializerV2 } from '../../application';

export const G2PlotInitializer = (props) => {
  const { item, ...others } = props;
  const { insert } = useSchemaInitializerV2();
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
