import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { Space } from 'antd';
import { useAuthTranslation, generateNTemplate } from './locale';

export const Options = () => {
  const { t } = useAuthTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ Space }}
      schema={{
        type: 'object',
        properties: {
          autoSignup: {
            'x-decorator': 'FormItem',
            type: 'boolean',
            title: '{{t("Sign up automatically when the user does not exist")}}',
            'x-component': 'Checkbox',
          },
          casUrl: {
            title: '{{t("CAS URL")}}',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            required: true,
          },
          serviceDomain: {
            title: '{{t("Service domain")}}',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: generateNTemplate(
                'The domain is usually the address of your server, in local development, you can use the address of your local machine, such as: http://localhost:13000',
              ),
            },
            required: true,
          },
        },
      }}
    />
  );
};
