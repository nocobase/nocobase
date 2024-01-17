import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
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

export function useCollectionManagerV2() {
  const context = useContext<CollectionManagerV2>(CollectionManagerContextV2);
  return context;
}

export const useCollectionsV2 = (options?: {
  predicate?: (collection: CollectionV2) => boolean;
  namespace?: string;
}) => {
  const collectionManager = useCollectionManagerV2();
  const collections = useMemo(() => collectionManager.getCollections(options), [collectionManager, options]);
  return collections;
};
