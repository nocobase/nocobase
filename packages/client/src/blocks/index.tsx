import React, { useMemo } from 'react';
import { createForm } from '@formily/core';
import { FormProvider } from '@formily/react';
import { DesignableSchemaField, SchemaField } from './SchemaField';

export * from './SchemaField';

export const SchemaBlock = ({ schema, onlyRenderProperties =  false, designable = true }) => {
  const form = useMemo(() => createForm(), []);

  let s = schema;

  if (onlyRenderProperties) {
    s = {
      type: 'object',
      properties: schema.properties,
    };
  } else if (schema.name) {
    s = {
      type: 'object',
      properties: {
        [schema.name]: schema,
      },
    };
  }

  return (
    <FormProvider form={form}>
      {designable ? (
        <DesignableSchemaField schema={s} />
      ) : (
        <SchemaField schema={s} />
      )}
    </FormProvider>
  );
};
