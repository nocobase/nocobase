import React from 'react';
import { CollectionContext } from './context';
import { useCollectionManager } from './hooks';
import { CollectionOptions } from './types';

export const CollectionProvider: React.FC<{ name?: string; collection?: CollectionOptions }> = (props) => {
  const { name, collection, children } = props;
  const { getCollection } = useCollectionManager();
  return <CollectionContext.Provider value={getCollection(collection || name)}>{children}</CollectionContext.Provider>;
};
