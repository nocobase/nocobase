/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useMemo, useState } from 'react';
import { SchemaComponent, SchemaSettings, SchemaSettingsItem, useSchemaSettings, useToken } from '@nocobase/client';
import { useT } from '../../locale';
import { avatars } from '../avatars';
import { Card, Avatar, Tooltip, Modal, Tag, Typography } from 'antd';
const { Meta } = Card;
import { createForm } from '@formily/core';
import { uid } from '@formily/shared';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { AIEmployee } from '../types';
import { AIVariableRawTextArea } from './AIVariableRawTextArea';
import { useFieldSchema } from '@formily/react';
import { useAIEmployeesContext } from '../AIEmployeesProvider';

const SettingsForm: React.FC<{
  form: any;
  aiEmployee: AIEmployee;
}> = memo(({ form, aiEmployee }) => {
  const { dn } = useSchemaSettings();
  const t = useT();
  const { token } = useToken();
  const fieldSchema = useFieldSchema();
  const currentSchema = fieldSchema?.parent?.parent?.parent;

  return (
    <SchemaComponent
      components={{ AIVariableRawTextArea }}
      schema={{
        type: 'void',
        properties: {
          [uid()]: {
            'x-component': 'FormV2',
            'x-component-props': {
              form,
              disabled: false,
            },
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
                      title={
                        <>
                          {aiEmployee.nickname}
                          {aiEmployee.position && (
                            <Tag
                              style={{
                                marginLeft: token.margin,
                              }}
                            >
                              {aiEmployee.position}
                            </Tag>
                          )}
                        </>
                      }
                      description={<>{aiEmployee.bio}</>}
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
              messageDivider: {
                type: 'void',
                'x-component': 'Divider',
                'x-component-props': {
                  children: t('Task instruction'),
                },
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
                      // {
                      //   label: t('Image'),
                      //   value: 'image',
                      // },
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
                    'x-component': 'AIVariableRawTextArea',
                    'x-component-props': {
                      currentSchema,
                    },
                  },
                },
                default: dn.getSchemaAttribute('x-component-props.message'),
              },
              autoSend: {
                type: 'boolean',
                'x-content': t('Send default message automatically'),
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
                default: dn.getSchemaAttribute('x-component-props.autoSend') || false,
              },
            },
          },
        },
      }}
    />
  );
});

export const aiEmployeeButtonSettings = new SchemaSettings({
  name: 'aiEmployees:button',
  items: [
    {
      name: 'edit',
      Component: () => {
        const t = useT();
        const { dn } = useSchemaSettings();
        const [open, setOpen] = useState(false);
        const username = dn.getSchemaAttribute('x-component-props.username') || {};
        const form = useMemo(() => createForm({}), []);
        const { selectable } = useAISelectionContext();
        const { aiEmployeesMap } = useAIEmployeesContext();
        const aiEmployee = aiEmployeesMap[username];

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <SchemaSettingsItem title={t('Edit task')} onClick={() => setOpen(true)} />
            <Modal
              styles={{
                mask: {
                  zIndex: selectable ? -1 : 311,
                },
                wrapper: {
                  zIndex: selectable ? -1 : 311,
                },
              }}
              title={t('Edit task')}
              open={open}
              onCancel={() => {
                setOpen(false);
              }}
              onOk={() => {
                const { taskDesc, message, autoSend } = form.values;
                dn.deepMerge({
                  'x-uid': dn.getSchemaAttribute('x-uid'),
                  'x-component-props': {
                    username,
                    message,
                    taskDesc,
                    autoSend,
                  },
                });
                setOpen(false);
              }}
            >
              <SettingsForm form={form} aiEmployee={aiEmployee} />
            </Modal>
          </div>
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
