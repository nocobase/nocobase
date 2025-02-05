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
  Filter,
} from '@nocobase/client';
import React, { useEffect, useMemo } from 'react';
import { ISchema, useField } from '@formily/react';
import { SchemaSettingsKey, useEvent } from '..';
import { useFieldSchema } from '@formily/react';
import { useLinkageCollectionFieldOptions } from './ActionsSetting/action-hooks';
import EventSelect from './EventSelect';
import { ArrayCollapse } from './components/LinkageHeader';
import { css } from '@emotion/css';
import { FormItem, FormLayout } from '@formily/antd-v5';
import { rulesSchema } from './schemas/rules';
import { ActionSelect } from './components/ActionSelect';
import { ActionParamSelect } from './components/ActionParamSelect';
import ConditionSelect from './components/ConditionSelect';
import { Space } from 'antd';
import { ActionParamValueInput } from './components/ActionParamValueInput';

// packages/core/client/src/schema-settings/SchemaSettings.tsx
export const EventSettingItem = (props) => {
  // const field = useField();
  const filed = useField();
  const { patch } = useDesignable();
  const app = useApp();
  const { definitions, register } = useEvent();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();

  return (
    <SchemaSettingsModalItem
      title={'Event Setting'}
      components={{
        ArrayCollapse,
        // ActionsSetting,
        EventSelect,
        // FormLayout,
        // Filter,
        Space,
        ActionParamSelect,
        ActionSelect,
        ConditionSelect,
        ActionParamValueInput,
      }}
      initialValues={{ events: fieldSchema[SchemaSettingsKey] }}
      scope={{
        emptyParams: (field, target) => {
          const params = field.query('.params').take(1);
          params.value = [];
        },
      }}
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
                    'x-content': '{{ t("执行规则") }}',
                  },
                  actionsBlock: rulesSchema,
                  // actionsBlock: {
                  // type: 'void',
                  // 'x-component': ActionsSetting,
                  // 'x-use-component-props': () => {
                  //   return {
                  //     options,
                  //     linkageOptions,
                  //     category: 'default',
                  //     elementType: 'field',
                  //     collectionName,
                  //     // form,
                  //     variables,
                  //     localVariables,
                  //     formBlockType,
                  //   };
                  // },
                  // },
                  remove: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.Remove',
                  },
                },
              },
              properties: {
                add: {
                  type: 'void',
                  title: '{{ t("添加事件") }}',
                  'x-component': 'ArrayCollapse.Addition',
                },
              },
            },
          },
        } as ISchema
      }
      onSubmit={({ events }) => {
        console.log('todo onSubmit', JSON.parse(JSON.stringify(events)));
        fieldSchema[SchemaSettingsKey] = events;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            [SchemaSettingsKey]: events,
          },
        });
        // register(events);
        dn.refresh();
      }}
    />
  );
};
