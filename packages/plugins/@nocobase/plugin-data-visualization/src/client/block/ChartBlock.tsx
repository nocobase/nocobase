import { SchemaComponentOptions, SchemaInitializerButtonContext } from '@nocobase/client';
import React, { useState } from 'react';
import { ChartConfigProvider } from '../configure';
import { ChartDataProvider } from './ChartDataProvider';
import { ChartRenderer, ChartRendererProvider } from '../renderer';
import { ChartFilterBlockProvider, ChartFilterBlockDesigner } from '../filter';
import { ChartFilterProvider } from '../filter/FilterProvider';

export const ChartV2Block: React.FC = (props) => {
  const [initialVisible, setInitialVisible] = useState(false);
  return (
    <SchemaInitializerButtonContext.Provider value={{ visible: initialVisible, setVisible: setInitialVisible }}>
      <SchemaComponentOptions
        components={{ ChartRenderer, ChartRendererProvider, ChartFilterBlockProvider, ChartFilterBlockDesigner }}
      >
        <ChartDataProvider>
          <ChartFilterProvider>
            <ChartConfigProvider>{props.children}</ChartConfigProvider>
          </ChartFilterProvider>
        </ChartDataProvider>
      </SchemaComponentOptions>
    </SchemaInitializerButtonContext.Provider>
  );
};
