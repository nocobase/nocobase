import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useDesignable } from '../../../../schema-component';
import { useIsFormReadPretty } from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { allowMultiple, fieldComponent } from './utils';

export const subformComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Nester',
  items: [
    fieldComponent,
    allowMultiple,
    {
      name: 'allowDissociate',
      type: 'switch',
      useVisible() {
        return !useIsFormReadPretty();
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, refresh } = useDesignable();
        return {
          title: t('Allow dissociate'),
          checked: fieldSchema['x-component-props']?.allowDissociate !== false,
          onChange(value) {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            field.componentProps = field.componentProps || {};

            fieldSchema['x-component-props'].allowDissociate = value;
            field.componentProps.allowDissociate = value;

            schema['x-component-props'] = fieldSchema['x-component-props'];
            dn.emit('patch', {
              schema,
            });
            refresh();
          },
        };
      },
    },
  ],
});
