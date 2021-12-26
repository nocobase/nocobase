import React from 'react';
import { merge } from '@formily/shared';
import { useCollection, useCollectionManager } from './hooks';
import { CollectionOptions, CollectionFieldOptions, CollectionManagerOptions } from './types';
import { CollectionContext, CollectionFieldContext, CollectionManagerContext } from './context';

export const CollectionManagerProvider: React.FC<CollectionManagerOptions> = (props) => {
  const { interfaces, collections } = props;
  return (
    <CollectionManagerContext.Provider value={{ interfaces, collections }}>
      {props.children}
    </CollectionManagerContext.Provider>
  );
};
