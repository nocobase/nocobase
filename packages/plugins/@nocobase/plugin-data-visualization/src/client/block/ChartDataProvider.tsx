import React, { createContext, useState } from 'react';
import { useMemoizedFn } from 'ahooks';

type ChartData = {
  collection: string;
  service: any;
  query: any;
};

export const ChartDataContext = createContext<{
  charts: { [uid: string]: ChartData };
  addChart: (uid: string, chart: ChartData) => void;
  removeChart: (uid: string) => void;
}>({} as any);

export const ChartDataProvider: React.FC = (props) => {
  const [charts, setCharts] = useState<{
    [uid: string]: ChartData;
  }>({});
  const addChart = useMemoizedFn((uid: string, { collection, service, query }: ChartData) => {
    setCharts((charts) => ({ ...charts, [uid]: { collection, service, query } }));
  });
  const removeChart = useMemoizedFn((uid: string) => {
    setCharts((charts) => ({ ...charts, [uid]: undefined }));
  });
  return (
    <ChartDataContext.Provider value={{ charts, addChart, removeChart }}>{props.children}</ChartDataContext.Provider>
  );
};
