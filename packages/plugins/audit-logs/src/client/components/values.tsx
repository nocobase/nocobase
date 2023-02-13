import React from 'react';
import { observer, useField } from '@formily/react';
import { ArrayTable } from '@formily/antd';
import { FormProvider, SchemaComponent, useCompile } from '@nocobase/client';

export const Username = observer(() => {
  const field = useField<any>();
  return <div>{field?.value?.nickname || field.value?.id}</div>;
});

export const Collection = observer(() => {
  const field = useField<any>();
  const { title, name } = field.value || {};
  const compile = useCompile();
  return <div>{title ? compile(title) : name}</div>;
});

export const Field = observer(() => {
  const field = useField<any>();
  const compile = useCompile();
  if (!field.value) {
    return null;
  }
  return <div>{field.value?.uiSchema?.title ? compile(field.value?.uiSchema?.title) : field.value.name}</div>;
});

export const Value = observer(() => {
  const field = useField<any>();
  const record = ArrayTable.useRecord();
  if (record.field?.uiSchema) {
    return (
      <FormProvider>
        <SchemaComponent
          schema={{
            name: record.field.name,
            ...record.field?.uiSchema,
            default: field.value,
            'x-read-pretty': true,
          }}
        />
      </FormProvider>
    );
  }
  return <div>{field.value ? JSON.stringify(field.value) : null}</div>;
});
