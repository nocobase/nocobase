import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { DeletedPlaceholder } from './DeletedPlaceholder';
import type { CollectionV2, GetCollectionFieldPredicate } from './Collection';

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
  const collection = useMemo(() => collectionManager.getCollection(name, { ns }), [collectionManager, name, ns]);

  if (!collection) return <DeletedPlaceholder />;

  return <CollectionContextV2.Provider value={collection}>{children}</CollectionContextV2.Provider>;
};

export function useCollectionV2<Mixins = {}>(): (Mixins & CollectionV2) | undefined {
  const context = useContext(CollectionContextV2);
  if (!context) {
    throw new Error('useCollection() must be used within a CollectionProviderV2');
  }

  return context as (Mixins & CollectionV2) | undefined;
}

export const useCollectionFieldsV2 = (predicate?: GetCollectionFieldPredicate) => {
  const collection = useCollectionV2();
  const fields = useMemo(() => collection.getFields(predicate), [collection, predicate]);
  return fields;
};
