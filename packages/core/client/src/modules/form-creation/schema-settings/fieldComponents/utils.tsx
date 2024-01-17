import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../../block-provider';
import { useCollection, useCollectionManager } from '../../../../collection-manager';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { useRecord } from '../../../../record-provider';
import { removeNullCondition, useDesignable, useFieldModeOptions, useIsAddNewForm } from '../../../../schema-component';
import { isSubMode } from '../../../../schema-component/antd/association-field/util';
import { DynamicComponentProps } from '../../../../schema-component/antd/filter/DynamicComponent';
import {
  useIsFieldReadPretty,
  useTitleFieldOptions,
} from '../../../../schema-component/antd/form-item/FormItem.Settings';
import {
  SchemaSettingsDataScope,
  SchemaSettingsSortingRule,
  VariableInput,
  getShouldChange,
} from '../../../../schema-settings';
import { useLocalVariables, useVariables } from '../../../../variables';

export const fieldComponent: any = {
  name: 'fieldComponent',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn } = useDesignable();
    const fieldModeOptions = useFieldModeOptions();
    const isAddNewForm = useIsAddNewForm();
    const fieldComponentName = useFieldComponentName();

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
          field.setInitialValue(null);
          field.setValue(null);
        }

        void dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
};

export const setTheDataScope: any = {
  name: 'setTheDataScope',
  Component: SchemaSettingsDataScope,
  useComponentProps() {
    const { getCollectionJoinField, getAllCollectionsInheritChain } = useCollectionManager();
    const { getField } = useCollection();
    const { form } = useFormBlockContext();
    const record = useRecord();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
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
        _.set(field.componentProps, 'service.params.filter', filter);
        fieldSchema['x-component-props'] = field.componentProps;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': field.componentProps,
          },
        });
      },
    };
  },
};

export const setDefaultSortingRules = {
  name: 'setDefaultSortingRules',
  Component: SchemaSettingsSortingRule,
};

export const quickCreate: any = {
  name: 'quickCreate',
  type: 'select',
  useComponentProps() {
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
            const addNewActionschema = {
              'x-action': 'create',
              'x-acl-action': 'create',
              title: "{{t('Add new')}}",
              // 'x-designer': 'Action.Designer',
              'x-toolbar': 'ActionSchemaToolbar',
              'x-settings': 'actionSettings:addNew',
              'x-component': 'Action',
              'x-decorator': 'ACLActionProvider',
              'x-component-props': {
                openMode: 'drawer',
                type: 'default',
                component: 'CreateRecordAction',
              },
            };
            insertAdjacent('afterBegin', addNewActionschema);
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

export const allowMultiple: any = {
  name: 'allowMultiple',
  type: 'switch',
  useVisible() {
    const isFieldReadPretty = useIsFieldReadPretty();
    const collectionField = useCollectionField();
    return !isFieldReadPretty && ['hasMany', 'belongsToMany'].includes(collectionField?.type);
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

export const titleField: any = {
  name: 'titleField',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn } = useDesignable();
    const options = useTitleFieldOptions();
    const collectionField = useCollectionField();

    return {
      title: t('Title field'),
      options,
      value: field?.componentProps?.fieldNames?.label,
      onChange(label) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        const fieldNames = {
          ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
          ...field.componentProps.fieldNames,
          label,
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['fieldNames'] = fieldNames;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps.fieldNames = fieldSchema['x-component-props'].fieldNames;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
};

export const enableLink = {
  name: 'enableLink',
  type: 'switch',
  useVisible() {
    const field = useField();
    return field.readPretty;
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
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
        dn.refresh();
      },
    };
  },
};

/**
 * 获取字段相关的配置信息
 * @returns
 */
export function useCollectionField() {
  const { getCollectionJoinField } = useCollectionManager();
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  return collectionField;
}
