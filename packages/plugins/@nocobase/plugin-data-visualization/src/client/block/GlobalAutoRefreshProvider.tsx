/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';

export const GlobalAutoRefreshContext = React.createContext<{
  addChart: (uid: string, chart: { service: any }) => void;
  removeChart: (uid: string) => void;
  autoRefresh: number | boolean;
  setAutoRefresh: (autoRefresh: number | boolean) => void;
  refreshCharts: () => void;
}>({} as any);

export const GlobalAutoRefreshProvider: React.FC = (props) => {
  const [autoRefresh, setAutoRefresh] = useState<number | boolean>(false);
  const charts = useRef<{ [uid: string]: { service: any; selfAutoRefresh?: boolean } }>({});
  const addChart = useMemoizedFn((uid: string, { service }) => {
    charts.current[uid] = { service };
  });
  const removeChart = useMemoizedFn((uid: string) => {
    const chart = charts.current[uid];
    if (!chart) {
      return;
    }
    charts.current[uid] = { service: chart.service, selfAutoRefresh: true };
  });
  const refreshCharts = useMemoizedFn(() => {
    for (const chart of Object.values(charts.current)) {
      chart?.service.refresh();
    }
  });
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }
    const timer = setInterval(
      () => {
        const refreshCharts = Object.values(charts.current).filter((chart) => !chart.selfAutoRefresh);
        for (const chart of refreshCharts) {
          chart?.service.refresh();
        }
      },
      (autoRefresh as number) * 1000,
    );
    return () => clearInterval(timer);
  }, [autoRefresh]);
  return (
    <GlobalAutoRefreshContext.Provider value={{ addChart, removeChart, autoRefresh, setAutoRefresh, refreshCharts }}>
      {props.children}
    </GlobalAutoRefreshContext.Provider>
  );
};
