import React from 'react';

import { InitializerItem } from '../../application';

export const G2PlotInitializer = (props) => {
  const { item, insert, ...others } = props;
  return (
    <InitializerItem
      {...others}
      onClick={() => {
        insert({
          ...item.schema,
        });
      }}
    />
  );
};
