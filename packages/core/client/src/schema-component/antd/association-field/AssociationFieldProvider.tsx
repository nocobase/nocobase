import { useField, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { AssociationFieldContext } from './context';

export function AssociationFieldProvider(props) {
  const field = useField();
  const { getCollectionJoinField, getCollection } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const collectionField = useMemo(
    () => getCollectionJoinField(fieldSchema['x-collection-field']),
    [fieldSchema['x-collection-field'], fieldSchema.name],
  );
  const isFileCollection = useMemo(
    () => getCollection(collectionField?.target)?.template === 'file',
    [fieldSchema['x-collection-field']],
  );
  return collectionField ? (
    <AssociationFieldContext.Provider value={{ options: collectionField, field, isFileCollection }}>
      {props.children}
    </AssociationFieldContext.Provider>
  ) : null;
}
