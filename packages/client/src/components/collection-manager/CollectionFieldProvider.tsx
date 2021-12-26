import React from 'react';
import { merge } from '@formily/shared';
import { useCollection, useCollectionManager } from './hooks';
import { CollectionOptions, CollectionFieldOptions, CollectionManagerOptions } from './types';
import { CollectionContext, CollectionFieldContext, CollectionManagerContext } from './context';

export const CollectionFieldProvider: React.FC<CollectionFieldOptions> = (props) => {
  const { name, uiSchema } = props;
  const { getField } = useCollection();
  return (
    <CollectionFieldContext.Provider value={merge(getField(name) || {}, { ...uiSchema })}>
      {props.children}
    </CollectionFieldContext.Provider>
  );
};
