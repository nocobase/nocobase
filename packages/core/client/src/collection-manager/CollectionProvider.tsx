import React from 'react';
import { CollectionContext } from './context';
import { useCollectionManager } from './hooks';
import { CollectionOptions } from './types';

export const CollectionProvider: React.FC<{ allowNull?: boolean; name?: string; collection?: CollectionOptions }> = (
  props,
) => {
  const { allowNull, name, collection, children } = props;
  const { getCollection } = useCollectionManager();
  const value = getCollection(collection || name);
  if (!value && !allowNull) {
    return null;
  }
  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
};
