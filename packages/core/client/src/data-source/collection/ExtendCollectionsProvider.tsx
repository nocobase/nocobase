import React, { FC, ReactNode, createContext, useContext } from 'react';
import { CollectionOptions } from './Collection';

export const ExtendCollectionsContext = createContext<CollectionOptions[]>(null);
ExtendCollectionsContext.displayName = 'ExtendCollectionsContext';

export interface ExtendCollectionsProviderProps {
  collections: CollectionOptions[];
  children?: ReactNode;
}

export const ExtendCollectionsProvider: FC<ExtendCollectionsProviderProps> = ({ children, collections }) => {
  return <ExtendCollectionsContext.Provider value={collections}>{children}</ExtendCollectionsContext.Provider>;
};

export function useExtendCollections() {
  const context = useContext(ExtendCollectionsContext);
  return context;
}
