import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { Field } from '@formily/core';
import { observer, RecursionField, Schema, SchemaOptionsContext, useField, useForm } from '@formily/react';
import {
  APIClientProvider,
  FormProvider,
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient, useRequest,
} from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { templates } from './templates';
import { ChartQueryBlockInitializer, ChartQueryMetadata } from './ChartQueryBlockInitializer';
import { css } from '@emotion/css';
import JSON5 from 'json5';
import DataSetPreviewTable from './DataSetPreviewTable';
import { parseDataSetString } from './utils';
import { ChartBlockEngine, ChartBlockEngineMetaData } from './ChartBlockEngine';
import { ChartSvgs } from './ChartSvgs';

export const Options = observer((props) => {
  const form = useForm();
  const field = useField<Field>();
  const [s, setSchema] = useState(new Schema({}));
  const [chartType, setChartType] = useState(form.values.chartType);
  useEffect(() => {
    // form.clearFormGraph('options.*');
    setChartType(form?.values?.chartType);
    if (chartType !== form?.values?.chartType)
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
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  return (
    <ChartQueryBlockInitializer
      {...props}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item: chartQueryMetadata }: { item: ChartQueryMetadata }) => {
        console.log(chartQueryMetadata);
        const dataSource = chartQueryMetadata?.fields.map(field => {
          return {
            label: field.name,
            value: field.name,
          };
        });
        let values = await FormDialog({ title: t('Create chart block'), width: 1200 }, () => {
          const form = useForm();
          const [chartBlockEngineMetaData, setChartBlockEngineMetaData] = useState<ChartBlockEngineMetaData>(null);
          useEffect(() => {
            const chartBlockEngineMetaData = {
              chartQueryMetadata,
              chartConfig: form.values,
            };
            setChartBlockEngineMetaData(chartBlockEngineMetaData);
          }, [form.values.chartType]);
          console.log(chartBlockEngineMetaData);
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
                                    iconId:template.iconId,
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
                      flex: 1;
                      min-width: 600px;
                    `
                  }>
                    {/*DataSet Preview*/}
                    <h4>QueryData Preview:</h4>
                    {
                      chartBlockEngineMetaData?.chartQueryMetadata?.id
                      &&
                      <DataSetPreviewTable queryId={chartBlockEngineMetaData?.chartQueryMetadata?.id} />
                    }
                    {
                      (chartBlockEngineMetaData?.chartConfig?.chartType !== undefined && chartBlockEngineMetaData?.chartConfig?.chartType !== 'DataSetPreviewTable')
                      &&
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
                    }
                    {/*  Chart Preview*/}
                    {
                      chartBlockEngineMetaData
                      &&
                      <>
                        <SchemaComponent
                          schema={{
                            properties: {
                              chartPreview: {
                                type: 'void',
                                'x-decorator': 'CardItem',
                                'x-component': 'ChartBlockEngine',
                                'x-component-props': {
                                  chartBlockEngineMetaData,
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
          const chartBlockEngineMetaData = {
            chartQueryMetadata,
            chartConfig: values,
          };
          insert({
            type: 'void',
            'x-designer': 'ChartBlockEngine.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'ChartBlockEngine',
            'x-component-props': {
              chartBlockEngineMetaData,
            },
          });
        }
      }}
    />
  );
};
