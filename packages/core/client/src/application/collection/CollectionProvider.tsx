import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { CollectionV2 } from './Collection';
import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { DEFAULT_COLLECTION_NAMESPACE_NAME } from './CollectionManager';

export const CollectionContextV2 = createContext<CollectionV2>(null);
CollectionContextV2.displayName = 'CollectionContextV2';

export interface CollectionProviderProps {
  name: string;
  ns?: string;
  children?: ReactNode;
}

export const CollectionProviderV2: FC<CollectionProviderProps> = (props) => {
  const { name, ns, children } = props;
  const collectionManager = useCollectionManagerV2();
  const collection = useMemo(() => {
    const res = collectionManager.getCollection(name, { ns });
    if (!res) {
      throw new Error(
        `[@nocobase/client]: Collection "${name}" does not exist in namespace "${
          ns || DEFAULT_COLLECTION_NAMESPACE_NAME
        }"`,
      );
    }
    return res;
  }, [collectionManager, name, ns]);

  if (!collection) return null;

  return <CollectionContextV2.Provider value={collection}>{children}</CollectionContextV2.Provider>;
};

export const useCollectionV2 = () => {
  const context = useContext(CollectionContextV2);
  if (!context) {
    throw new Error('useCollection() must be used within a CollectionProviderV2');
  }

  return context;
};
