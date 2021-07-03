import React, { useMemo } from 'react';
import { createForm } from '@formily/core';
import { FormProvider, Schema, useFieldSchema } from '@formily/react';
import { SchemaRenderer, useDesignable } from '../DesignableSchemaField';
import { DesignableBar } from './DesignableBar';

export const Form = (props) => {
  const schema = useFieldSchema();
  const { schema: designableSchema, refresh } = useDesignable();
  return <SchemaRenderer onRefresh={(subSchema: Schema) => {
    designableSchema.properties = subSchema.properties;
    refresh();
  }} schema={schema.toJSON()} onlyRenderProperties/>

  // return (
  //   <FormProvider form={form}>
  //     <DesignableSchemaField
  //       schema={{
  //         type: 'object',
  //         properties: {
  //           ...schema,
  //         },
  //       }}
  //     />
  //   </FormProvider>
  // );
};

Form.DesignableBar = DesignableBar;
