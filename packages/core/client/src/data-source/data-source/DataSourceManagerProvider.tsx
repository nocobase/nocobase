/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
