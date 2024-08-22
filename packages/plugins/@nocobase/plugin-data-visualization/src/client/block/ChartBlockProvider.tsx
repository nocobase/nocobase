/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useEffect, useState } from 'react';
import { BlockRefreshButton } from '../initializers/BlockRefreshAction';
import { SchemaComponentOptions } from '@nocobase/client';

export const ChartBlockContext = createContext<{
  autoRefresh?: number | boolean;
  setAutoRefresh?: (autoRefresh: number | boolean) => void;
  refreshChartsFunc?: Function | null;
  setRefreshChartsFunc?: (state: { func: Function | null }) => void;
}>({});

export const ChartBlockProvider: React.FC = (props) => {
  const [autoRefresh, setAutoRefresh] = useState<number | boolean>(false);
  const [refreshChartsFunc, setRefreshChartsFunc] = useState<{
    func: Function | null;
  }>({ func: null });
  useEffect(() => {
    console.log(refreshChartsFunc, 'refreshChartsFunc');
  }, [refreshChartsFunc]);
  return (
    <SchemaComponentOptions
      components={{
        BlockRefreshButton,
      }}
    >
      <ChartBlockContext.Provider
        value={{ autoRefresh, setAutoRefresh, refreshChartsFunc: refreshChartsFunc.func, setRefreshChartsFunc }}
      >
        {props.children}
      </ChartBlockContext.Provider>
    </SchemaComponentOptions>
  );
};
