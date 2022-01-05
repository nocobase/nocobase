import React from 'react';
import { CollectionManagerOptions } from './types';
import { CollectionManagerContext } from './context';

export const CollectionManagerProvider: React.FC<CollectionManagerOptions> = (props) => {
  const { interfaces, collections } = props;
  return (
    <CollectionManagerContext.Provider value={{ interfaces, collections }}>
      {props.children}
    </CollectionManagerContext.Provider>
  );
};
