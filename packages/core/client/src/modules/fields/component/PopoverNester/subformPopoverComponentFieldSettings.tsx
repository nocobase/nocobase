import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { useDesignable, useFieldModeOptions, useIsAddNewForm } from '../../../../schema-component';
import { isSubMode } from '../../../../schema-component/antd/association-field/util';
import { useIsFieldReadPretty } from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { useCollectionField } from '../../../../data-source';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { titleField } from '../Picker/recordPickerComponentFieldSettings';

const allowMultiple: any = {
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
    const { dn } = useDesignable();
    const isAddNewForm = useIsAddNewForm();
    const fieldMode = useFieldComponentName();
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

export const subformPopoverComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:PopoverNester',
  items: [fieldComponent, allowMultiple, titleField],
});
