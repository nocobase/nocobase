/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import {
  useCollectionField,
  useCollectionManager_deprecated,
  useCollection_deprecated,
  useCompile,
  useDesignable,
  useFieldComponentName,
  useFieldModeOptions,
  useIsAddNewForm,
  useTitleFieldOptions,
} from '@nocobase/client';
import { useDepartmentTranslation } from '../locale';
import { Field } from '@formily/core';
import { useField, useFieldSchema, ISchema } from '@formily/react';

export const titleField: any = {
  name: 'titleField',
  type: 'select',
  useComponentProps() {
    const { t } = useDepartmentTranslation();
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
        field.componentProps.fieldNames = fieldSchema['x-component-props']?.fieldNames;
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

export const isCollectionFieldComponent = (schema: ISchema) => {
  return schema['x-component'] === 'CollectionField';
};

const useColumnSchema = () => {
  const { getField } = useCollection_deprecated();
  const compile = useCompile();
  const columnSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const fieldSchema = columnSchema.reduceProperties((buf, s) => {
    if (isCollectionFieldComponent(s)) {
      return s;
    }
    return buf;
  }, null);
  if (!fieldSchema) {
    return {};
  }

  const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  return { columnSchema, fieldSchema, collectionField, uiSchema: compile(collectionField?.uiSchema) };
};

export const enableLink = {
  name: 'enableLink',
  type: 'switch',
  useVisible() {
    const field = useField();
    return field.readPretty;
  },
  useComponentProps() {
    const { t } = useDepartmentTranslation();
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
        dn.refresh();
      },
    };
  },
};

export const fieldComponent: any = {
  name: 'fieldComponent',
  type: 'select',
  useComponentProps() {
    const { t } = useDepartmentTranslation();
    const field = useField<Field>();
    const { fieldSchema: tableColumnSchema, collectionField } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = tableColumnSchema || schema;
    const fieldModeOptions = useFieldModeOptions({ fieldSchema: tableColumnSchema, collectionField });
    // const isAddNewForm = useIsAddNewForm();
    // const fieldMode = useFieldComponentName();
    const { dn } = useDesignable();
    return {
      title: t('Field component'),
      options: fieldModeOptions,
      value: 'Select',
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
        // if (isSubMode(fieldSchema) && isAddNewForm) {
        //   // @ts-ignore
        //   schema.default = null;
        //   fieldSchema.default = null;
        //   field?.setInitialValue?.(null);
        //   field?.setValue?.(null);
        // }

        void dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
};

export const showMainDepartmentSet = {
  name: 'showMainDepartmentSet',
  type: 'switch',
  useComponentProps() {
    const { t } = useDepartmentTranslation();
    const field = useField<Field>();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = useFieldSchema();
    const fieldSchema = tableColumnSchema || schema;
    const { dn } = useDesignable();
    return {
      title: t('Show main department set'),
      checked: fieldSchema['x-component-props']?.showMainDepartmentSet,
      onChange(checked) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['showMainDepartmentSet'] = checked;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps.showMainDepartmentSet = checked;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
};
