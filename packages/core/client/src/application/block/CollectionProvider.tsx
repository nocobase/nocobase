import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { CollectionOptions, useCollectionManager } from '../../collection-manager';

interface CollectionContextValue {
  name: string;
  collection?: CollectionOptions;
}

export const CollectionContextV2 = createContext<CollectionContextValue>({} as any);

export interface CollectionProviderProps extends CollectionContextValue {
  children?: ReactNode;
}

export const CollectionProviderV2: FC<CollectionProviderProps> = ({ children, name, collection }) => {
  const { get } = useCollectionManager();
  const collectionValue = useMemo(() => {
    if (collection) return collection;
    return get(name);
  }, [collection, get, name]);
  return (
    <CollectionContextV2.Provider value={{ name, collection: collectionValue }}>
      {children}
    </CollectionContextV2.Provider>
  );
};

export const useCollectionV2 = () => {
  const context = useContext(CollectionContextV2);
  if (!context) {
    throw new Error('useCollection() must be used within a CollectionProvider');
  }

  return context;
};
