/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { useNotifyMailTranslation } from './hooks/useTranslation';
export const ChannelConfigForm = () => {
  const { t } = useNotifyMailTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
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
                      width: 50,
                    },
                    properties: {
                      host: {
                        'x-decorator': 'FormItem',
                        type: 'string',
                        title: '{{t("Host")}}',
                        'x-component': 'Input',
                        required: true,
                      },
                    },
                  },
                  col2: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-component-props': {
                      width: 16,
                    },
                    properties: {
                      port: {
                        'x-decorator': 'FormItem',
                        type: 'number',
                        title: '{{t("Port")}}',
                        'x-component': 'InputNumber',
                        'x-component-props': {
                          min: 1,
                          max: 65535,
                          step: 1,
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
                      width: 16,
                    },
                    properties: {
                      secure: {
                        'x-decorator': 'FormItem',
                        type: 'boolean',
                        title: '{{t("Secure")}}',
                        'x-component': 'Checkbox',
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
              row: {
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  col1: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      account: {
                        'x-decorator': 'FormItem',
                        type: 'boolean',
                        title: '{{t("Account")}}',
                        'x-component': 'Input',
                        required: true,
                      },
                    },
                  },
                  col2: {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      password: {
                        'x-decorator': 'FormItem',
                        type: 'boolean',
                        title: '{{t("Password")}}',
                        'x-component': 'Input',
                        required: true,
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
