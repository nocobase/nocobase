import { Field } from '@formily/core';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useCollection } from '..';
import { SchemaComponent } from '../schema-component';
import { ActionLogDesigner } from './ActionLog.Designer';
import { createSchema } from './utils';

export const ActionLog = () => {
  const schema = createSchema();
  return <SchemaComponent schema={schema} name={schema.name} />;
};

ActionLog.Designer = ActionLogDesigner;

ActionLog.Field = observer((props: any) => {
  const { value } = props;
  return <div>{value?.uiSchema?.title || value?.name}</div>;
});

ActionLog.FieldValue = observer((props: any) => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);

  if (!collectionField.uiSchema) {
    if (!field.value) {
      return <div></div>;
    }
    if (typeof field.value === 'boolean') {
      return <div>{field.value ? 'true' : 'false'}</div>;
    }
    if (typeof field.value === 'string' || typeof field.value === 'number') {
      return <div>{field.value}</div>;
    }
    return <pre>{JSON.stringify(field.value, null, 2)}</pre>;
  }

  return (
    <RecursionField
      name="actionLogFieldValue"
      schema={
        {
          type: 'void',
          properties: {
            [collectionField.name as string]: {
              ...collectionField.uiSchema,
              default: field.value,
              'x-decorator': null,
              'x-read-pretty': true,
            },
          },
        } as any
      }
    />
  );
});
