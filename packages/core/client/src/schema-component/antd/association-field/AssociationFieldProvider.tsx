import { useField, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { AssociationFieldContext } from './context';

export function AssociationFieldProvider(props) {
  const field = useField();
  const { getCollectionField } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const collectionField = useMemo(
    () => getCollectionField(fieldSchema['x-collection-field']),
    [fieldSchema['x-collection-field']],
  );
  return (
    <AssociationFieldContext.Provider value={{ options: collectionField, field }}>
      {props.children}
    </AssociationFieldContext.Provider>
  );
}
