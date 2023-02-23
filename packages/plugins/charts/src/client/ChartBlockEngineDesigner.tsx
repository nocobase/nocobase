import { ISchema, SchemaOptionsContext, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  APIClientProvider,
  FormProvider,
  GeneralSchemaDesigner,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaSettings,
  useAPIClient,
  useCompile,
  useDesignable,
} from '@nocobase/client';
import { FormDialog, FormLayout } from '@formily/antd';
import { Options } from './ChartBlockInitializer';
import { templates } from './templates';
import { css } from '@emotion/css';
import JSON5 from 'json5';
import DataSetPreviewTable from './DataSetPreviewTable';
import { Button } from 'antd';
import { parseDataSetString } from './utils';

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
  const fieldSchema = useFieldSchema();
  const { previewMetaData } = fieldSchema?.['x-component-props'];
  return (
    <GeneralSchemaDesigner>
      <ChartBlockEngineDesignerInitializer
        previewMetaData={previewMetaData}
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
    const { previewMetaData, effects } = props;
    const chartBlockMetaData = previewMetaData.dataSetMetaData
    const { chartConfig, dataSetMetaData } = chartBlockMetaData;
    const { t } = useTranslation();
    const options = useContext(SchemaOptionsContext);
    const { dn } = useDesignable();
    const fieldSchema = useFieldSchema();
    const api = useAPIClient();
    const field = useField();
    const compiler = useCompile();

    return (
      <SchemaSettings.Item
        onClick={async () => {
          FormDialog({ title: 'Edit chart block', width: 1200 }, (form) => {
            const [dataSet, setDataSet] = useState(parseDataSetString(dataSetMetaData?.data_set_value));
            const [previewMetaData, setPreviewMetaData] = useState(null);
            useEffect(() => {
              const result = {
                dataSetMetaData: {
                  dataSetMetaData: dataSetMetaData,
                  chartConfig: form.values,
                }
              };
              setPreviewMetaData(result);
            }, [form.values.chartType]);

            const dataSource = Object.keys(JSON5.parse(dataSetMetaData.data_set_value)[0]).map(key => {
              return {
                label: key,
                value: key,
              };
            });

            return (
              <APIClientProvider apiClient={api}>
                <SchemaComponentOptions
                  scope={options.scope}
                  components={{ ...options.components }}
                >
                  <section className={
                    css`
                      display: flex;
                      gap: 16px;
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
                            scope={{ dataSource, JSON5 }}
                            components={{ Options }}
                            schema={{
                              properties: {
                                chartType: {
                                  title: t('Chart type'),
                                  required: true,
                                  'x-component': 'CustomSelect',
                                  'x-decorator': 'FormItem',
                                  enum: [...templates.values()].map((template) => {
                                    return {
                                      label: template.title,
                                      value: template.type,
                                      group: template.group,
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
                                    previewMetaData
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
          })
            .open({
              initialValues: chartConfig,//reset before chartBlockMetaData
            })
            .then((values) => {
              //patch updates
              values = {
                dataSetMetaData:{
                  dataSetMetaData,
                  chartConfig: values,
                }
              };
              field.componentProps.previewMetaData=values
              fieldSchema['x-component-props'].previewMetaData = values;
              //
              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  'x-component-props': fieldSchema['x-component-props'],
                },
              });
              dn.refresh();
            });
        }}
      >
        {props.children || props.title || 'Edit chart block'}
      </SchemaSettings.Item>
    )
      ;
  }
;
