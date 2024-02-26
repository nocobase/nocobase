import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { CollectionOptions } from './Collection';
import { useDataSourceKey } from '../data-source/DataSourceProvider';
import { CollectionManagerProvider } from './CollectionManagerProvider';

export const ExtendCollectionsContext = createContext<CollectionOptions[]>(null);
ExtendCollectionsContext.displayName = 'ExtendCollectionsContext';

export interface ExtendCollectionsProviderProps {
  collections: CollectionOptions[];
  children?: ReactNode;
}

export const ExtendCollectionsProvider: FC<ExtendCollectionsProviderProps> = ({ children, collections }) => {
  const parentCollections = useExtendCollections();
  const extendCollections = useMemo(() => {
    return parentCollections ? [...parentCollections, ...collections] : collections;
  }, [parentCollections, collections]);
  const dataSource = useDataSourceKey();

  return (
    <ExtendCollectionsContext.Provider value={extendCollections}>
      <CollectionManagerProvider dataSource={dataSource}>{children}</CollectionManagerProvider>
    </ExtendCollectionsContext.Provider>
  );
};

export function useExtendCollections() {
  const context = useContext(ExtendCollectionsContext);
  return context;
}
