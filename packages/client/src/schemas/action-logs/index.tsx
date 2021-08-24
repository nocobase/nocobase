import { Field } from '@formily/core';
import {
  ISchema,
  observer,
  RecursionField,
  Schema,
  useField,
} from '@formily/react';
import React from 'react';
import { SchemaRenderer } from '../../components/schema-renderer';
import ArrayTable from '../array-table';

export const ActionLogs = () => null;

ActionLogs.Field = observer((props: any) => {
  const { value } = props;
  return <div>{value?.uiSchema?.title || value?.name}</div>;
});

ActionLogs.FieldValue = observer((props: any) => {
  const field = useField<Field>();
  const array = ArrayTable.useArray();
  const index = ArrayTable.useIndex();
  const collectionField = array.field.value[index]?.field;
  console.log('ffffff', collectionField?.uiSchema, field.value);

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
    <SchemaRenderer
      schema={{
        type: 'object',
        properties: {
          [collectionField.name as string]: {
            ...collectionField.uiSchema,
            default: field.value,
            'x-decorator': null,
            'x-read-pretty': true,
          },
        },
      }}
    />
  );
});
