import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useEffect } from 'react';
import { useCompile } from './useCompile';
import { useCollectionManagerV2, useCollectionV2 } from '../../application';

export const useFieldTitle = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const collection = useCollectionV2();
  const cm = useCollectionManagerV2();
  const collectionField =
    collection.getField(fieldSchema['name']) || cm.getCollectionField(fieldSchema['x-collection-field']);
  const compile = useCompile();
  useEffect(() => {
    if (!field?.title) {
      field.title = compile(collectionField?.uiSchema?.title);
    }
  }, [collectionField?.uiSchema?.title]);
};
