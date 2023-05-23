import { Collection, useDesignable } from '@nocobase/client';
import React from 'react';
import { ChartConfigContext, ChartConfigure } from './ChartConfigure';
import { ISchema } from '@formily/react';

export const ChartV2Block: React.FC<{
  collection: Collection;
}> = (props) => {
  const { insertAdjacent } = useDesignable();
  const [visible, setVisible] = React.useState(false);
  const [current, setCurrent] = React.useState<{
    schema: ISchema;
    field: any;
  }>({} as any);
  return (
    <ChartConfigContext.Provider value={{ visible, setVisible, current, setCurrent }}>
      {props.children}
      <ChartConfigure insert={(schema, options) => insertAdjacent('beforeEnd', schema, options)} />
    </ChartConfigContext.Provider>
  );
};
