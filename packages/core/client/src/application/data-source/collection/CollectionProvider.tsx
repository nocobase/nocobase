import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import type { CollectionOptionsV2, CollectionV2, GetCollectionFieldPredicateV2 } from './Collection';

export const CollectionContextV2 = createContext<CollectionV2>(null);
CollectionContextV2.displayName = 'CollectionContextV2';

export interface CollectionProviderPropsV2 {
  name: string | CollectionOptionsV2;
  children?: ReactNode;
  allowNull?: boolean;
}

export const CollectionProviderV2: FC<CollectionProviderPropsV2> = (props) => {
  const { name, children, allowNull } = props;
  const collectionManager = useCollectionManagerV2();
  const collection = useMemo(() => collectionManager?.getCollection(name), [collectionManager, name]);
  if (!collection && allowNull) return <>{props.children}</>;
  if (!collection && !allowNull) return <CollectionDeletedPlaceholder type="Collection" name={name as string} />;
  return <CollectionContextV2.Provider value={collection}>{children}</CollectionContextV2.Provider>;
};

export function useCollectionV2<Mixins = {}>(): (Mixins & CollectionV2) | undefined {
  const context = useContext(CollectionContextV2);

  return context as (Mixins & CollectionV2) | undefined;
}

export const useCollectionFieldsV2 = (predicate?: GetCollectionFieldPredicateV2) => {
  const collection = useCollectionV2();
  const fields = useMemo(() => collection.getFields(predicate), [collection, predicate]);
  return fields;
};
