import { Collection, useDesignable } from '@nocobase/client';
import React from 'react';
import { ChartConfigContext, ChartConfigCurrent, ChartConfigure } from './ChartConfigure';

export const ChartV2Block: React.FC<{
  collection: Collection;
}> = (props) => {
  const { insertAdjacent } = useDesignable();
  const [visible, setVisible] = React.useState(false);
  const [current, setCurrent] = React.useState<ChartConfigCurrent>({} as any);
  const [data, setData] = React.useState<string>();
  return (
    <ChartConfigContext.Provider value={{ visible, setVisible, current, setCurrent, data, setData }}>
      {props.children}
      <ChartConfigure insert={(schema, options) => insertAdjacent('beforeEnd', schema, options)} />
    </ChartConfigContext.Provider>
  );
};
