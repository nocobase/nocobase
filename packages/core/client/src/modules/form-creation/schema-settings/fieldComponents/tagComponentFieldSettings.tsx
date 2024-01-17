import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useDesignable } from '../../../../schema-component';
import { useColorFields } from '../../../../schema-component/antd/table-v2/Table.Column.Designer';
import { enableLink, fieldComponent, titleField, useCollectionField } from './utils';

export const tagComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Tag',
  items: [
    fieldComponent,
    {
      name: 'tagColorField',
      type: 'select',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const collectionField = useCollectionField();
        const colorFieldOptions = useColorFields(collectionField?.target ?? collectionField?.targetCollection);
        return {
          title: t('Tag color field'),
          options: colorFieldOptions,
          value: field?.componentProps?.tagColorField,
          onChange(tagColorField) {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };

            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['tagColorField'] = tagColorField;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps.tagColorField = tagColorField;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    titleField,
    enableLink,
  ],
});
