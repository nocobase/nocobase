import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import type { Collection, CollectionOptions, GetCollectionFieldPredicate } from './Collection';
import { useCollectionManager } from './CollectionManagerProvider';

export const CollectionContext = createContext<Collection>(null);
CollectionContext.displayName = 'CollectionContext';

export interface CollectionProviderProps {
  name: string | CollectionOptions;
  children?: ReactNode;
  allowNull?: boolean;
}

export const CollectionProvider: FC<CollectionProviderProps> = (props) => {
  const { name, children, allowNull } = props;
  const collectionManager = useCollectionManager();
  const collection = useMemo(() => collectionManager?.getCollection(name), [collectionManager, name]);
  if (!collection && allowNull) return <>{props.children}</>;
  if (!collection && !allowNull) return <CollectionDeletedPlaceholder type="Collection" name={name as string} />;
  return <CollectionContext.Provider value={collection}>{children}</CollectionContext.Provider>;
};

export const SanitizedCollectionProvider: FC<CollectionProviderProps> = (props) => {
  return (
    // <CollectionFieldContext.Provider value={null}>
    <CollectionProvider {...props} />
    // </CollectionFieldContext.Provider>
  );
};

export function useCollection<Mixins = {}>(): (Mixins & Collection) | undefined {
  const context = useContext(CollectionContext);

  return context as (Mixins & Collection) | undefined;
}

export const useCollectionFields = (predicate?: GetCollectionFieldPredicate) => {
  const collection = useCollection();
  const fields = useMemo(() => collection.getFields(predicate), [collection, predicate]);
  return fields;
};
