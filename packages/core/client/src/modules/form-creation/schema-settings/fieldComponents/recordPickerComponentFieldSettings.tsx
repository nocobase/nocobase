import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { useDesignable, useFieldModeOptions, useIsAddNewForm } from '../../../../schema-component';
import { isSubMode } from '../../../../schema-component/antd/association-field/util';
import {
  useIsFieldReadPretty,
  useTitleFieldOptions,
} from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { useCollectionField } from './utils';

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
        const fieldSchema = useFieldSchema();
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
            fieldSchema['x-component-props'] = field.componentProps;
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
    {
      name: 'allowAddNewData',
      type: 'switch',
      useVisible() {
        const isFieldReadPretty = useIsFieldReadPretty();
        return !isFieldReadPretty;
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, refresh, insertAdjacent } = useDesignable();
        return {
          title: t('Allow add new data'),
          checked: fieldSchema['x-add-new'] as boolean,
          onChange(allowAddNew) {
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
                'x-designer': 'Action.Designer',
                'x-component': 'Action',
                'x-decorator': 'ACLActionProvider',
                'x-component-props': {
                  openMode: 'drawer',
                  type: 'default',
                  component: 'CreateRecordAction',
                },
              };
              insertAdjacent('afterBegin', addNewActionSchema);
            }
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            field['x-add-new'] = allowAddNew;
            fieldSchema['x-add-new'] = allowAddNew;
            schema['x-add-new'] = allowAddNew;
            dn.emit('patch', {
              schema,
            });
            refresh();
          },
        };
      },
    },
    allowMultiple,
    titleField,
  ],
});
