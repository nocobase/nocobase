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
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useFormBlockContext } from '../../../../block-provider/FormBlockProvider';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../../collection-manager';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { useCollectionField, useDataBlockProps } from '../../../../data-source';
import { useRecord } from '../../../../record-provider';
import { removeNullCondition, useDesignable, useFieldModeOptions, useIsAddNewForm } from '../../../../schema-component';
import { isSubMode } from '../../../../schema-component/antd/association-field/util';
import { DynamicComponentProps } from '../../../../schema-component/antd/filter/DynamicComponent';
import {
  useIsAssociationField,
  useIsFieldReadPretty,
  useIsSelectFieldMode,
  useTitleFieldOptions,
} from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { VariableInput, getShouldChange } from '../../../../schema-settings';
import { SchemaSettingsDataScope } from '../../../../schema-settings/SchemaSettingsDataScope';
import { SchemaSettingsSortingRule } from '../../../../schema-settings/SchemaSettingsSortingRule';
import { useIsShowMultipleSwitch } from '../../../../schema-settings/hooks/useIsShowMultipleSwitch';
import { useLocalVariables, useVariables } from '../../../../variables';
import { useOpenModeContext } from '../../../popup/OpenModeProvider';
import { ellipsisSettingsItem, enableLinkSettingsItem, openModeSettingsItem } from '../Input/inputComponentSettings';

