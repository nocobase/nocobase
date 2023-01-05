import { SchemaKey, useFieldSchema } from '@formily/react';
import React from 'react';
import { CollectionFieldContext } from './context';
import { useCollection, useCollectionManager } from './hooks';
import { CollectionFieldOptions } from './types';

export const CollectionFieldProvider: React.FC<{
  name?: SchemaKey;
  field?: CollectionFieldOptions;
  fallback?: React.ReactElement;
}> = (props) => {
  const { name, field, children, fallback } = props;
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const value = field || getField(field?.name || name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  if (!value) {
    return fallback;
  }
  return <CollectionFieldContext.Provider value={value}>{children}</CollectionFieldContext.Provider>;
};
