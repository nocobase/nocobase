import React from 'react';

import { CollectionManagerContext, useCollectionManager } from '@nocobase/client';

import expression from './expression';

export function Provider(props) {
  const cmCtx = useCollectionManager();
  return (
    <CollectionManagerContext.Provider
      value={{
        ...cmCtx,
        interfaces: {
          ...cmCtx.interfaces,
          expression,
        },
      }}
    >
      {props.children}
    </CollectionManagerContext.Provider>
  );
}
