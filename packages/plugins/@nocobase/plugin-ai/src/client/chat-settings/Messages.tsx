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
import { namespace, useT } from '../locale';
import { tval } from '@nocobase/utils/client';
import { ArrayBase, FormLayout } from '@formily/antd-v5';
import { clone } from '@formily/shared';
import { RecursionField, useField, observer, useFieldSchema } from '@formily/react';
import { ArrayField, Field } from '@formily/core';
import { WorkflowVariableInput, WorkflowVariableRawTextArea } from '@nocobase/plugin-workflow/client';
import ListCollapse, { ListCollapseProps } from '../components/ListCollapse';
import { Badge } from 'antd';

type ListCollapseValue = Record<string, unknown>;

type FormilyListCollapseProps = Pick<
  ListCollapseProps<ListCollapseValue>,
  'addText' | 'bordered' | 'defaultOpenPanelCount' | 'defaultValue' | 'itemTitle' | 'size'
> & {
  header?: React.ReactNode;
};

const FormilyListCollapse: React.FC<FormilyListCollapseProps> = observer((props) => {
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const items = Array.isArray(field.value) ? (field.value as ListCollapseValue[]) : [];
  const { header, itemTitle } = props;

  const updateItems = (next: ListCollapseValue[]) => {
    field.form.setValuesIn(field.path, next);
  };

  return (
    <ArrayBase>
      <ListCollapse<ListCollapseValue>
        {...props}
        value={items}
        onChange={updateItems}
        getDefaultValue={() => clone(props.defaultValue) as ListCollapseValue}
        renderHeader={(_, index) => {
          const errors = field.form.queryFeedbacks({
            type: 'error',
            address: `${field.address.concat(index)}.**`,
          });
          const title = header ?? itemTitle;

          return errors.length ? (
            <Badge size="small" className="errors-badge" count={errors.length}>
              {title}
            </Badge>
          ) : (
            title
          );
        }}
        renderItem={(item, index) => {
          const itemSchema = Array.isArray(fieldSchema.items)
            ? fieldSchema.items[index] || fieldSchema.items[0]
            : fieldSchema.items;

          if (!itemSchema) {
            return null;
          }

          return (
            <ArrayBase.Item index={index} record={item}>
              <RecursionField schema={itemSchema} name={index} />
            </ArrayBase.Item>
          );
        }}
      />
    </ArrayBase>
  );
});

const UserMessage: React.FC = observer(() => {
  const t = useT();
  const field = useField();
  const type = field.query('.type').take() as Field | undefined;

  if (type?.value === 'image_url' || type?.value === 'image_base64') {
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
      components={{ WorkflowVariableRawTextArea }}
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
  const role = field.query('.role').take() as Field | undefined;

  if (!role) {
    return null;
  }

  if (role.value === 'user') {
    return (
      <SchemaComponent
        components={{ FormLayout, ListCollapse: FormilyListCollapse, UserMessage }}
        schema={{
          type: 'void',
          properties: {
            content: {
              type: 'array',
              'x-component': 'ListCollapse',
              'x-component-props': {
                size: 'small',
                bordered: false,
                addText: tval('Add content', { ns: namespace }),
                defaultValue: { type: 'text' },
                header: t('Content'),
                itemTitle: t('Content'),
              },
              default: [{ type: 'text' }],
              'x-decorator': 'FormItem',
              items: {
                type: 'object',
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
                          { label: t('Image (send via URL)'), value: 'image_url' },
                          { label: t('Image (send via Base64)'), value: 'image_base64' },
                        ],
                        default: 'text',
                      },
                      user: {
                        type: 'void',
                        'x-component': 'UserMessage',
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
  }
  return (
    <SchemaComponent
      components={{ WorkflowVariableRawTextArea }}
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
      components={{ Content, FormLayout, ListCollapse: FormilyListCollapse }}
      schema={{
        type: 'void',
        properties: {
          messages: {
            type: 'array',
            'x-component': 'ListCollapse',
            'x-component-props': {
              size: 'small',
              addText: tval('Add prompt', { ns: namespace }),
              defaultValue: { role: 'user', content: [{ type: 'text' }] },
              header: t('Message'),
              itemTitle: t('Message'),
            },
            'x-decorator': 'FormItem',
            default: [{ role: 'user', content: [{ type: 'text' }] }],
            items: {
              type: 'object',
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
              },
            },
          },
        },
      }}
    />
  );
};

export const MessagesSettings: React.FC = () => {
  return (
    <SchemaComponent
      components={{ Messages }}
      schema={{
        type: 'void',
        properties: {
          messages: {
            type: 'void',
            'x-component': 'Messages',
          },
        },
      }}
    />
  );
};
