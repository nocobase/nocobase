import { useField, useForm } from '@formily/react';
import React, { useEffect } from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Field } from '@formily/core';

export const TransformerDynamicComponent: React.FC<{
  schema: any;
}> = (props) => {
  const { schema } = props;
  const field = useField<Field>();

  if (!schema) {
    return null;
  }

  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          [schema.name]: {
            type: 'void',
            ...schema,
            value: field.value,
            'x-component-props': {
              ...schema['x-component-props'],
              defaultValue: field.value,
              onChange: (e: any) => {
                if (typeof e === 'object' && e?.target) {
                  field.value = e.target.value;
                  return;
                }
                field.value = e;
              },
            },
          },
        },
      }}
    />
  );
};
