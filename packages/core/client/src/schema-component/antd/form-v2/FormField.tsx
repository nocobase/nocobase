import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useEffect } from 'react';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection } from '../../../collection-manager';
import { useCompile } from '../../hooks';

export const FormField: any = observer((props) => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const field = useField();
  const collectionField = getField(fieldSchema.name);
  const compile = useCompile();
  const ctx = useFormBlockContext();
  useEffect(() => {
    if (!field.title) {
      field.title = compile(collectionField?.uiSchema?.title);
    }
    if (ctx?.field) {
      ctx.field.added = ctx.field.added || new Set();
      ctx.field.added.add(fieldSchema.name);
    }
  }, []);
  return <div>{props.children}</div>;
});