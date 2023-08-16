import { useForm } from '@formily/react';
import { useAsyncData } from '../../../../async-data-provider';
import React from 'react';
import { SchemaComponent } from '../../../../schema-component';

export const SQLInput = () => {
  const { run } = useAsyncData();
  const form = useForm();

  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          sql: {
            type: 'string',
            title: '{{t("SQL")}}',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              onBlur: () => {
                if (!form.values.sql) {
                  return;
                }
                run(form.values.sql);
              },
            },
          },
        },
      }}
    />
  );
};
