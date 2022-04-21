import React from 'react';
import { CollectionContext } from './context';
import { useCollectionManager } from './hooks';
import { CollectionOptions } from './types';

export const CollectionProvider: React.FC<{ name?: string; collection?: CollectionOptions }> = (props) => {
  const { name, collection, children } = props;
  const { getCollection } = useCollectionManager();
  const value = getCollection(collection || name);
  if (!value) {
    return null;
  }
  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
};
