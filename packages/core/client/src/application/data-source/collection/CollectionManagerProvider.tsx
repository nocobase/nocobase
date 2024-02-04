import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import type { CollectionManagerV3 } from './CollectionManager';
import type { CollectionOptionsV3, CollectionV3 } from './Collection';
import { DataSourceProviderV3, useDataSourceV3 } from '../data-source';

export const CollectionManagerContextV3 = createContext<CollectionManagerV3>(null);
CollectionManagerContextV3.displayName = 'CollectionManagerContextV3';

export interface CollectionManagerProviderPropsV3 {
  instance?: CollectionManagerV3;
  dataSource?: string;
  collections?: CollectionOptionsV3[];
  children?: ReactNode;
}

const CollectionManagerProviderInnerV3: FC<CollectionManagerProviderPropsV3> = ({
  instance,
  children,
  collections,
}) => {
  const dataSource = useDataSourceV3();
  const cm = useMemo(() => {
    const res = instance || dataSource.collectionManager;
    return collections ? res.clone(collections) : res;
  }, [instance, collections, dataSource]);

  return <CollectionManagerContextV3.Provider value={cm}>{children}</CollectionManagerContextV3.Provider>;
};

export const CollectionManagerProviderV3: FC<CollectionManagerProviderPropsV3> = ({
  instance,
  dataSource,
  children,
  collections,
}) => {
  return (
    <DataSourceProviderV3 dataSource={dataSource}>
      <CollectionManagerProviderInnerV3 instance={instance} collections={collections}>
        {children}
      </CollectionManagerProviderInnerV3>
    </DataSourceProviderV3>
  );
};

export function useCollectionManagerV3() {
  const context = useContext<CollectionManagerV3>(CollectionManagerContextV3);
  return context;
}

export const useCollectionsV3 = (predicate?: (collection: CollectionV3) => boolean) => {
  const collectionManager = useCollectionManagerV3();
  const collections = useMemo(() => collectionManager.getCollections(predicate), [collectionManager, predicate]);
  return collections;
};
