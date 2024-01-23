import React, { FC, ReactNode, createContext, useContext } from 'react';

export const CollectionDataSourceName = createContext<string>(undefined);
CollectionDataSourceName.displayName = 'CollectionDataSourceName';

export const CollectionDataSourceProvider: FC<{ dataSource: string; children: ReactNode }> = ({
  dataSource,
  children,
}) => {
  return <CollectionDataSourceName.Provider value={dataSource}>{children}</CollectionDataSourceName.Provider>;
};

export const useCollectionDataSourceName = () => {
  return useContext(CollectionDataSourceName);
};
