import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { useFormBlockContext } from '../../../block-provider';
import { useCompile } from '../../hooks';
import { useCollectionV2 } from '../../../application';

export const FormField: any = observer(
  (props) => {
    const fieldSchema = useFieldSchema();
    const collection = useCollectionV2();
    const field = useField();
    const collectionField = collection.getField(fieldSchema.name);
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
  },
  { displayName: 'FormField' },
);
