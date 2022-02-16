import React from 'react';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionManagerContext } from './context';
import { CollectionManagerOptions } from './types';

export const CollectionManagerProvider: React.FC<CollectionManagerOptions> = (props) => {
  const { interfaces, collections } = props;
  return (
    <CollectionManagerContext.Provider value={{ interfaces, collections }}>
      <CollectionManagerSchemaComponentProvider>
      {props.children}
      </CollectionManagerSchemaComponentProvider>
    </CollectionManagerContext.Provider>
  );
};
