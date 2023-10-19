import { SchemaInitializerButtonContext } from '@nocobase/client';
import React, { useState } from 'react';
import { ChartConfigProvider } from '../configure';
import { ChartDataProvider } from './ChartDataProvider';

export const ChartV2Block: React.FC = (props) => {
  const [initialVisible, setInitialVisible] = useState(false);
  return (
    <SchemaInitializerButtonContext.Provider value={{ visible: initialVisible, setVisible: setInitialVisible }}>
      <ChartDataProvider>
        <ChartConfigProvider>{props.children}</ChartConfigProvider>
      </ChartDataProvider>
    </SchemaInitializerButtonContext.Provider>
  );
};
