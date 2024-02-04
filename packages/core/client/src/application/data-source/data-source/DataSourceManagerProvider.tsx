import React, { FC, ReactNode, createContext, useContext } from 'react';
import type { DataSourceManagerV3 } from './DataSourceManager';

export const DataSourceManagerContextV3 = createContext<DataSourceManagerV3>(null);
DataSourceManagerContextV3.displayName = 'DataSourceManagerContextV3';

export interface DataSourceManagerProviderPropsV3 {
  dataSourceManager: DataSourceManagerV3;
  children?: ReactNode;
}

export const DataSourceManagerProviderV3: FC<DataSourceManagerProviderPropsV3> = ({ children, dataSourceManager }) => {
  return (
    <DataSourceManagerContextV3.Provider value={dataSourceManager}>{children}</DataSourceManagerContextV3.Provider>
  );
};

export function useDataSourceManagerV3() {
  const context = useContext<DataSourceManagerV3>(DataSourceManagerContextV3);
  return context;
}
