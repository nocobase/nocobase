import React, { FC, ReactNode, createContext, useContext } from 'react';
import { CollectionOptionsV2 } from './Collection';

export const ExtendCollectionsContext = createContext<CollectionOptionsV2[]>(null);
ExtendCollectionsContext.displayName = 'ExtendCollectionsContext';

export interface ExtendCollectionsProviderPropsV2 {
  collections: CollectionOptionsV2[];
  children?: ReactNode;
}

export const ExtendCollectionsProvider: FC<ExtendCollectionsProviderPropsV2> = ({ children, collections }) => {
  return <ExtendCollectionsContext.Provider value={collections}>{children}</ExtendCollectionsContext.Provider>;
};

export function useExtendCollections() {
  const context = useContext(ExtendCollectionsContext);
  return context;
}
