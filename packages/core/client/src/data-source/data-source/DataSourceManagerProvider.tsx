import React, { FC, ReactNode, createContext, useContext } from 'react';
import type { DataSourceManagerV2 } from './DataSourceManager';

export const DataSourceManagerContextV2 = createContext<DataSourceManagerV2>(null);
DataSourceManagerContextV2.displayName = 'DataSourceManagerContextV2';

export interface DataSourceManagerProviderPropsV2 {
  dataSourceManager: DataSourceManagerV2;
  children?: ReactNode;
}

export const DataSourceManagerProviderV2: FC<DataSourceManagerProviderPropsV2> = ({ children, dataSourceManager }) => {
  return (
    <DataSourceManagerContextV2.Provider value={dataSourceManager}>{children}</DataSourceManagerContextV2.Provider>
  );
};

export function useDataSourceManagerV2() {
  const context = useContext<DataSourceManagerV2>(DataSourceManagerContextV2);
  return context;
}
