/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';

import { useNotifyMailTranslation } from './hooks/useTranslation';

export const ChannelConfigForm = () => {
  const { t } = useNotifyMailTranslation();
  return (
    // @ts-ignore
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          transport: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Transport")}}',
            'x-component': 'Select',
            enum: [{ value: 'smtp', label: 'SMTP' }],
            default: 'smtp',
            required: true,
          },
          server: {
            type: 'void',
            'x-component': 'Grid',
            properties: {
              row: {
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  col1: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-component-props': {
                      width: 45,
                    },
                    properties: {
                      host: {
                        'x-decorator': 'FormItem',
                        type: 'string',
                        title: '{{t("Host")}}',
                        description: '{{t("SMTP server host")}}',
                        'x-component': 'TextAreaWithGlobalScope',
                        'x-component-props': {
                          placeholder: 'smtp.example.com',
                        },
                        required: true,
                      },
                    },
                  },
                  col2: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-component-props': {
                      width: 20,
                    },
                    properties: {
                      port: {
                        'x-decorator': 'FormItem',
                        type: 'number',
                        title: '{{t("Port")}}',
                        'x-component': 'TextAreaWithGlobalScope',
                        'x-component-props': {
                          number: true,
                          useTypedConstant: [
                            [
                              'number',
                              {
                                min: 1,
                                max: 65535,
                                step: 1,
                              },
                            ],
                          ],
                        },
                        default: 465,
                        required: true,
                      },
                    },
                  },
                  col3: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-component-props': {
                      width: 35,
                    },
                    properties: {
                      secure: {
                        type: 'boolean',
                        title: '{{t("Secure")}}',
                        'x-decorator': 'FormItem',
                        'x-component': 'TextAreaWithGlobalScope',
                        description:
                          '{{t("In most cases, if using port 465, set it to true; otherwise, set it to false.")}}',
                        'x-component-props': {
                          boolean: true,
                          useTypedConstant: [['boolean', { style: { width: '100%' } }]],
                        },
                        default: true,
                      },
                    },
                  },
                },
              },
            },
          },
          auth: {
            type: 'void',
            'x-component': 'Grid',
            properties: {
              row1: {
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  col1: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-component-props': {},
                    properties: {
                      account: {
                        'x-decorator': 'FormItem',
                        type: 'boolean',
                        title: '{{t("Account")}}',
                        'x-component': 'TextAreaWithGlobalScope',
                        'x-component-props': {
                          placeholder: 'example@domain.com',
                        },
                        required: true,
                      },
                    },
                  },
                  col2: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-component-props': {},
                    properties: {
                      password: {
                        'x-decorator': 'FormItem',
                        type: 'boolean',
                        title: '{{t("Password")}}',
                        'x-component': 'TextAreaWithGlobalScope',
                        'x-component-props': { password: true },
                        required: true,
                      },
                    },
                  },
                },
              },
              row2: {
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  col1: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-component-props': {
                      // width: 50,
                      // flex: 'none',
                    },
                    properties: {
                      from: {
                        type: 'string',
                        required: true,
                        title: `{{t("From")}}`,
                        description: `{{t("The email address that will be used as the sender")}}`,
                        'x-decorator': 'FormItem',
                        'x-component': 'TextAreaWithGlobalScope',
                        'x-component-props': {
                          useTypedConstant: ['string'],
                          placeholder: `noreply <example@domain.com>`,
                          expression: false,
                        },
                      },
                    },
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
