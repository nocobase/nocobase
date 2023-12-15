import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { CollectionOptions, useCollectionManager } from '../../collection-manager';
import { CollectionV2 } from './Collection';

export const CollectionContextV2 = createContext<CollectionV2>(null);
CollectionContextV2.displayName = 'CollectionContextV2';

export type CollectionProviderProps = ({ name: string } | { collection: CollectionOptions | CollectionV2 }) & {
  children?: ReactNode;
};
export const CollectionProviderV2: FC<CollectionProviderProps> = (props) => {
  const { name, collection, children } = props as { name: string; collection: CollectionOptions; children?: ReactNode };
  const { get } = useCollectionManager();

  const collectionValue = useMemo(() => {
    if (collection instanceof CollectionV2) {
      return collection;
    }
    if (collection) {
      return new CollectionV2(collection);
    }
    const res = name ? get(name) : undefined;

    if (!res) {
      console.error(`[nocobase]: ${name} collection does not exist`);
    }
    return new CollectionV2(res);
  }, [collection, get, name]);

  if (!collectionValue) return null;

  return <CollectionContextV2.Provider value={collectionValue}>{children}</CollectionContextV2.Provider>;
};

export const useCollectionV2 = () => {
  const context = useContext(CollectionContextV2);
  if (!context) {
    throw new Error('useCollection() must be used within a CollectionProviderV2');
  }

  return context;
};

export const useCollectionDataV2 = () => {
  const context = useCollectionV2();
  return context.data;
};
