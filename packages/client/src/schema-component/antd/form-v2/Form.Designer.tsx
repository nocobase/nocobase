import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useDesignable } from '../../hooks';
import { useActionContext } from '../action';

export const FormDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const ctx = useFormBlockContext();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { visible } = useActionContext();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.ModalItem
        hidden={visible !== undefined}
        title={t('After successful submission')}
        initialValues={fieldSchema['x-decorator-props']?.['onSuccess']}
        schema={
          {
            type: 'object',
            title: t('After successful submission'),
            properties: {
              successMessage: {
                default: t('Submitted successfully!'),
                title: 'Pop-up message',
                'x-decorator': 'FormItem',
                'x-component': 'Input.TextArea',
                'x-component-props': {},
              },
              redirecting: {
                title: t('Then'),
                default: false,
                enum: [
                  { label: t('Stay on current page'), value: false },
                  { label: t('Redirect to'), value: true },
                ],
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                'x-component-props': {},
                'x-reactions': {
                  target: 'redirectTo',
                  fulfill: {
                    state: {
                      visible: '{{!!$self.value}}',
                    },
                  },
                },
              },
              redirectTo: {
                title: t('Link'),
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        onSubmit={(onSuccess) => {
          field.decoratorProps.onSuccess = onSuccess;
          fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
          fieldSchema['x-decorator-props']['onSuccess'] = onSuccess;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.Template componentName={ctx?.action ? 'RecordForm' : 'CreateForm'} collectionName={name} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export const ReadPrettyFormDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.Template componentName={'ReadPrettyForm'} collectionName={name} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