const enableLink = {
  name: 'enableLink',
  type: 'switch',
  useVisible() {
    const field = useField();
    return field.readPretty;
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = tableColumnSchema || schema;
    const { dn } = useDesignable();
    return {
      title: t('Enable link'),
      checked: fieldSchema['x-component-props']?.enableLink !== false,
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

export const titleField: any = {
  name: 'titleField',
  type: 'select',
  useComponentProps() {
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
    return {
      title: t('Title field'),
      options,
      value: fieldNames?.label,
      onChange(label) {
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
      },
    };
  },
};

export const getAllowMultiple = (params?: { title: string }) => {
  const title = params?.title || 'Allow multiple';

  return {
    name: 'allowMultiple',
    type: 'switch',
    useVisible() {
      const isAssociationField = useIsAssociationField();
      return isAssociationField;
    },
    useComponentProps() {
      const { t } = useTranslation();
      const field = useField<Field>();
      const { fieldSchema: tableColumnSchema } = useColumnSchema();
      const schema = useFieldSchema();
      const fieldSchema = tableColumnSchema || schema;
      const { dn, refresh } = useDesignable();
      return {
        title: t(title),
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
};

const quickCreate: any = {
  name: 'quickCreate',
  type: 'select',
  useComponentProps() {
    const { defaultOpenMode } = useOpenModeContext();
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn, insertAdjacent } = useDesignable();
    return {
      title: t('Quick create'),
      options: [
        { label: t('None'), value: 'none' },
        { label: t('Dropdown'), value: 'quickAdd' },
        { label: t('Pop-up'), value: 'modalAdd' },
      ],
      value: field.componentProps?.addMode || 'none',
      onChange(mode) {
        if (mode === 'modalAdd') {
          const hasAddNew = fieldSchema.reduceProperties((buf, schema) => {
            if (schema['x-component'] === 'Action') {
              return schema;
            }
            return buf;
          }, null);

          if (!hasAddNew) {
            const addNewActionSchema = {
              'x-action': 'create',
              'x-acl-action': 'create',
              title: "{{t('Add new')}}",
              // 'x-designer': 'Action.Designer',
              'x-toolbar': 'ActionSchemaToolbar',
              'x-toolbar-props': {
                draggable: false,
              },
              'x-settings': 'actionSettings:addNew',
              'x-component': 'Action',
              'x-decorator': 'ACLActionProvider',
              'x-component-props': {
                openMode: defaultOpenMode,
                type: 'default',
                component: 'CreateRecordAction',
              },
            };
            insertAdjacent('afterBegin', addNewActionSchema);
          }
        }
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['addMode'] = mode;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps.addMode = mode;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
};

const setDefaultSortingRules = {
  name: 'setDefaultSortingRules',
  Component: SchemaSettingsSortingRule,
};

export const setTheDataScope: any = {
  name: 'setTheDataScope',
  Component: SchemaSettingsDataScope,
  useComponentProps() {
    const { getCollectionJoinField, getAllCollectionsInheritChain } = useCollectionManager_deprecated();
    const { getField } = useCollection_deprecated();
    const { form } = useFormBlockContext();
    const record = useRecord();
    const field = useField();
    const { fieldSchema: tableColumnSchema, collectionField: tableColumnField } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = tableColumnSchema || schema;
    const collectionField =
      tableColumnField || getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
    const variables = useVariables();
    const localVariables = useLocalVariables();
    const { dn } = useDesignable();
    return {
      collectionName: collectionField?.target,
      defaultFilter: fieldSchema?.['x-component-props']?.service?.params?.filter || {},
      form,
      dynamicComponent: (props: DynamicComponentProps) => {
        return (
          <VariableInput
            {...props}
            form={form}
            collectionField={props.collectionField}
            record={record}
            shouldChange={getShouldChange({
              collectionField: props.collectionField,
              variables,
              localVariables,
              getAllCollectionsInheritChain,
            })}
          />
        );
      },
      onSubmit: ({ filter }) => {
        filter = removeNullCondition(filter);
        _.set(fieldSchema['x-component-props'], 'service.params.filter', filter);
        _.set(field.componentProps, 'service.params.filter', filter);
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
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
    const { fieldSchema: tableColumnSchema, collectionField } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = tableColumnSchema || schema;
    const fieldModeOptions = useFieldModeOptions({ fieldSchema: tableColumnSchema, collectionField });
    const isAddNewForm = useIsAddNewForm();
    const fieldMode = useFieldComponentName();
    const { dn } = useDesignable();
    return {
      title: t('Field component'),
      options: fieldModeOptions,
      value: fieldMode,
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

export const selectComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Select',
  items: [
    {
      ...fieldComponent,
      useVisible: useIsAssociationField,
    },
    {
      ...setTheDataScope,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFieldReadPretty = useIsFieldReadPretty();
        return isSelectFieldMode && !isFieldReadPretty;
      },
    },
    {
      ...setDefaultSortingRules,
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        return {
          fieldSchema,
        };
      },
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFieldReadPretty = useIsFieldReadPretty();
        return isSelectFieldMode && !isFieldReadPretty;
      },
    },
    {
      ...quickCreate,
      useVisible() {
        const isAssociationField = useIsAssociationField();
        const readPretty = useIsFieldReadPretty();
        const { fieldSchema } = useColumnSchema();
        const { type } = useDataBlockProps() || ({} as any);
        return isAssociationField && !fieldSchema && !readPretty && type !== 'publicForm';
      },
    },
    {
      ...getAllowMultiple(),
      useVisible() {
        const isFieldReadPretty = useIsFieldReadPretty();
        const isAssociationField = useIsAssociationField();
        const IsShowMultipleSwitch = useIsShowMultipleSwitch();
        return !isFieldReadPretty && isAssociationField && IsShowMultipleSwitch();
      },
    },
    {
      ...titleField,
      useVisible: useIsAssociationField,
    },
    {
      ...enableLink,
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        return useIsAssociationField() && readPretty;
      },
    },
    ellipsisSettingsItem,
    {
      ...enableLinkSettingsItem,
      useVisible() {
        const collectionField = useCollectionField();
        const readPretty = useIsFieldReadPretty();
        return !useIsAssociationField() && readPretty && collectionField.interface !== 'multipleSelect';
      },
    },
    {
      ...openModeSettingsItem,
      useVisible() {
        const field = useField();
        const isAssociationField = useIsAssociationField();
        const { fieldSchema: columnSchema } = useColumnSchema();
        const schema = useFieldSchema();
        const fieldSchema = columnSchema || schema;
        return (
          (fieldSchema?.['x-read-pretty'] || field.readPretty) &&
          (fieldSchema?.['x-component-props']?.enableLink ||
            (isAssociationField && fieldSchema?.['x-component-props']?.enableLink !== false))
        );
      },
    },
  ],
});

/**
 * Used for Select fields in filter form blocks
 */
export const filterSelectComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:FilterSelect',
  items: [
    {
      ...fieldComponent,
      useVisible: useIsAssociationField,
    },
    {
      ...setTheDataScope,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFieldReadPretty = useIsFieldReadPretty();
        return isSelectFieldMode && !isFieldReadPretty;
      },
    },
    {
      ...setDefaultSortingRules,
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        return {
          fieldSchema,
        };
      },
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFieldReadPretty = useIsFieldReadPretty();
        return isSelectFieldMode && !isFieldReadPretty;
      },
    },
    getAllowMultiple({ title: 'Allow multiple selection' }),
    {
      ...titleField,
      useVisible: useIsAssociationField,
    },
    {
      ...enableLink,
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        return useIsAssociationField() && readPretty;
      },
    },
  ],
});
