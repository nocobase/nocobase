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
import { useColumnSchema, useIsFieldReadPretty, SchemaSettings, useDesignable } from '@nocobase/client';

const fieldComponent: any = {
  name: 'fieldComponent',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = tableColumnSchema || schema;
    const { dn } = useDesignable();

    return {
      title: t('Field component'),
      options: [
        { label: t('URL'), value: 'url' },
        { label: t('Preview'), value: 'preview' },
      ],
      value: fieldSchema['x-component-props']['componentMode'] || 'preview',
      onChange(componentMode) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['componentMode'] = componentMode;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps.componentMode = componentMode;
        void dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
  useVisible() {
    const readPretty = useIsFieldReadPretty();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    return readPretty;
  },
};

export const attachmentUrlComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:AttachmentUrl',
  items: [
    {
      name: 'quickUpload',
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const schema = useFieldSchema();
        const fieldSchema = tableColumnSchema || schema;
        const { dn, refresh } = useDesignable();
        return {
          title: t('Quick upload'),
          checked: fieldSchema['x-component-props']?.quickUpload !== (false as boolean),
          onChange(value) {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            field.componentProps.quickUpload = value;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].quickUpload = value;
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
        return !isReadPretty && !field.componentProps.underFilter;
      },
    },
    {
      name: 'selectFile',
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const schema = useFieldSchema();
        const fieldSchema = tableColumnSchema || schema;
        const { dn, refresh } = useDesignable();
        return {
          title: t('Select file'),
          checked: fieldSchema['x-component-props']?.selectFile !== (false as boolean),
          onChange(value) {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            field.componentProps.selectFile = value;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].selectFile = value;
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
        return !isReadPretty && !field.componentProps.underFilter;
      },
    },
    fieldComponent,
    {
      name: 'size',
      type: 'select',
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        return readPretty && !tableColumnSchema;
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
  ],
});
