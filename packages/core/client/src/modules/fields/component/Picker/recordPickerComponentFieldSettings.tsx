/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { useCollectionField } from '../../../../data-source';
import { useDesignable, useFieldModeOptions, useIsAddNewForm } from '../../../../schema-component';
import { isSubMode } from '../../../../schema-component/antd/association-field/util';
import { allowAddNew, useIsFieldReadPretty } from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { getAllowMultiple, titleField } from '../Select/selectComponentFieldSettings';

const allowMultiple: any = {
  name: 'allowMultiple',
  type: 'switch',
  useVisible() {
    const isFieldReadPretty = useIsFieldReadPretty();
    const collectionField = useCollectionField();
    return !isFieldReadPretty && ['hasMany', 'belongsToMany', 'belongsToArray'].includes(collectionField?.type);
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn, refresh } = useDesignable();
    return {
      title: t('Allow multiple'),
      checked:
        fieldSchema['x-component-props']?.multiple === undefined ? true : fieldSchema['x-component-props'].multiple,
      onChange(value) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        field.componentProps = field.componentProps || {};

        fieldSchema['x-component-props'].multiple = value;
        field.componentProps.multiple = value;

        schema['x-component-props'] = fieldSchema['x-component-props'];
        dn.emit('patch', {
          schema,
        });
        refresh();
      },
    };
  },
};

const fieldComponent: any = {
  name: 'fieldComponent',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const isAddNewForm = useIsAddNewForm();
    const fieldComponentName = useFieldComponentName();
    const { fieldSchema: tableColumnSchema, collectionField } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = tableColumnSchema || schema;
    const fieldModeOptions = useFieldModeOptions({ fieldSchema: tableColumnSchema, collectionField });
    const { dn } = useDesignable();
    return {
      title: t('Field component'),
      options: fieldModeOptions,
      value: fieldComponentName,
      onChange(mode) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['mode'] = mode;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps.mode = mode;

        // 子表单状态不允许设置默认值
        if (isSubMode(fieldSchema) && isAddNewForm) {
          // @ts-ignore
          schema.default = null;
          fieldSchema.default = null;
          field?.setInitialValue?.(null);
          field?.setValue?.(null);
        }

        void dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
};

export const recordPickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Picker',
  items: [
    fieldComponent,
    {
      name: 'popupSize',
      type: 'select',
      useVisible() {
        const isFieldReadPretty = useIsFieldReadPretty();
        return !isFieldReadPretty;
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const schema = useFieldSchema();
        const fieldSchema = tableColumnSchema || schema;
        const { dn } = useDesignable();
        return {
          title: t('Popup size'),
          options: [
            { label: t('Small'), value: 'small' },
            { label: t('Middle'), value: 'middle' },
            { label: t('Large'), value: 'large' },
          ],
          value:
            fieldSchema?.['x-component-props']?.['openSize'] ??
            (fieldSchema?.['x-component-props']?.['openMode'] == 'modal' ? 'large' : 'middle'),
          onChange: (value) => {
            field.componentProps.openSize = value;
            fieldSchema['x-component-props'] = { ...fieldSchema['x-component-props'], openSize: value };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    allowAddNew,
    allowMultiple,
    titleField,
  ],
});

// For filter form fields
export const filterRecordPickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:FilterPicker',
  items: [
    fieldComponent,
    {
      name: 'popupSize',
      type: 'select',
      useVisible() {
        const isFieldReadPretty = useIsFieldReadPretty();
        return !isFieldReadPretty;
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const schema = useFieldSchema();
        const fieldSchema = tableColumnSchema || schema;
        const { dn } = useDesignable();
        return {
          title: t('Popup size'),
          options: [
            { label: t('Small'), value: 'small' },
            { label: t('Middle'), value: 'middle' },
            { label: t('Large'), value: 'large' },
          ],
          value:
            fieldSchema?.['x-component-props']?.['openSize'] ??
            (fieldSchema?.['x-component-props']?.['openMode'] == 'modal' ? 'large' : 'middle'),
          onChange: (value) => {
            field.componentProps.openSize = value;
            fieldSchema['x-component-props'] = { ...fieldSchema['x-component-props'], openSize: value };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    allowAddNew,
    getAllowMultiple({ title: 'Allow multiple selection' }),
    titleField,
  ],
});
