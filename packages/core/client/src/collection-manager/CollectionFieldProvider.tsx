import React from 'react';
import { merge } from '@formily/shared';
import { useCollection } from './hooks';
import { CollectionFieldOptions } from './types';
import { CollectionFieldContext } from './context';
import { SchemaKey } from '@formily/react';

export const CollectionFieldProvider: React.FC<{ name?: SchemaKey; field?: CollectionFieldOptions }> = (props) => {
  const { name, field, children } = props;
  const { getField } = useCollection();
  return (
    <CollectionFieldContext.Provider value={field || getField(field?.name || name)}>
      {children}
    </CollectionFieldContext.Provider>
  );
};
