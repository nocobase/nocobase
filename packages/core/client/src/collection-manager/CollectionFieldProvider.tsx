import { SchemaKey } from '@formily/react';
import React from 'react';
import { CollectionFieldContext } from './context';
import { useCollection } from './hooks';
import { CollectionFieldOptions } from './types';

export const CollectionFieldProvider: React.FC<{ name?: SchemaKey; field?: CollectionFieldOptions }> = (props) => {
  const { name, field, children } = props;
  const { getField } = useCollection();
  const value = field || getField(field?.name || name);
  if (!value) {
    return null;
  }
  return (
    <CollectionFieldContext.Provider value={value}>
      {children}
    </CollectionFieldContext.Provider>
  );
};
