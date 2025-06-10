/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, ReactNode, createContext, useCallback, useContext } from 'react';
import { InheritanceCollectionMixin } from '../../collection-manager/mixins/InheritanceCollectionMixin';
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

/**
 * 获取当前 collection 继承链路上的所有 collection（不包括兄弟表）
 * @returns
 */
export function useAllCollectionsInheritChainGetter() {
  const dm = useDataSourceManager();
  const getAllCollectionsInheritChain = useCallback(
    (collectionName: string, customDataSource?: string) => {
      return dm
        ?.getDataSource(customDataSource)
        ?.collectionManager?.getCollection<InheritanceCollectionMixin>(collectionName)
        ?.getInheritChain();
    },
    [dm],
  );

  return { getAllCollectionsInheritChain };
}
