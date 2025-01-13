/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../schema-component/hooks/useDesignable';
import { SchemaSettingsModalItem } from './SchemaSettings';
import { useCollectionField } from '../data-source';
import { useColumnSchema } from '../schema-component/antd/table-v2/Table.Column.Decorator';
import { useTitleFieldOptions } from '../schema-component/antd/form-item/FormItem.Settings';

export function SchemaSettingsTitleField() {
  const { t } = useTranslation();
  const field = useField<Field>();
  const { dn } = useDesignable();
  const options = useTitleFieldOptions();
  const { uiSchema, fieldSchema: tableColumnSchema, collectionField: tableColumnField } = useColumnSchema();
  const schema = useFieldSchema();
  const fieldSchema = tableColumnSchema || schema;
  const targetCollectionField = useCollectionField();
  const collectionField = tableColumnField || targetCollectionField;
  const fieldNames = {
    ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
    ...field?.componentProps?.fieldNames,
    ...fieldSchema?.['x-component-props']?.['fieldNames'],
  };
  return (
    <SchemaSettingsModalItem
      title={t('Title field')}
      schema={
        {
          type: 'object',
          title: t('Title field'),
          properties: {
            label: {
              type: 'string',
              default: fieldNames?.label,
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              enum: options,
              'x-component-props': {
                mode: 'multiple',
              },
            },
          },
        } as ISchema
      }
      onSubmit={({ label }) => {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        const newFieldNames = {
          ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
          ...fieldSchema['x-component-props']?.['fieldNames'],
          label,
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['fieldNames'] = newFieldNames;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps.fieldNames = fieldSchema['x-component-props'].fieldNames;
        const path = field.path?.splice(field.path?.length - 1, 1);
        field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
          f.componentProps.fieldNames = fieldNames;
        });
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
}
