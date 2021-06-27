import React, { useMemo } from 'react';
import { createForm } from '@formily/core';
import { FormProvider, useFieldSchema } from '@formily/react';
import { DesignableSchemaField } from '../SchemaField';
import { DesignableBar } from './DesignableBar';

export const Form = (props) => {
  const form = useMemo(() => createForm(), []);
  const schema = useFieldSchema();

  return (
    <FormProvider form={form}>
      <DesignableSchemaField
        schema={{
          type: 'object',
          properties: schema.properties,
        }}
      />
    </FormProvider>
  );
};

Form.DesignableBar = DesignableBar;
