import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
} from '../../../schema-settings';
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
  const api = useAPIClient();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettingsModalItem
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
              plot: {
                title: t('Chart type'),
                type: 'string',
                default: fieldSchema?.['x-component-props']?.plot,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-disabled': !!fieldSchema?.['x-component-props']?.plot,
              },
              config: {
                title: t('Chart config'),
                type: 'string',
                default: JSON.stringify(fieldSchema?.['x-component-props']?.config, null, 2),
                'x-decorator': 'FormItem',
                'x-component': 'Input.TextArea',
                'x-component-props': {
                  autoSize: { minRows: 8, maxRows: 16 },
                },
                'x-validator': validateJSON,
              },
            },
          } as ISchema
        }
        // {{ fetchData(api, { url: 'chartData:get' }) }}
        onSubmit={async ({ plot, title, config }) => {
          field.title = compile(title);
          field.componentProps.plot = plot;
          const conf = compile(JSON.parse(config));
          const fn = conf?.data;
          if (typeof fn === 'function') {
            const result = fn.bind({ api })();
            if (result?.then) {
              result
                .then((data) => {
                  if (Array.isArray(data)) {
                    field.componentProps.config.data = data;
                  }
                })
                .catch(console.error);
            }
          } else {
            field.componentProps.config = conf;
          }
          fieldSchema.title = title;
          fieldSchema['x-component-props']['plot'] = plot;
          fieldSchema['x-component-props']['config'] = JSON.parse(config);
          dn.emit('patch', {
            schema: {
              title,
              'x-uid': fieldSchema['x-uid'],
              'x-component-props': fieldSchema['x-component-props'],
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
