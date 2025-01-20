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
import React from 'react';
import { ISchema, useField } from '@formily/react';
import { SchemaSettingsKey, useEvent } from '..';
import { useFieldSchema } from '@formily/react';
import { useLinkageCollectionFieldOptions } from './ActionsSetting/action-hooks';
import { EventsSetting } from './EventsSetting';

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
  console.log('definitions', definitions);
  const { readPretty, Component, afterSubmit } = props;
  const collectionName = 't_aierml1wni1';
  const options = useLinkageCollectionFilterOptions(collectionName);
  const linkageOptions = useLinkageCollectionFieldOptions(collectionName, readPretty);
  const { form } = useFormBlockContext();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { type: formBlockType } = useFormBlockType();
  const record = useRecord();

  return (
    <SchemaSettingsModalItem
      title={'Event Setting'}
      components={{ EventsSetting }}
      initialValues={{}}
      scope={{}}
      width={1000}
      schema={
        {
          type: 'object',
          title: '事件配置',
          properties: {
            events: {
              'x-component': EventsSetting,
              'x-use-component-props': () => {
                return {
                  definitions,
                  options,
                  defaultValues: undefined,
                  linkageOptions,
                  category: 'default',
                  elementType: 'field',
                  collectionName,
                  form,
                  variables,
                  localVariables,
                  record,
                  formBlockType,
                };
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
