import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { useFormBlockContext } from '../../../../block-provider';
import { useCollection } from '../../../../collection-manager';
import { useCompile } from '../../../hooks';

export const SubForm: any = observer((props) => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const field = useField();
  const collectionField = getField(fieldSchema.name);
  const compile = useCompile();
  const ctx = useFormBlockContext();
  console.log(fieldSchema.properties);
  if (!fieldSchema.properties) {
    console.log(fieldSchema.properties);
    fieldSchema.addProperty('nester', {
      type: 'void',
      // 提供上下文
      'x-decorator': 'AssociationField.Nester.Decorator',
      properties: {
        // Sub-form、Sub-list
        grid: {
          type: 'void',
          'x-component': 'Grid',
          properties: {},
        },
        // Sub-table
        column: {
          'x-component': 'TableV2.Column',
          properties: {
            f1: {
              'x-component': 'CollectionField',
            },
          },
        },
      },
    });
  }
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
