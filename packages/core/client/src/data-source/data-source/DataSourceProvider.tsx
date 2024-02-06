import React, { FC, ReactNode, createContext, useContext } from 'react';
import type { DataSourceV2 } from './DataSource';
import { useDataSourceManagerV2 } from './DataSourceManagerProvider';

export const DataSourceContextV2 = createContext<DataSourceV2>(null);
DataSourceContextV2.displayName = 'DataSourceContextV2';

export interface DataSourceProviderPropsV2 {
  dataSource?: string;
  children?: ReactNode;
}

export const DataSourceProviderV2: FC<DataSourceProviderPropsV2> = ({ children, dataSource }) => {
  const dataSourceManager = useDataSourceManagerV2();
  const dataSourceValue = dataSourceManager.getDataSource(dataSource);
  return <DataSourceContextV2.Provider value={dataSourceValue}>{children}</DataSourceContextV2.Provider>;
};

export function useDataSourceV2() {
  const context = useContext<DataSourceV2>(DataSourceContextV2);
  return context;
}

export function useDataSourceKey() {
  const context = useContext(DataSourceContextV2);
  return context?.key;
}
