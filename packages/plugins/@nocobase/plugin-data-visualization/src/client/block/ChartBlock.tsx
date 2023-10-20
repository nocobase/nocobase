import { SchemaComponentOptions, SchemaInitializerButtonContext } from '@nocobase/client';
import React, { useState } from 'react';
import { ChartConfigProvider } from '../configure';
import { ChartDataProvider } from './ChartDataProvider';
import { ChartRenderer, ChartRendererProvider } from '../renderer';
import { ChartFilterBlockProvider, ChartFilterBlockDesigner } from '../filter';

export const ChartV2Block: React.FC = (props) => {
  const [initialVisible, setInitialVisible] = useState(false);
  return (
    <SchemaInitializerButtonContext.Provider value={{ visible: initialVisible, setVisible: setInitialVisible }}>
      <SchemaComponentOptions
        components={{ ChartRenderer, ChartRendererProvider, ChartFilterBlockProvider, ChartFilterBlockDesigner }}
      >
        <ChartDataProvider>
          <ChartConfigProvider>{props.children}</ChartConfigProvider>
        </ChartDataProvider>
      </SchemaComponentOptions>
    </SchemaInitializerButtonContext.Provider>
  );
};
