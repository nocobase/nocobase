import React, { FC, ReactNode, createContext, useContext } from 'react';
import { CollectionManagerV2 } from './CollectionManager';

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
