import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { Field, FormPath } from '@formily/core';
import { observer, RecursionField, Schema, SchemaOptionsContext, useField, useForm } from '@formily/react';
import {
  APIClientProvider,
  FormProvider, i18n,
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
import { ChartBlockEngine, ChartBlockEngineMetaData } from './ChartBlockEngine';
import { Card } from 'antd';
import { lang, useChartsTranslation } from './locale';
import { jsonConfigDesc } from './ChartBlockEngineDesigner';

export const Options = observer((props) => {
  const form = useForm<ChartFormInterface>();
  const field = useField<Field>();
  const [s, setSchema] = useState(new Schema({}));
  const [chartType, setChartType] = useState(form.values.type);
  useEffect(() => {
    // form.clearFormGraph('options.*');
    setChartType(form?.values?.type);
    if (chartType !== form?.values?.type) {
      form.clearFormGraph('options.*');
    }
    if (form.values.type) {
      const template = templates.get(form.values.type);
      setSchema(new Schema(template.configurableProperties || {}));
    }
  }, [form.values.type]);
  return <RecursionField schema={s} />;
});


interface ChartFormInterface {
  type: string;
  template: string;
  metric: string;
  dimension: string;
  category?: string;

  [key: string]: string;
}

export const ChartBlockInitializer = (props) => {
  const { insert } = props;
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  return (
    <ChartQueryBlockInitializer
      {...props}
      componentType={'Kanban'}
      onCreateBlockSchema={async ({ item: chartQueryMetadata }: { item: ChartQueryMetadata }) => {
        const dataSource = chartQueryMetadata?.fields.map(field => {
          return {
            label: field.name,
            value: field.name,
          };
        });
        let values = await FormDialog({
          title: lang('Create chart block'),
          width: 1200,
          bodyStyle: { background: '#f0f2f5', maxHeight: '65vh', overflow: 'auto' },
        }, () => {
          const form = useForm<ChartFormInterface>();
          const [chartBlockEngineMetaData, setChartBlockEngineMetaData] = useState<ChartBlockEngineMetaData>(null);
          useEffect(() => {
            const chartBlockEngineMetaData = {
              query: {
                id: chartQueryMetadata?.id,
              },
              chart: form.values,//TODO
            };
            setChartBlockEngineMetaData(chartBlockEngineMetaData);
          }, [form.values.type]);
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
                  <Card title={lang('Chart config')} size={'small'} className={
                    css`
                      flex: 1
                    `
                  }>
                    <FormProvider form={form}>
                      <FormLayout layout={'vertical'}>
                        <SchemaComponent
                          scope={{ dataSource, JSON5, jsonConfigDesc }}
                          components={{ Options }}
                          schema={{
                            properties: {
                              title: {
                                title: lang('Chart title'),
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                              },
                              type: {
                                title: lang('Chart type'),
                                required: true,
                                'x-component': 'CustomSelect',
                                'x-decorator': 'FormItem',
                                enum: [...templates.values()].map((template) => {
                                  return {
                                    title: template.title,
                                    key: template.type,
                                    description: template.description,
                                    group: template.group,
                                    iconId: template.iconId,
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
                  </Card>
                  {/*  right*/}
                  <div className={
                    css`
                      flex: 1;
                      min-width: 600px;
                    `
                  }>
                    <Card size='small' title={lang('Chart preview')}>
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
                    </Card>
                    <Card size='small' title={lang('Data preview')} className={css`margin-top: 8px;
                      overflow: scroll`}>
                      {/*Data preview*/}
                      {
                        chartBlockEngineMetaData?.query?.id
                        &&
                          <DataSetPreviewTable queryId={chartBlockEngineMetaData?.query?.id}
                                               fields={chartQueryMetadata?.fields} />
                      }
                    </Card>
                  </div>
                </section>
              </SchemaComponentOptions>
            </APIClientProvider>
          );
        }).open({
      initialValues: {},
    });
      if (values) {
      const chartBlockEngineMetaData: ChartBlockEngineMetaData = {
      query: {
      id: chartQueryMetadata.id,
    },
      chart: values,
    };
      insert({
      type: 'void',
      title: values?.title,
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
