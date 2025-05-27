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
import { useT } from '../../locale';
import { InputsFormSettings } from './InputsFormSettings';
import { ArrayItems } from '@formily/antd-v5';

export const ChatSettings: React.FC = () => {
  const t = useT();
  return (
    <SchemaComponent
      components={{ InputsFormSettings, ArrayItems }}
      schema={{
        type: 'object',
        name: 'chatSettings',
        properties: {
          newConversationSettings: {
            type: 'void',
            'x-component': 'Divider',
            'x-component-props': {
              children: t('New conversation settings'),
            },
          },
          senderPlaceholder: {
            type: 'string',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            title: t('Sender placeholder'),
          },
          infoForm: {
            type: 'array',
            title: t('Required information form'),
            description: t(
              'Provide a form for the user to fill in the required information when starting a new conversation',
            ),
            'x-component': 'ArrayItems',
            'x-decorator': 'FormItem',
            items: {
              type: 'object',
              properties: {
                space: {
                  type: 'void',
                  'x-component': 'Space',
                  properties: {
                    sort: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.SortHandle',
                    },
                    name: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {
                        placeholder: t('Field name'),
                      },
                      required: true,
                    },
                    title: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {
                        placeholder: t('Field title'),
                      },
                      required: true,
                    },
                    type: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      'x-component-props': {
                        placeholder: t('Field type'),
                      },
                      required: true,
                      enum: [
                        {
                          label: t('Blocks'),
                          value: 'blocks',
                        },
                        {
                          label: t('Collections'),
                          value: 'collections',
                        },
                      ],
                    },
                    remove: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.Remove',
                    },
                  },
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: t('Add field'),
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
        },
      }}
    />
  );
};
