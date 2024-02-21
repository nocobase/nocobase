import React, { FC, ReactNode, createContext, useContext } from 'react';
import type { DataSourceManager } from './DataSourceManager';

export const DataSourceManagerContext = createContext<DataSourceManager>(null);
DataSourceManagerContext.displayName = 'DataSourceManagerContext';

export interface DataSourceManagerProviderProps {
  dataSourceManager: DataSourceManager;
  children?: ReactNode;
}

export const DataSourceManagerProvider: FC<DataSourceManagerProviderProps> = ({ children, dataSourceManager }) => {
  return <DataSourceManagerContext.Provider value={dataSourceManager}>{children}</DataSourceManagerContext.Provider>;
};

export function useDataSourceManager() {
  const context = useContext<DataSourceManager>(DataSourceManagerContext);
  return context;
}
