/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaSettingsModalItem,
  SchemaSettingsItem,
  useDesignable,
  useApp,
  usePlugin,
  useSchemaSettings,
  useLinkageCollectionFilterOptions,
  useFormBlockContext,
  useVariables,
  useLocalVariables,
  useFormBlockType,
  useRecord,
} from '@nocobase/client';
import React, { useMemo } from 'react';
import { ISchema, useField } from '@formily/react';
import { SchemaSettingsKey, useEvent } from '..';
import { useFieldSchema } from '@formily/react';
import { useLinkageCollectionFieldOptions } from './ActionsSetting/action-hooks';
import { ActionsSetting } from './ActionsSetting';
import EventSelect from './EventSelect';
import { ArrayCollapse } from './components/LinkageHeader';
import { css } from '@emotion/css';
import { useFilterOptions } from './hooks/useFilterOptions';
import { FormItem, FormLayout } from '@formily/antd-v5';

// packages/core/client/src/schema-settings/SchemaSettings.tsx
export const EventSettingItem = (props) => {
  // const field = useField();
  const filed = useField();
  const schema = useFieldSchema();
  const { patch } = useDesignable();
  const app = useApp();
  const { definitions, register } = useEvent();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const { readPretty, Component, afterSubmit } = props;
  const collectionName = 't_aierml1wni1';
  const options = useLinkageCollectionFilterOptions(collectionName);
  const linkageOptions = useLinkageCollectionFieldOptions(collectionName, readPretty);
  const ff = useFormBlockContext();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { type: formBlockType } = useFormBlockType();
  const record = useRecord();
  return (
    <SchemaSettingsModalItem
      title={'Event Setting'}
      components={{ ArrayCollapse, ActionsSetting, EventSelect, FormLayout }}
      initialValues={{}}
      scope={{}}
      width={1000}
      schema={
        {
          type: 'object',
          title: '事件配置',
          properties: {
            events: {
              type: 'array',
              // default: defaultValues,
              'x-component': 'ArrayCollapse',
              'x-decorator': 'FormItem',
              'x-component-props': {
                accordion: true,
                titleRender: (item: any, index: number) => {
                  return `事件 ${index + 1}`;
                },
              },
              items: {
                type: 'object',
                'x-component': 'ArrayCollapse.CollapsePanel',
                'x-component-props': {
                  // extra: <EnableLinkage />,
                },
                properties: {
                  layout: {
                    type: 'void',
                    'x-component': 'FormLayout',
                    'x-component-props': {
                      labelStyle: {
                        marginTop: '4px',
                      },
                      labelCol: 8,
                      wrapperCol: 16,
                    },
                    properties: {
                      eventTitle: {
                        'x-component': 'h4',
                        'x-content': '{{ t("触发事件") }}',
                      },
                      event: {
                        'x-component': EventSelect,
                        'x-component-props': {
                          definitions,
                          className: css`
                            margin-bottom: 12px;
                          `,
                        },
                      },
                      actionTitle: {
                        'x-component': 'h4',
                        'x-content': '{{ t("执行动作") }}',
                      },
                      actions: {
                        type: 'void',
                        'x-component': ActionsSetting,
                        'x-use-component-props': () => {
                          return {
                            definitions,
                            options,
                            linkageOptions,
                            category: 'default',
                            elementType: 'field',
                            collectionName,
                            // form,
                            variables,
                            localVariables,
                            record,
                            formBlockType,
                          };
                        },
                      },
                    },
                  },
                  remove: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.Remove',
                  },
                },
              },
              properties: {
                add: {
                  type: 'void',
                  title: '{{ t("Add events") }}',
                  'x-component': 'ArrayCollapse.Addition',
                },
              },
            },
          },
        } as ISchema
      }
      onSubmit={({ events }) => {
        console.log('todo onSubmit', JSON.parse(JSON.stringify(events)));
        // fieldSchema[SchemaSettingsKey] = events;
        // dn.emit('patch', {
        //   schema: {
        //     'x-uid': fieldSchema['x-uid'],
        //     [SchemaSettingsKey]: events,
        //   },
        // });
        // register(events);
        // dn.refresh();
      }}
    />
  );
};
