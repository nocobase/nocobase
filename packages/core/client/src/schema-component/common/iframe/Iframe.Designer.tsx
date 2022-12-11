import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useDesignable } from '../../hooks';

export const IframeDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();

  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        title={t('Edit iframe')}
        schema={
          {
            type: 'object',
            title: t('Edit chart'),
            properties: {
              url: {
                title: t('URL'),
                type: 'string',
                default: fieldSchema?.['x-component-props']?.['url'],
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                required: true,
              },
              height: {
                title: t('Height'),
                type: 'string',
                default: fieldSchema?.['x-component-props']?.height || '60vh',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                required: true,
              },
            },
          } as ISchema
        }
        // {{ fetchData(api, { url: 'chartData:get' }) }}
        onSubmit={async ({ url, height }) => {
          field.componentProps.url = url;
          field.componentProps.height = height;
          const componentProps = fieldSchema['x-component-props'] || {};
          componentProps['url'] = url;
          componentProps['height'] = height;
          fieldSchema['x-component-props'] = componentProps;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-component-props': componentProps,
            },
          });
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
