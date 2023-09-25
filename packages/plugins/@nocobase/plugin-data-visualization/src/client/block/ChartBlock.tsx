import { SchemaInitializerButtonContext, useDesignable } from '@nocobase/client';
import React, { useState } from 'react';
import { ChartRendererProvider } from '../renderer';
import { ChartConfigContext, ChartConfigCurrent, ChartConfigure } from '../configure/ChartConfigure';

export const ChartV2Block: React.FC = (props) => {
  const { insertAdjacent } = useDesignable();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ChartConfigCurrent>({} as any);
  const [initialVisible, setInitialVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  return (
    <SchemaInitializerButtonContext.Provider
      value={{ visible: initialVisible, setVisible: setInitialVisible, searchValue, setSearchValue }}
    >
      <ChartConfigContext.Provider value={{ visible, setVisible, current, setCurrent }}>
        {props.children}
        <ChartRendererProvider {...current.field?.decoratorProps}>
          <ChartConfigure insert={(schema, options) => insertAdjacent('beforeEnd', schema, options)} />
        </ChartRendererProvider>
      </ChartConfigContext.Provider>
    </SchemaInitializerButtonContext.Provider>
  );
};
