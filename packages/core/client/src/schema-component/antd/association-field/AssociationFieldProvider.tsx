import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { AssociationFieldContext } from './context';

export const AssociationFieldProvider = observer((props) => {
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
  const currentMode = useMemo(
    () => fieldSchema['x-component-props']?.mode || (isFileCollection ? 'FileManager' : 'Select'),
    [fieldSchema['x-component-props']?.mode],
  );
  return collectionField ? (
    <AssociationFieldContext.Provider value={{ options: collectionField, field, currentMode }}>
      {props.children}
    </AssociationFieldContext.Provider>
  ) : null;
});
