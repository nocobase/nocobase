/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useMemo, useState } from 'react';
import {
  SchemaComponent,
  SchemaSettings,
  SchemaSettingsItem,
  SchemaSettingsLinkageRules,
  useSchemaSettings,
  useSchemaToolbar,
  useToken,
} from '@nocobase/client';
import { useT } from '../../locale';
import { avatars } from '../avatars';
import { Card, Avatar, Tooltip, Modal, Tag, Typography } from 'antd';
import { ArrayTabs } from '@formily/antd-v5';
const { Meta } = Card;
import { createForm } from '@formily/core';
import { uid } from '@formily/shared';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { AIEmployee } from '../types';
import { AIVariableRawTextArea } from './AIVariableRawTextArea';
import { useFieldSchema } from '@formily/react';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { useAIEmployeeButtonVariableOptions } from './useVariableOptions';

const SettingsForm: React.FC<{
  form: any;
  aiEmployee: AIEmployee;
}> = memo(({ form, aiEmployee }) => {
  const { dn } = useSchemaSettings();
  const t = useT();
  const { token } = useToken();
  const fieldSchema = useFieldSchema();
  const currentSchema = fieldSchema?.parent?.parent?.parent;
  const scope = useAIEmployeeButtonVariableOptions();

  return (
    <SchemaComponent
      components={{ AIVariableRawTextArea, ArrayTabs }}
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
                'x-decorator-props': {
                  tooltip: t('Displays the AI employee’s assigned tasks on the profile when hovering over the button.'),
                },
                'x-component': 'Input.TextArea',
                'x-component-props': {
                  autoSize: {
                    minRows: 2,
                  },
                },
                default: dn.getSchemaAttribute('x-component-props.taskDesc'),
              },
              tasks: {
                type: 'array',
                title: t('Task'),
                'x-component': 'ArrayTabs',
                'x-component-props': {
                  size: 'small',
                },
                default: dn.getSchemaAttribute('x-component-props.tasks'),
                items: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      title: t('Title'),
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-decorator-props': {
                        tooltip: t('Label for task selection buttons when multiple tasks exist'),
                      },
                    },
                    message: {
                      type: 'object',
                      properties: {
                        system: {
                          title: t('Background'),
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-decorator-props': {
                            tooltip: t(
                              'Additional system prompt appended to the AI employee’s definition, used to refine instructions',
                            ),
                          },
                          'x-component': 'AIVariableRawTextArea',
                          'x-component-props': {
                            currentSchema,
                            messageType: 'system',
                          },
                        },
                        user: {
                          title: t('Default user message'),
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-component': 'AIVariableRawTextArea',
                          'x-component-props': {
                            currentSchema,
                          },
                        },
                        attachments: {
                          title: t('Files'),
                          type: 'array',
                          'x-decorator': 'FormItem',
                          'x-decorator-props': {
                            tooltip: t('Please select file objects.'),
                          },
                          'x-component': 'ArrayItems',
                          items: {
                            type: 'void',
                            'x-component': 'Space',
                            properties: {
                              sort: {
                                type: 'void',
                                'x-decorator': 'FormItem',
                                'x-component': 'ArrayItems.SortHandle',
                              },
                              input: {
                                type: 'string',
                                'x-decorator': 'FormItem',
                                'x-component': 'Variable.Input',
                                'x-component-props': {
                                  scope,
                                  changeOnSelect: true,
                                },
                              },
                              remove: {
                                type: 'void',
                                'x-decorator': 'FormItem',
                                'x-component': 'ArrayItems.Remove',
                              },
                            },
                          },
                          properties: {
                            add: {
                              type: 'void',
                              title: t('Add file'),
                              'x-component': 'ArrayItems.Addition',
                            },
                          },
                        },
                      },
                    },
                    autoSend: {
                      type: 'boolean',
                      'x-content': t('Send default user message automatically'),
                      'x-decorator': 'FormItem',
                      'x-component': 'Checkbox',
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
                const { taskDesc, tasks } = form.values;
                dn.deepMerge({
                  'x-uid': dn.getSchemaAttribute('x-uid'),
                  'x-component-props': {
                    username,
                    tasks,
                    taskDesc,
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
    // {
    //   name: 'linkageRules',
    //   Component: SchemaSettingsLinkageRules,
    //   useComponentProps() {
    //     const { linkageRulesProps } = useSchemaToolbar();
    //     return {
    //       ...linkageRulesProps,
    //       type: 'button',
    //     };
    //   },
    // },
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
