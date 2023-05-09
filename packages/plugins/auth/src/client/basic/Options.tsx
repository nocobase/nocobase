import { SchemaComponent } from '@nocobase/client';
import React from 'react';

export const Options = () => (
  <SchemaComponent
    schema={{
      type: 'object',
      properties: {
        jwt: {
          type: 'object',
          properties: {
            secret: {
              title: 'JWT Secret',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
            expireIn: {
              title: '{{t("Expire In",{ns:"auth"})}}',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
          },
        },
      },
    }}
  />
);
