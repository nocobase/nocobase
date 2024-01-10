import { SchemaKey, useFieldSchema } from '@formily/react';
import React from 'react';
import { useCollection, useCollectionManager } from './hooks';
import { CollectionFieldOptions } from './types';
import { CollectionFieldContextV2 } from '../application';
import { DeletedPlaceholder } from '../application/collection/DeletedPlaceholder';

export const CollectionFieldProvider: React.FC<{
  name?: SchemaKey;
  field?: CollectionFieldOptions;
  fallback?: React.ReactElement;
}> = (props) => {
  const { name, field, children } = props;
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const value = getCollectionJoinField(fieldSchema?.['x-collection-field']) || field || getField(field?.name || name);
  if (!value) {
    return <DeletedPlaceholder type="Field" name={name} />;
  }
  return (
    <CollectionFieldContextV2.Provider value={{ ...value, uiSchema: value.uiSchema }}>
      {children}
    </CollectionFieldContextV2.Provider>
  );
};
