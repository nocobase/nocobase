import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import type { CollectionManager } from './CollectionManager';
import type { CollectionOptions, Collection } from './Collection';
import { DataSourceProvider, useDataSource } from '../data-source/DataSourceProvider';
import { useExtendCollections } from './ExtendCollectionsProvider';

export const CollectionManagerContext = createContext<CollectionManager>(null);
CollectionManagerContext.displayName = 'CollectionManagerContext';

export interface CollectionManagerProviderProps {
  instance?: CollectionManager;
  dataSource?: string;
  collections?: CollectionOptions[];
  children?: ReactNode;
}

const CollectionManagerProviderInner: FC<CollectionManagerProviderProps> = ({ instance, children, collections }) => {
  const dataSource = useDataSource();
  const extendCollections = useExtendCollections();

  const cm = useMemo(() => {
    const res = instance || dataSource?.collectionManager;
    const extendsCollectionsValue = [...(collections || []), ...(extendCollections || [])];
    if (extendsCollectionsValue.length) {
      return res.clone(extendsCollectionsValue);
    }
    return res;
  }, [instance, collections, dataSource]);
  return <CollectionManagerContext.Provider value={cm}>{children}</CollectionManagerContext.Provider>;
};

export const CollectionManagerProvider: FC<CollectionManagerProviderProps> = ({
  instance,
  dataSource,
  children,
  collections,
}) => {
  return (
    <DataSourceProvider dataSource={dataSource}>
      <CollectionManagerProviderInner instance={instance} collections={collections}>
        {children}
      </CollectionManagerProviderInner>
    </DataSourceProvider>
  );
};

export function useCollectionManager() {
  const context = useContext<CollectionManager>(CollectionManagerContext);
  return context;
}

export const useCollections = (predicate?: (collection: Collection) => boolean) => {
  const collectionManager = useCollectionManager();
  const collections = useMemo(() => collectionManager.getCollections(predicate), [collectionManager, predicate]);
  return collections;
};
