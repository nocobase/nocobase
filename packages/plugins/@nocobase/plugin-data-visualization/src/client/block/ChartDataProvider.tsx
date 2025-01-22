/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useState } from 'react';
import { useMemoizedFn } from 'ahooks';

type ChartData = {
  dataSource: string;
  collection: string;
  service: any;
  query: any;
};

export const ChartDataContext = createContext<{
  charts: { [uid: string]: ChartData };
  addChart: (uid: string, chart: ChartData) => void;
  removeChart: (uid: string) => void;
}>({} as any);
ChartDataContext.displayName = 'ChartDataContext';

export const ChartDataProvider: React.FC = (props) => {
  const [charts, setCharts] = useState<{
    [uid: string]: ChartData;
  }>({});
  const addChart = useMemoizedFn((uid: string, { dataSource, collection, service, query }: ChartData) => {
    setCharts((charts) => ({ ...charts, [uid]: { dataSource, collection, service, query } }));
  });
  const removeChart = useMemoizedFn((uid: string) => {
    setCharts((charts) => ({ ...charts, [uid]: undefined }));
  });

  return (
    <ChartDataContext.Provider value={{ charts, addChart, removeChart }}>{props.children}</ChartDataContext.Provider>
  );
};
