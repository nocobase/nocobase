import React, { FC, ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CollectionManagerV2, GetCollectionOptions } from './CollectionManager';
import type { CollectionV2 } from './Collection';

export const CollectionManagerContextV2 = createContext<CollectionManagerV2>(null);
CollectionManagerContextV2.displayName = 'CollectionManagerContextV2';

export interface CollectionManagerProviderProps {
  collectionManager: CollectionManagerV2;
  children?: ReactNode;
}

export const CollectionManagerProviderV2: FC<CollectionManagerProviderProps> = ({ children, collectionManager }) => {
  return (
    <CollectionManagerContextV2.Provider value={collectionManager}>{children}</CollectionManagerContextV2.Provider>
  );
};

export const useCollectionManagerV2 = () => {
  const context = useContext(CollectionManagerContextV2);
  return context;
};

export const useCollectionsV2 = (ns?: string, predicate?: (collection: CollectionV2) => boolean) => {
  const collectionManager = useCollectionManagerV2();
  const collections = useMemo(
    () => collectionManager.getCollections(ns, predicate),
    [collectionManager, ns, predicate],
  );
  return collections;
};

export const useCollectionFieldByPathV2 = (path: string, options?: GetCollectionOptions) => {
  const collectionManager = useCollectionManagerV2();
  const field = useMemo(() => collectionManager.getCollectionField(path, options), [collectionManager, path, options]);

  return field;
};
