/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useBlockContext, useOpenModeContext } from '../../../../';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsItemType } from '../../../../application/schema-settings/types';
import {
  useColumnSchema,
  useTableFieldInstanceList,
} from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { useDesignable } from '../../../../schema-component/hooks/useDesignable';
import { SchemaSettingOpenModeSchemaItems } from '../../../../schema-items';
export const ellipsisSettingsItem: SchemaSettingsItemType = {
  name: 'ellipsis',
  type: 'switch',
  useComponentProps() {
    const { fieldSchema: tableFieldSchema } = useColumnSchema();
    const tableFieldInstanceList = useTableFieldInstanceList();
    const fieldSchema = useFieldSchema();
    const formField = useField();
    const { dn } = useDesignable();
    const { t } = useTranslation();

    const schema = tableFieldSchema || fieldSchema;
    const hidden = tableFieldSchema
      ? tableFieldInstanceList[0]
        ? !tableFieldInstanceList[0].readPretty
        : !tableFieldSchema['x-read-pretty']
      : !formField.readPretty;

    return {
      title: t('Ellipsis overflow content'),
      checked: !!schema['x-component-props']?.ellipsis,
      hidden,
      onChange: async (checked) => {
        if (tableFieldSchema && tableFieldInstanceList) {
          tableFieldInstanceList.forEach((fieldInstance) => {
            fieldInstance.componentProps.ellipsis = checked;
          });
        } else {
          formField.componentProps.ellipsis = checked;
        }

        _.set(schema, 'x-component-props.ellipsis', checked);

        await dn.emit('patch', {
          schema: {
            'x-uid': schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
              ellipsis: checked,
            },
          },
        });
      },
    };
  },
};

export const enableLinkSettingsItem: SchemaSettingsItemType = {
  name: 'enableLink',
  type: 'switch',
  useVisible() {
    const field = useField();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    const { name } = useBlockContext() || {};
    return name !== 'kanban' && (fieldSchema?.['x-read-pretty'] || field.readPretty);
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    const { dn } = useDesignable();
    return {
      title: t('Enable link'),
      checked: fieldSchema?.['x-component-props']?.enableLink,
      onChange(flag) {
        fieldSchema['x-component-props'] = {
          ...fieldSchema?.['x-component-props'],
          enableLink: flag,
        };
        field.componentProps['enableLink'] = flag;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema?.['x-component-props'],
            },
          },
        });
      },
    };
  },
};

export const enableScanSettingsItem: SchemaSettingsItemType = {
  name: 'enableScan',
  type: 'switch',
  useVisible() {
    const field = useField();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    return !fieldSchema?.['x-read-pretty'] && !field.readPretty;
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    const { dn } = useDesignable();
    return {
      title: t('Enable Scan'),
      checked: fieldSchema?.['x-component-props']?.enableScan,
      onChange(flag) {
        fieldSchema['x-component-props'] = {
          ...fieldSchema?.['x-component-props'],
          enableScan: flag,
        };
        field.componentProps['enableScan'] = flag;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema?.['x-component-props'],
            },
          },
        });
      },
    };
  },
};

export const disableManualInputSettingsItem: SchemaSettingsItemType = {
  name: 'disableManualInput',
  type: 'switch',
  useVisible() {
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    return fieldSchema['x-component-props']?.enableScan;
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    const { dn } = useDesignable();
    return {
      title: t('Disable manual input'),
      checked: fieldSchema?.['x-component-props']?.disableManualInput,
      onChange(flag) {
        fieldSchema['x-component-props'] = {
          ...fieldSchema?.['x-component-props'],
          disableManualInput: flag,
        };
        field.componentProps['disableManualInput'] = flag;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema?.['x-component-props'],
            },
          },
        });
      },
    };
  },
};

export const openModeSettingsItem: SchemaSettingsItemType = {
  name: 'openMode',
  Component: SchemaSettingOpenModeSchemaItems,
  useComponentProps() {
    const { hideOpenMode } = useOpenModeContext();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;

    return {
      openMode: !hideOpenMode,
      openSize: !hideOpenMode,
      targetSchema: fieldSchema,
    };
  },
  useVisible() {
    const field = useField();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    return (fieldSchema?.['x-read-pretty'] || field.readPretty) && fieldSchema?.['x-component-props']?.enableLink;
  },
};

export const autoFocusSettingsItem: SchemaSettingsItemType = {
  name: 'autoFocus',
  type: 'switch',
  useVisible() {
    const field = useField();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    return !fieldSchema?.['x-read-pretty'] && !field.readPretty;
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = columnSchema || schema;
    const { dn } = useDesignable();
    return {
      title: t('Auto focus'),
      checked: fieldSchema?.['x-component-props']?.autoFocus,
      onChange(flag) {
        fieldSchema['x-component-props'] = {
          ...fieldSchema?.['x-component-props'],
          autoFocus: flag,
        };
        field.componentProps['autoFocus'] = flag;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema?.['x-component-props'],
            },
          },
        });
      },
    };
  },
};

export const inputComponentSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input',
  items: [
    ellipsisSettingsItem,
    enableLinkSettingsItem,
    openModeSettingsItem,
    enableScanSettingsItem,
    disableManualInputSettingsItem,
    autoFocusSettingsItem,
  ],
});
