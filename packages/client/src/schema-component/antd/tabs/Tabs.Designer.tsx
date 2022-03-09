import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../..';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../';

export const TabsDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        title={t('Edit')}
        schema={
          {
            type: 'object',
            title: t('Edit tab'),
            properties: {
              title: {
                title: t('Tab name'),
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        initialValues={{ title: field.title }}
        onSubmit={({ title }) => {
          if (title) {
            fieldSchema.title = title;
            field.title = title;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
              },
            });
            dn.refresh();
          }
        }}
      />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};
