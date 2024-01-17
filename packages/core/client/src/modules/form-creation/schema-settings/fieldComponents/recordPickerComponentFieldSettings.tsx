import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useDesignable } from '../../../../schema-component';
import { useIsFieldReadPretty } from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { allowMultiple, fieldComponent, titleField } from './utils';

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
