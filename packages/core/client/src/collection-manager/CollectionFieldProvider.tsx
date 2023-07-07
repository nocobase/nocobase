import { SchemaKey, useFieldSchema } from '@formily/react';
import React from 'react';
import { useRecord } from '../record-provider';
import { CollectionFieldContext } from './context';
import { useCollection, useCollectionManager } from './hooks';
import { CollectionFieldOptions } from './types';

export const CollectionFieldProvider: React.FC<{
  name?: SchemaKey;
  field?: CollectionFieldOptions;
  fallback?: React.ReactElement;
}> = (props) => {
  const { name, field, children, fallback = null } = props;
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const { __collection } = useRecord();
  const { getCollectionJoinField } = useCollectionManager();
  const isTableFeild = fieldSchema?.parent?.['x-component'] === 'TableV2.Column';
  const value =
    __collection && isTableFeild
      ? getCollectionJoinField(`${__collection}.${name}`)
      : field || getField(field?.name || name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  if (!value) {
    return fallback;
  }
  return <CollectionFieldContext.Provider value={value}>{children}</CollectionFieldContext.Provider>;
};
