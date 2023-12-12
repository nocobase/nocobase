import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { CollectionOptions, useCollectionManager } from '../../collection-manager';

export const CollectionContextV2 = createContext<CollectionOptions>({} as any);
CollectionContextV2.displayName = 'CollectionContextV2';

export interface CollectionProviderProps extends CollectionOptions {
  children?: ReactNode;
}

export const CollectionProviderV2: FC<CollectionProviderProps> = ({ children, name, collection }) => {
  const { get } = useCollectionManager();

  const collectionValue = useMemo(() => {
    if (collection) return collection;
    const res = name ? get(name) : undefined;

    if (!res) {
      console.error(`[nocobase]: ${name} collection does not exist`);
    }
    return res;
  }, [collection, get, name]);

  if (!collectionValue) return null;

  return <CollectionContextV2.Provider value={collectionValue}>{children}</CollectionContextV2.Provider>;
};

export const useCollectionV2 = (showError = true) => {
  const context = useContext(CollectionContextV2);
  if (showError && !context) {
    throw new Error('useCollection() must be used within a CollectionProvider');
  }

  return context;
};
