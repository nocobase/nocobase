import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout, Input } from '@formily/antd';
import { Field } from '@formily/core';
import { observer, RecursionField, Schema, SchemaOptionsContext, useField, useForm } from '@formily/react';
import {
  APIClientProvider,
  DataBlockInitializer, FormProvider,
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { templates } from './templates';
import { DataSetBlockInitializer } from './DataSetBlockInitializer';
import { css } from '@emotion/css';
import JSON5 from 'json5';
import DataSetPreviewTable from './DataSetPreviewTable';
import { parseDataSetString } from './utils';
import { Button } from 'antd';
import { ChartBlockEngine } from './ChartBlockEngine';

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
  const compiler = useCompile();
  return (
    <DataSetBlockInitializer
      {...props}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        console.log(item, '===============');
        const dataSource = Object.keys(JSON5.parse(item.data_set_value)[0]).map(key => {
          return {
            label: key,
            value: key,
          };
        });
        let values = await FormDialog({ title: t('Create chart block'), width: 1200 }, () => {
          const [dataSet, setDataSet] = useState(parseDataSetString(item?.data_set_value));
          const form = useForm();
          const [previewMetaData, setPreviewMetaData] = useState(null);
          const previewChart = useCallback(() => {
            form.validate().then(() => {
              console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
              const renderComponent = templates.get(form.values.chartType)?.renderComponent;
              const result = {
                renderComponent,
                dataSetMetaData: {
                  dataSetMetaData: item,
                  chartConfig: form.values,
                },
              };
              setPreviewMetaData(result);
              console.log(result, 'form.values');
            });
          }, [form.values]);

          return (
            <APIClientProvider apiClient={api}>
              <SchemaComponentOptions
                scope={options.scope}
                components={{ ...options.components }}
              >
                <section className={
                  css`
                    display: flex;
                  `
                }>
                  {/*  left*/}
                  <div className={
                    css`
                      flex: 1
                    `
                  }>
                    <FormProvider form={form}>
                      <FormLayout layout={'vertical'}>
                        <SchemaComponent
                          scope={{ dataSource }}
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
                                    label: template.title,
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
                    </FormProvider>
                  </div>
                  {/*  right*/}
                  <div className={
                    css`
                      flex: 1
                    `
                  }>
                    {/*DataSet Preview*/}
                    <h4>DataSet Preview:</h4>
                    <DataSetPreviewTable dataSet={dataSet} />
                    <div className={
                      css`
                        display: flex;
                        gap: 10px;
                      `
                    }>
                      <h4>
                        Chart Preview:
                      </h4>
                      <Button
                        onClick={() => {
                          previewChart();
                        }
                        }
                      >
                        refresh
                      </Button>
                    </div>
                    {/*  Chart Preview*/}
                    {
                      previewMetaData
                      &&
                      <>
                        <SchemaComponent
                          schema={{
                            properties: {
                              chartPreview: {
                                type: 'void',
                                'x-decorator': 'CardItem',
                                'x-component': 'ChartBlockEngine',
                                'title': `${previewMetaData?.dataSetMetaData?.title ?? ''}`,
                                'x-component-props': {
                                  renderComponent: previewMetaData.renderComponent,
                                  chartBlockMetaData: previewMetaData.dataSetMetaData,
                                },
                              },
                            },
                          }}
                        />
                      </>
                    }
                  </div>
                </section>
              </SchemaComponentOptions>
            </APIClientProvider>
          );
        }).open({
          initialValues: {},
        });
        if (values) {
          //聚合chartOptions
          values = {
            dataSetMetaData: item,
            chartConfig: values,
          };
          // const a = {
          //   chartType: 'Pie',
          //   Pie: {
          //     'dimension': 'year',
          //     'metric': [
          //       'year',
          //       'value',
          //     ],
          //     'chartConfig': '{\n  "appendPadding": 10,\n  "radius": 0.9,\n  "label": {\n    "type": "inner",\n    "offset": "-30%",\n    "content": "{{({percent}) => `${(percent * 100).toFixed(0)}%`}}",\n    "style": {\n      "fontSize": 14,\n      "textAlign": "center"\n    }\n  },\n  "interactions": [\n    {\n      "type": "element-active"\n    }\n  ]\n}',
          //   },
          // };
          const renderComponent = templates.get(values.chartConfig.chartType)?.renderComponent;
          console.log(values, '===============================================');
          insert({
            type: 'void',
            'x-designer': 'ChartBlockEngine.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'ChartBlockEngine',
            'title': `${values?.dataSetMetaData?.title ?? ''}`,
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
