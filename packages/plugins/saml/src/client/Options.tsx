import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { RedirectURLInput } from './RedirectURLInput';

const schema = {
  type: 'object',
  properties: {
    saml: {
      type: 'object',
      properties: {
        issuer: {
          title: 'Issuer',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        ssoUrl: {
          title: 'SSO URL',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        certificate: {
          title: 'Certificate',
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          required: true,
        },
      },
    },
  },
};

export const Options = () => {
  return <SchemaComponent components={{ RedirectURLInput }} schema={schema} />;
};
