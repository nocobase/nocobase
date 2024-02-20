import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useEffect } from 'react';
import { useCompile } from './useCompile';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../collection-manager';

export const useFieldTitle = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const compile = useCompile();
  useEffect(() => {
    if (!field?.title) {
      field.title = compile(collectionField?.uiSchema?.title);
    }
  }, [collectionField?.uiSchema?.title]);
};
