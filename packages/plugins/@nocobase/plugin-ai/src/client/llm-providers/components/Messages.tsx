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
import { namespace, useT } from '../../locale';
import { tval } from '@nocobase/utils/client';
import { ArrayCollapse, FormLayout } from '@formily/antd-v5';
import { useField, observer } from '@formily/react';
import { Field } from '@formily/core';
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client';

const UserMessage: React.FC = observer(() => {
  const t = useT();
  const field = useField();
  const type = field.query('.type').take() as Field;

  if (type.value === 'image_url') {
    return (
      <SchemaComponent
        components={{ WorkflowVariableInput }}
        schema={{
          type: 'void',
          properties: {
            image_url: {
              type: 'object',
              properties: {
                url: {
                  title: tval('Image', { ns: namespace }),
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'WorkflowVariableInput',
                  'x-component-props': {
                    changeOnSelect: true,
                  },
                },
              },
            },
          },
        }}
      />
    );
  }

  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          content: {
            title: t('Content'),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'WorkflowVariableRawTextArea',
            'x-component-props': {
              autoSize: {
                minRows: 5,
              },
            },
          },
        },
      }}
    />
  );
});

const Content: React.FC = observer(() => {
  const t = useT();
  const field = useField();
  const role = field.query('.role').take() as Field;

  if (role.value === 'user') {
    return (
      <SchemaComponent
        components={{ UserMessage }}
        schema={{
          type: 'void',
          properties: {
            content: {
              type: 'array',
              'x-component': 'ArrayCollapse',
              'x-component-props': {
                size: 'small',
                bordered: false,
              },
              default: [{ type: 'text' }],
              'x-decorator': 'FormItem',
              items: {
                type: 'object',
                'x-component': 'ArrayCollapse.CollapsePanel',
                'x-component-props': {
                  header: t('Content'),
                },
                properties: {
                  form: {
                    type: 'void',
                    'x-component': 'FormLayout',
                    'x-component-props': {
                      layout: 'vertical',
                    },
                    properties: {
                      type: {
                        title: t('Type'),
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Select',
                        enum: [
                          { label: t('Text'), value: 'text' },
                          { label: t('Image'), value: 'image_url' },
                        ],
                        default: 'text',
                      },
                      user: {
                        type: 'void',
                        'x-component': 'UserMessage',
                      },
                    },
                  },
                  moveUp: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.MoveUp',
                  },
                  moveDown: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.MoveDown',
                  },
                  remove: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.Remove',
                  },
                },
              },
              properties: {
                addition: {
                  type: 'void',
                  title: tval('Add content', { ns: namespace }),
                  'x-component': 'ArrayCollapse.Addition',
                  'x-component-props': {
                    defaultValue: { type: 'text' },
                  },
                },
              },
            },
          },
        }}
      />
    );
  }
  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          message: {
            title: tval('Content', { ns: namespace }),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'WorkflowVariableRawTextArea',
          },
        },
      }}
    />
  );
});

export const Messages: React.FC = () => {
  const t = useT();

  return (
    <SchemaComponent
      components={{ ArrayCollapse, FormLayout, Content }}
      schema={{
        type: 'void',
        properties: {
          messages: {
            type: 'array',
            'x-component': 'ArrayCollapse',
            'x-component-props': {
              size: 'small',
            },
            'x-decorator': 'FormItem',
            default: [{ role: 'user', content: [{ type: 'text' }] }],
            items: {
              type: 'object',
              'x-component': 'ArrayCollapse.CollapsePanel',
              'x-component-props': {
                header: t('Message'),
              },
              properties: {
                form: {
                  type: 'void',
                  'x-component': 'FormLayout',
                  'x-component-props': {
                    layout: 'vertical',
                  },
                  properties: {
                    role: {
                      title: tval('Role', { ns: namespace }),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      enum: [
                        { label: 'System', value: 'system' },
                        { label: 'User', value: 'user' },
                        { label: 'Assistant', value: 'assistant' },
                      ],
                      default: 'user',
                    },
                    content: {
                      type: 'void',
                      'x-component': 'Content',
                    },
                  },
                },
                moveUp: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.MoveUp',
                },
                moveDown: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.MoveDown',
                },
                remove: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Remove',
                },
              },
            },
            properties: {
              addition: {
                type: 'void',
                title: tval('Add prompt', { ns: namespace }),
                'x-component': 'ArrayCollapse.Addition',
                'x-component-props': {
                  defaultValue: { role: 'user', content: [{ type: 'text' }] },
                },
              },
            },
          },
        },
      }}
    />
  );
};
