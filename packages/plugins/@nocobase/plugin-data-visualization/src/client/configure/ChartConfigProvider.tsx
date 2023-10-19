import { ISchema } from '@formily/react';
import React, { createContext, useState } from 'react';
import { ChartRendererProvider } from '../renderer';
import { ChartConfigure } from './ChartConfigure';
import { useDesignable } from '@nocobase/client';

export type ChartConfigCurrent = {
  schema: ISchema;
  field: any;
  collection: string;
  service: any;
  initialValues?: any;
  data: any[];
};

export const ChartConfigContext = createContext<{
  visible: boolean;
  setVisible?: (visible: boolean) => void;
  current?: ChartConfigCurrent;
  setCurrent?: (current: ChartConfigCurrent) => void;
}>({
  visible: true,
});

export const ChartConfigProvider: React.FC = (props) => {
  const { insertAdjacent } = useDesignable();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ChartConfigCurrent>({} as any);
  return (
    <ChartConfigContext.Provider value={{ visible, setVisible, current, setCurrent }}>
      {props.children}
      <ChartRendererProvider {...current.field?.decoratorProps} configuring={true}>
        <ChartConfigure insert={(schema, options) => insertAdjacent('beforeEnd', schema, options)} />
      </ChartRendererProvider>
    </ChartConfigContext.Provider>
  );
};
