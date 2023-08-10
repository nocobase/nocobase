import { useForm } from '@formily/react';
import { useAsyncData } from '../../../../async-data-provider';
import { Input } from '../../../../schema-component/antd/input';
import React from 'react';
import { SchemaComponent } from '../../../../schema-component';
import { useTranslation } from 'react-i18next';
import { Alert } from 'antd';

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
                run();
              },
            },
          },
        },
      }}
    />
  );
};
