import React from 'react';

import { SchemaInitializerItem } from '../../application';

export const G2PlotInitializer = (props) => {
  const { item, insert, ...others } = props;
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
