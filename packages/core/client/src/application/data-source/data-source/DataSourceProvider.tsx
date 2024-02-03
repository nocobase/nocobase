import React, { FC, ReactNode, createContext, useContext } from 'react';
import type { DataSourceV3 } from './DataSource';
import { useDataSourceManagerV3 } from './DataSourceManagerProvider';

export const DataSourceContextV3 = createContext<DataSourceV3>(null);
DataSourceContextV3.displayName = 'DataSourceContextV3';

export interface DataSourceProviderPropsV3 {
  dataSource?: string;
  children?: ReactNode;
}

export const DataSourceProviderV3: FC<DataSourceProviderPropsV3> = ({ children, dataSource }) => {
  const dataSourceManager = useDataSourceManagerV3();
  const dataSourceValue = dataSourceManager.getDataSource(dataSource);

  return <DataSourceContextV3.Provider value={dataSourceValue}>{children}</DataSourceContextV3.Provider>;
};

export function useDataSourceV3() {
  const context = useContext<DataSourceV3>(DataSourceContextV3);
  return context;
}
