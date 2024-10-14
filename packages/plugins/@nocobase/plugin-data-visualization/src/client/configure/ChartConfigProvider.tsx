/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import React, { createContext, useState } from 'react';
import { ChartRendererProvider } from '../renderer';
import { ChartConfigure } from './ChartConfigure';
import { useDesignable } from '@nocobase/client';
import { css } from '@emotion/css';
import { theme } from 'antd';

export type ChartConfigCurrent = {
  schema: ISchema;
  field: any;
  collection: string;
  dataSource: string;
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
ChartConfigContext.displayName = 'ChartConfigContext';

export const ChartConfigProvider: React.FC = (props) => {
  const { insertAdjacent } = useDesignable();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ChartConfigCurrent>({} as any);
  return (
    <ChartConfigContext.Provider value={{ visible, setVisible, current, setCurrent }}>
      {props.children}
      <ChartRendererProvider {...current.field?.decoratorProps} disableAutoRefresh={true}>
        <ChartConfigure insert={(schema, options) => insertAdjacent('beforeEnd', schema, options)} />
      </ChartRendererProvider>
    </ChartConfigContext.Provider>
  );
};
