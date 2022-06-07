import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useCompile, useDesignable } from '../../hooks';

const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON.parse(value);
      if(!isNaN(val)) {
        return false;
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }}}`,
  message: '{{t("Invalid JSON format")}}',
};

export const G2PlotDesigner = () => {
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const compile = useCompile();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        title={t('Edit chart')}
        schema={
          {
            type: 'object',
            title: t('Edit chart'),
            properties: {
              title: {
                title: t('Chart title'),
                type: 'string',
                default: fieldSchema.title,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
              config: {
                title: t('Chart config'),
                type: 'string',
                default: JSON.stringify(fieldSchema?.['x-component-props']?.config, null, 2),
                'x-decorator': 'FormItem',
                'x-component': 'Input.TextArea',
                'x-component-props': {
                  autoSize: true,
                },
                'x-validator': validateJSON,
              },
            },
          } as ISchema
        }
        onSubmit={({ title, config }) => {
          field.title = compile(title);
          fieldSchema.title = title;
          field.componentProps.config = compile(JSON.parse(config));
          fieldSchema['x-component-props']['config'] = JSON.parse(config);
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-component-props': fieldSchema['x-component-props'],
            },
          });
          dn.refresh();
        }}
      />
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
