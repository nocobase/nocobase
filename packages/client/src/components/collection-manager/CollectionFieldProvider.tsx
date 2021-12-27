import React from 'react';
import { merge } from '@formily/shared';
import { useCollection } from './hooks';
import { CollectionFieldOptions } from './types';
import { CollectionFieldContext } from './context';

export const CollectionFieldProvider: React.FC<CollectionFieldOptions> = (props) => {
  const { name } = props;
  const { getField } = useCollection();
  return (
    <CollectionFieldContext.Provider value={merge(getField(name) || {}, props)}>
      {props.children}
    </CollectionFieldContext.Provider>
  );
};
