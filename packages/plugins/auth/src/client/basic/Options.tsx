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
              disabledSignup: {
                'x-decorator': 'FormItem',
                type: 'boolean',
                title: '{{t("Not allowed to sign up")}}',
                'x-component': 'Checkbox',
              },
            },
          },
        },
      }}
    />
  );
};
