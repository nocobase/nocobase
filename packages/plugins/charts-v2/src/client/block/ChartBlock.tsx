import { Collection, useDesignable } from '@nocobase/client';
import React from 'react';
import { ChartConfigContext, ChartConfigure } from './ChartConfigure';

export const ChartV2Block: React.FC<{
  collection: Collection;
}> = (props) => {
  const { insertAdjacent } = useDesignable();
  const [visible, setVisible] = React.useState(false);
  return (
    <ChartConfigContext.Provider value={{ visible, setVisible }}>
      {props.children}
      <ChartConfigure insert={(schema, options) => insertAdjacent('beforeEnd', schema, options)} />
    </ChartConfigContext.Provider>
  );
};
