/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useColumnSchema } from '../../../../schema-component/antd/table/Table.Column.Decorator';
import { useDesignable } from '../../../../schema-component/hooks/useDesignable';

export const previewComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Preview',
  items: [
    {
      name: 'size',
      type: 'select',
      useVisible() {
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const isInTable = tableColumnSchema?.parent?.['x-component'] === 'TableV2.Column';
        return !isInTable;
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        return {
          title: t('Size'),
          options: [
            { label: t('Large'), value: 'large' },
            { label: t('Default'), value: 'default' },
            { label: t('Small'), value: 'small' },
          ],
          value: field?.componentProps?.size || 'default',
          onChange(size) {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['size'] = size;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.size = size;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'showFileName',
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const schema = useFieldSchema();
        const fieldSchema = tableColumnSchema || schema;
        const { dn, refresh } = useDesignable();
        return {
          title: t('Show file name'),
          checked: fieldSchema['x-component-props']?.showFileName !== (false as boolean),
          onChange(value) {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            field.componentProps.showFileName = value;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].showFileName = value;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            dn.emit('patch', {
              schema,
            });
            refresh();
          },
        };
      },
      useVisible() {
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const field = useField();
        const form = useForm();
        const isReadPretty = tableColumnSchema?.['x-read-pretty'] || field.readPretty || form.readPretty;
        console.log(isReadPretty);
        return isReadPretty;
      },
    },
  ],
});
