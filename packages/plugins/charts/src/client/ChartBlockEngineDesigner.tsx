import { ISchema, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GeneralSchemaDesigner, SchemaComponent, SchemaComponentOptions,
  SchemaSettings,
  useAPIClient,
  useCollectionManager,
  useCompile,
  useDesignable,
} from '@nocobase/client';
import { FormLayout } from '@formily/antd';
import { Options } from './ChartBlockInitializer';
import { templates } from './templates';

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

export const ChartBlockEngineDesigner = () => {
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const compile = useCompile();
  const api = useAPIClient();
  const options = useContext(SchemaOptionsContext);
  const {chartBlockMetaData ,renderComponent} = fieldSchema?.['x-component-props']
  console.log(chartBlockMetaData);
  // TODO
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        components={{ ChartBlockEngineDesignerInitializer }}
        title={t('Edit chart block')}
        schema={
          {
            type: 'void',
            title: t('Edit chart'),
            'x-decorator': 'CardItem',
            'x-component': 'ChartBlockEngineDesignerInitializer',
            'x-component-props': {
              chartBlockMetaData,
              renderComponent,
            },
          } as ISchema
        }
        // {{ fetchData(api, { url: 'chartData:get' }) }}
        onSubmit={async (props) => {
          console.log(props);
          // field.title = compile(title);
          // field.componentProps.plot = plot;
          // const conf = compile(JSON.parse(config));
          // const fn = conf?.data;
          // if (typeof fn === 'function') {
          //   const result = fn.bind({ api })();
          //   if (result?.then) {
          //     result.then(data => {
          //       if (Array.isArray(data)) {
          //         field.componentProps.config.data = data;
          //       }
          //     });
          //   }
          // } else {
          //   field.componentProps.config = conf;
          // }
          // fieldSchema.title = title;
          // fieldSchema['x-component-props']['plot'] = plot;
          // fieldSchema['x-component-props']['config'] = JSON.parse(config);
          // dn.emit('patch', {
          //   schema: {
          //     title,
          //     'x-uid': fieldSchema['x-uid'],
          //     'x-component-props': fieldSchema['x-component-props'],
          //   },
          // });
          // dn.refresh();
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

export const ChartBlockEngineDesignerInitializer = (props) => {
  //传递哪个collection
  const {chartBlockMetaData ,renderComponent} = props
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  const { getCollectionFields } = useCollectionManager();
  const collectionFields = getCollectionFields(chartBlockMetaData.collectionName);
  const computedFields = collectionFields
    ?.filter((field) => (field.type === 'double' || field.type === 'bigInt'))
    ?.map((field) => {
      return {
        label: field.name,
        value: field.name,
      };
    });
  return (
    <SchemaComponentOptions
      scope={options.scope}
      components={{ ...options.components }}
    >
      <FormLayout layout={'vertical'}>
        <SchemaComponent
          scope={{ computedFields: computedFields || [] }}
          components={{ Options }}
          schema={{
            properties: {
              chartType: {
                title: t('Chart type'),
                required: true,
                'x-component': 'Select',
                'x-decorator': 'FormItem',
                enum: [...templates.values()].map((template) => {
                  return {
                    label: template.type,
                    value: template.type,
                  };
                }),
              },
              options: {
                type: 'void',
                'x-component': 'Options',
              },
            },
          }}
        />
      </FormLayout>
    </SchemaComponentOptions>
  );
};
