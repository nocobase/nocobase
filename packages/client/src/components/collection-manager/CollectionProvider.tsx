import React from 'react';
import { merge } from '@formily/shared';
import { useCollectionManager } from './hooks';
import { CollectionOptions } from './types';
import { CollectionContext } from './context';

export const CollectionProvider: React.FC<CollectionOptions> = (props) => {
  const { name, children, ...others } = props;
  const { get } = useCollectionManager();
  return (
    <CollectionContext.Provider value={merge(get(name) || {}, { name, ...others })}>
      {children}
    </CollectionContext.Provider>
  );
};
