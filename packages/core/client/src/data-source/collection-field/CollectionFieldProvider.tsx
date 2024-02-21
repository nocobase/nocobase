import React, { FC, ReactNode, createContext, useContext } from 'react';

import { useFieldSchema, type SchemaKey } from '@formily/react';
import type { CollectionFieldOptions } from '../collection';

import { useCollection, useCollectionManager } from '../collection';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';

export const CollectionFieldContext = createContext<CollectionFieldOptions>(null);
CollectionFieldContext.displayName = 'CollectionFieldContext';

export type CollectionFieldProviderProps = {
  name?: SchemaKey;
  children?: ReactNode;
};

export const CollectionFieldProvider: FC<CollectionFieldProviderProps> = (props) => {
  const { name, children } = props;
  const fieldSchema = useFieldSchema();
  const collection = useCollection();
  const collectionManager = useCollectionManager();
  const field = fieldSchema?.['x-component-props']?.['field'];
  const value =
    collectionManager.getCollectionField(fieldSchema?.['x-collection-field']) ||
    field ||
    collection.getField(field?.name || name);

  if (!value) {
    return <CollectionDeletedPlaceholder type="Field" name={name} />;
  }

  return <CollectionFieldContext.Provider value={value}>{children}</CollectionFieldContext.Provider>;
};

export const useCollectionField = () => {
  const context = useContext(CollectionFieldContext);
  if (!context) {
    throw new Error('useCollectionField() must be used within a CollectionFieldProvider');
  }

  return context;
};
