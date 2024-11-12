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
import { lang, useAuthTranslation } from '../locale';
import { FormTab, ArrayTable } from '@formily/antd-v5';
import { Alert } from 'antd';

export const Options = () => {
  const { t } = useAuthTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ Alert, FormTab, ArrayTable }}
      schema={{
        type: 'object',
        properties: {
          notice: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'Alert',
            'x-component-props': {
              showIcon: true,
              message: '{{t("The authentication allows users to sign in via username or email.")}}',
            },
          },
          public: {
            type: 'object',
            properties: {
              collapse: {
                type: 'void',
                'x-component': 'FormTab',
                properties: {
                  basic: {
                    type: 'void',
                    'x-component': 'FormTab.TabPane',
                    'x-component-props': {
                      tab: lang('Sign up settings'),
                    },
                    properties: {
                      allowSignUp: {
                        'x-decorator': 'FormItem',
                        type: 'boolean',
                        title: '{{t("Allow to sign up")}}',
                        'x-component': 'Checkbox',
                        default: true,
                      },
                      signupForm: {
                        title: '{{t("Sign up form")}}',
                        type: 'array',
                        'x-decorator': 'FormItem',
                        'x-component': 'ArrayTable',
                        'x-component-props': {
                          bordered: false,
                        },
                        'x-validator': `{{ (value) => {
  const field = value?.filter((item) => item.show && item.required);
  if (!field?.length) {
    return t('At least one field is required');
  }
} }}`,
                        default: [
                          {
                            field: 'username',
                            show: true,
                            required: true,
                          },
                          {
                            field: 'email',
                            show: false,
                            required: false,
                          },
                        ],
                        items: {
                          type: 'object',
                          'x-decorator': 'ArrayItems.Item',
                          properties: {
                            column0: {
                              type: 'void',
                              'x-component': 'ArrayTable.Column',
                              'x-component-props': { width: 20, align: 'center' },
                              properties: {
                                sort: {
                                  type: 'void',
                                  'x-component': 'ArrayTable.SortHandle',
                                },
                              },
                            },
                            column1: {
                              type: 'void',
                              'x-component': 'ArrayTable.Column',
                              'x-component-props': { width: 100, title: lang('Field') },
                              properties: {
                                field: {
                                  type: 'string',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Select',
                                  enum: [
                                    {
                                      label: lang('Username'),
                                      value: 'username',
                                    },
                                    {
                                      label: lang('Email'),
                                      value: 'email',
                                    },
                                  ],
                                  'x-read-pretty': true,
                                },
                              },
                            },
                            column2: {
                              type: 'void',
                              'x-component': 'ArrayTable.Column',
                              'x-component-props': { width: 80, title: lang('Show') },
                              properties: {
                                show: {
                                  type: 'boolean',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Checkbox',
                                },
                              },
                            },
                            column3: {
                              type: 'void',
                              'x-component': 'ArrayTable.Column',
                              'x-component-props': { width: 80, title: lang('Required') },
                              properties: {
                                required: {
                                  type: 'boolean',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Checkbox',
                                },
                              },
                            },
                          },
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
