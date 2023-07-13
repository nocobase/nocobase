import React from 'react';

import { SchemaInitializer } from '..';

export const G2PlotInitializer = (props) => {
  const { item, insert, ...others } = props;
  return (
    <SchemaInitializer.Item
      {...others}
      onClick={() => {
        insert({
          ...item.schema,
        });
      }}
    />
  );
};
