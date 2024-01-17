import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useDesignable } from '../../../../schema-component';
import { fieldComponent, titleField } from './utils';

export const fileManagerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:FileManager',
  items: [
    fieldComponent,
    {
      name: 'quickUpload',
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
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
    },
    {
      name: 'selectFile',
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
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
    },
    titleField,
  ],
});
