import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { useCollectionManagerV3 } from './CollectionManagerProvider';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import type { CollectionOptionsV3, CollectionV3, GetCollectionFieldPredicateV3 } from './Collection';

export const CollectionContextV3 = createContext<CollectionV3>(null);
CollectionContextV3.displayName = 'CollectionContextV3';

export interface CollectionProviderPropsV3 {
  name: string | CollectionOptionsV3;
  children?: ReactNode;
  allowNull?: boolean;
}

export const CollectionProviderV3: FC<CollectionProviderPropsV3> = (props) => {
  const { name, children, allowNull } = props;
  const collectionManager = useCollectionManagerV3();
  const collection = useMemo(() => collectionManager.getCollection(name), [collectionManager, name]);
  if (!collection && allowNull) return <>{props.children}</>;
  if (!collection && !allowNull) return <CollectionDeletedPlaceholder type="Collection" name={name as string} />;
  return <CollectionContextV3.Provider value={collection}>{children}</CollectionContextV3.Provider>;
};

export function useCollectionV3<Mixins = {}>(): (Mixins & CollectionV3) | undefined {
  const context = useContext(CollectionContextV3);

  return context as (Mixins & CollectionV3) | undefined;
}

export const useCollectionFieldsV3 = (predicate?: GetCollectionFieldPredicateV3) => {
  const collection = useCollectionV3();
  const fields = useMemo(() => collection.getFields(predicate), [collection, predicate]);
  return fields;
};
