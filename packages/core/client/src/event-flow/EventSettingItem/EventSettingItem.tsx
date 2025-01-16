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
} from '@nocobase/client';
import React from 'react';
import { ISchema, useField } from '@formily/react';
import EventsSetting from './EventSetting';
import { SchemaSettingsKey, useEvent } from '..';
import { useFieldSchema } from '@formily/react';

export const EventSettingItem = () => {
  // const field = useField();
  const filed = useField();
  const schema = useFieldSchema();
  const { patch } = useDesignable();
  const app = useApp();
  const { definitions, register } = useEvent();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  console.log('definitions', definitions);
  return (
    <SchemaSettingsModalItem
      title={'Event Setting'}
      components={{ EventsSetting }}
      initialValues={{}}
      scope={{}}
      schema={
        {
          type: 'object',
          title: '事件配置',
          properties: {
            events: {
              type: 'array',
              default: fieldSchema?.[SchemaSettingsKey] || [],
              'x-decorator': 'FormItem',
              'x-component': 'EventsSetting',
              'x-component-props': {
                modules: definitions,
              },
            },
          },
        } as ISchema
      }
      onSubmit={({ events }) => {
        console.log('onSubmit', events);
        fieldSchema[SchemaSettingsKey] = events;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            [SchemaSettingsKey]: events,
          },
        });
        register(events);
        dn.refresh();
      }}
    />
  );
};
