import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { Field } from '@formily/core';
import { observer, RecursionField, Schema, SchemaOptionsContext, useField, useForm } from '@formily/react';
import {
  DataBlockInitializer,
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { templates } from './templates';
import { ChartConfigurationOptions } from './ChartSchemaTemplates';

export const Options = observer((props) => {
  const form = useForm();
  const field = useField<Field>();
  const [s, setSchema] = useState(new Schema({}));
  useEffect(() => {
    form.clearFormGraph('options.*');
    if (form.values.chartType) {
      const template = templates.get(form.values.chartType);
      setSchema(new Schema(template.configurableProperties || {}));
    }
  }, [form.values.chartType]);
  return <RecursionField name={form.values.chartType || 'default'} schema={s} />;
});

export const ChartBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const { getCollectionFields, getCollection } = useCollectionManager();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  const compiler = useCompile()
  return (
    <DataBlockInitializer
      {...props}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const collectionFields = getCollectionFields(item.name);
        console.log(collectionFields,"==============");
        const computedFields = compiler(collectionFields
          ?.filter((field) => (field.type === 'double' || field.type === 'bigInt'))
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title ?? field?.name,
              value: field?.name,
            };
          }));
        const groupByFields = compiler(collectionFields
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title ?? field?.name,
              value: field?.name,
            };
          }));
        let values = await FormDialog(t('Create chart block'), () => {
          return (
            <SchemaComponentOptions
              scope={options.scope}
              components={{ ...options.components }}
            >
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  scope={{ computedFields: computedFields|| [],groupByFields:groupByFields }}
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
        }).open({
          initialValues: {},
        });
        if (values) {
          //聚合chartOptions
          const defaultChartOptions = templates.get(values.chartType)?.defaultChartOptions;
          values = {
            collectionName: item.name,
            ...values,
            chartOptions: {
              ...defaultChartOptions,
              ...(values?.chartOptions || {}),
            },
          };
          const renderComponent = templates.get(values.chartType)?.renderComponent;
          console.log(values);
          insert({
            type: 'void',
            'x-designer': 'ChartBlockEngine.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'ChartBlockEngine',
            'title':`${values?.chartOptions?.title??''}`,
            'x-component-props': {
              renderComponent: renderComponent,
              chartBlockMetaData: values,
            },
          });
        }
      }}
    />
  );
};
