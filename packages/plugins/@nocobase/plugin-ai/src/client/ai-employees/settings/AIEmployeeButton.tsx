/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import {
  SchemaSettings,
  SchemaSettingsModalItem,
  useBlockContext,
  useCollection,
  useCollectionFilterOptions,
  useCollectionRecordData,
  useSchemaSettings,
} from '@nocobase/client';
import { useT } from '../../locale';
import { avatars } from '../avatars';
import { Card, Avatar, Tooltip } from 'antd';
const { Meta } = Card;
import { Schema } from '@formily/react';
import { useAIEmployeeChatContext } from '../AIEmployeeChatProvider';

export const useAIEmployeeButtonVariableOptions = () => {
  const collection = useCollection();
  const t = useT();
  const fieldsOptions = useCollectionFilterOptions(collection);
  const recordData = useCollectionRecordData();
  const { name: blockType } = useBlockContext() || {};
  const fields = useMemo(() => {
    return Schema.compile(fieldsOptions, { t });
  }, [fieldsOptions]);
  return useMemo(() => {
    return [
      recordData && {
        name: 'currentRecord',
        title: t('Current record'),
        children: [...fields],
      },
      blockType === 'form' && {
        name: '$nForm',
        title: t('Current form'),
        children: [...fields],
      },
    ].filter(Boolean);
  }, [recordData, t, fields, blockType]);
};

export const aiEmployeeButtonSettings = new SchemaSettings({
  name: 'aiEmployees:button',
  items: [
    {
      name: 'edit',
      Component: () => {
        const t = useT();
        const { dn } = useSchemaSettings();
        const aiEmployee = dn.getSchemaAttribute('x-component-props.aiEmployee') || {};
        const { attachments = [], actions = [] } = useAIEmployeeChatContext();
        const attachmentsOptions = useMemo(
          () =>
            Object.entries(attachments).map(([name, item]) => ({
              label: (
                <Tooltip title={item.description} placement="right">
                  {item.title}
                </Tooltip>
              ),
              value: name,
            })),
          [attachments],
        );
        const actionsOptions = useMemo(
          () =>
            Object.entries(actions).map(([name, item]) => ({
              label: (
                <Tooltip title={item.description} placement="right">
                  {item.title}
                </Tooltip>
              ),
              value: name,
            })),
          [actions],
        );
        return (
          <SchemaSettingsModalItem
            scope={{ useAIEmployeeButtonVariableOptions }}
            schema={{
              type: 'object',
              title: t('Edit'),
              properties: {
                profile: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': () => (
                    <Card
                      variant="borderless"
                      style={{
                        maxWidth: 520,
                      }}
                    >
                      <Meta
                        avatar={aiEmployee.avatar ? <Avatar src={avatars(aiEmployee.avatar)} size={48} /> : null}
                        title={aiEmployee.nickname}
                        description={aiEmployee.bio}
                      />
                    </Card>
                  ),
                },
                taskDesc: {
                  type: 'string',
                  title: t('Task description'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  description: t(
                    'Displays the AI employee’s assigned tasks on the profile when hovering over the button.',
                  ),
                  default: dn.getSchemaAttribute('x-component-props.taskDesc'),
                },
                manualMessage: {
                  type: 'boolean',
                  'x-content': t('Requires the user to enter a message manually.'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Checkbox',
                  default: dn.getSchemaAttribute('x-component-props.manualMessage') || false,
                },
                message: {
                  type: 'object',
                  properties: {
                    messageType: {
                      type: 'string',
                      title: t('Message type'),
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      enum: [
                        {
                          label: t('Text'),
                          value: 'text',
                        },
                        {
                          label: t('Image'),
                          value: 'image',
                        },
                      ],
                      default: 'text',
                      'x-component-props': {
                        placeholder: t('Message type'),
                      },
                    },
                    content: {
                      title: t('Message content'),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Variable.RawTextArea',
                      'x-component-props': {
                        scope: '{{ useAIEmployeeButtonVariableOptions }}',
                        changeOnSelect: true,
                        fieldNames: {
                          value: 'name',
                          label: 'title',
                        },
                      },
                    },
                  },
                  default: dn.getSchemaAttribute('x-component-props.message'),
                  'x-reactions': {
                    dependencies: ['.manualMessage'],
                    fulfill: {
                      state: {
                        visible: '{{ !$deps[0] }}',
                      },
                    },
                  },
                },
                attachments: {
                  type: 'array',
                  title: t('Attachments'),
                  'x-component': 'Checkbox.Group',
                  'x-decorator': 'FormItem',
                  enum: attachmentsOptions,
                  default: dn.getSchemaAttribute('x-component-props.attachments'),
                  'x-reactions': {
                    target: 'attachments',
                    fulfill: {
                      state: {
                        visible: '{{$self.value.length}}',
                      },
                    },
                  },
                },
                actions: {
                  type: 'array',
                  title: t('Actions'),
                  'x-component': 'Checkbox.Group',
                  'x-decorator': 'FormItem',
                  enum: actionsOptions,
                  default: dn.getSchemaAttribute('x-component-props.actions'),
                  'x-reactions': {
                    target: 'actions',
                    fulfill: {
                      state: {
                        visible: '{{$self.value.length}}',
                      },
                    },
                  },
                },
              },
            }}
            title={t('Edit')}
            onSubmit={({ message, taskDesc, manualMessage, attachments, actions }) => {
              dn.deepMerge({
                'x-uid': dn.getSchemaAttribute('x-uid'),
                'x-component-props': {
                  aiEmployee,
                  message,
                  taskDesc,
                  manualMessage,
                  attachments,
                  actions,
                },
              });
            }}
          />
        );
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});
