import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import type { CollectionManagerV2, GetCollectionOptions } from './CollectionManager';
import type { CollectionV2 } from './Collection';

export const CollectionManagerContextV2 = createContext<CollectionManagerV2<any>>(null);
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

export function useCollectionManagerV2<Mixins = {}>() {
  const context = useContext<CollectionManagerV2<Mixins>>(CollectionManagerContextV2);
  return context;
}

export const useCollectionsV2 = (predicate?: (collection: CollectionV2) => boolean, options?: GetCollectionOptions) => {
  const collectionManager = useCollectionManagerV2();
  const collections = useMemo(
    () => collectionManager.getCollections(predicate, options),
    [collectionManager, options, predicate],
  );
  return collections;
};
