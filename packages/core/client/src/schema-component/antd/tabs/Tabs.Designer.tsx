import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../..';
import { GeneralSchemaDesigner, SchemaSettingsDivider, SchemaSettingsModalItem, SchemaSettingsRemove } from '../../../';

export const TabsDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettingsModalItem
        key="edit"
        title={t('Edit')}
        schema={
          {
            type: 'object',
            title: t('Edit tab'),
            properties: {
              title: {
                title: t('Tab name'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        initialValues={{ title: field.title, icon: field.componentProps.icon }}
        onSubmit={({ title, icon }) => {
          const props = fieldSchema['x-component-props'] || {};
          fieldSchema.title = title;
          field.title = title;
          props.icon = icon;
          field.componentProps.icon = icon;
          fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
          fieldSchema['x-component-props'].icon = icon;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              title,
              ['x-component-props']: props,
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove />
    </GeneralSchemaDesigner>
  );
};
