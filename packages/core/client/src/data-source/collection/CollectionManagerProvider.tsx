import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import type { CollectionManagerV2 } from './CollectionManager';
import type { CollectionOptionsV2, CollectionV2 } from './Collection';
import { DataSourceProviderV2, useDataSourceV2 } from '../data-source/DataSourceProvider';
import { useExtendCollections } from './ExtendCollectionsProvider';

export const CollectionManagerContextV2 = createContext<CollectionManagerV2>(null);
CollectionManagerContextV2.displayName = 'CollectionManagerContextV2';

export interface CollectionManagerProviderPropsV2 {
  instance?: CollectionManagerV2;
  dataSource?: string;
  collections?: CollectionOptionsV2[];
  children?: ReactNode;
}

const CollectionManagerProviderInnerV2: FC<CollectionManagerProviderPropsV2> = ({
  instance,
  children,
  collections,
}) => {
  const dataSource = useDataSourceV2();
  const extendCollections = useExtendCollections();

  const cm = useMemo(() => {
    const res = instance || dataSource?.collectionManager;
    const extendsCollectionsValue = [...(collections || []), ...(extendCollections || [])];
    if (extendsCollectionsValue.length) {
      return res.clone(extendsCollectionsValue);
    }
    return res;
  }, [instance, collections, dataSource]);
  return <CollectionManagerContextV2.Provider value={cm}>{children}</CollectionManagerContextV2.Provider>;
};

export const CollectionManagerProviderV2: FC<CollectionManagerProviderPropsV2> = ({
  instance,
  dataSource,
  children,
  collections,
}) => {
  return (
    <DataSourceProviderV2 dataSource={dataSource}>
      <CollectionManagerProviderInnerV2 instance={instance} collections={collections}>
        {children}
      </CollectionManagerProviderInnerV2>
    </DataSourceProviderV2>
  );
};

export function useCollectionManagerV2() {
  const context = useContext<CollectionManagerV2>(CollectionManagerContextV2);
  return context;
}

export const useCollectionsV2 = (predicate?: (collection: CollectionV2) => boolean) => {
  const collectionManager = useCollectionManagerV2();
  const collections = useMemo(() => collectionManager.getCollections(predicate), [collectionManager, predicate]);
  return collections;
};
