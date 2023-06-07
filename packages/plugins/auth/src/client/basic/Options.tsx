import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useAuthTranslation } from '../locale';

export const Options = () => {
  const { t } = useAuthTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          public: {
            type: 'object',
            properties: {
              allowSignup: {
                'x-decorator': 'FormItem',
                type: 'boolean',
                title: '{{t("Allow to sign up")}}',
                'x-component': 'Checkbox',
                'x-component-props': {
                  defaultChecked: true,
                },
              },
            },
          },
        },
      }}
    />
  );
};
