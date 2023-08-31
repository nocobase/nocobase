import { FormItem, Input, SchemaComponent, useRecord } from '@nocobase/client';
import React from 'react';
import { Card, Space, message } from 'antd';
import { observer, useForm } from '@formily/react';
import { useAuthTranslation } from '../locale';

const Usage = observer(() => {
  const { t } = useAuthTranslation();
  const form = useForm();
  const record = useRecord();
  const name = form.values.name ?? record.name;
  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/`;

  return (
    <>
      <FormItem label={t('SP Issuer/EntityID')}>
        <Input value={name} disabled={true} />
      </FormItem>
    </>
  );
});

export const Options = () => {
  const { t } = useAuthTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ Usage, Space }}
      schema={{
        type: 'object',
        properties: {
          sms: {
            type: 'void',
            properties: {
              public: {
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
                  loctionUrl: {
                    title: '{{t("LoctionUrl")}}',
                    'x-component': 'Input',
                    'x-decorator': 'FormItem',
                    required: true,
                  },
                  usage: {
                    type: 'void',
                    'x-component': 'Usage',
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};
