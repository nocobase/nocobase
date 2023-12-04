import { FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { RecursionField, Schema, SchemaOptionsContext, observer, useField, useForm } from '@formily/react';
import {
  APIClientProvider,
  FormDialog,
  FormProvider,
  SchemaComponent,
  SchemaComponentOptions,
  css,
  useAPIClient,
  useCompile,
  useGlobalTheme,
  useSchemaInitializer,
} from '@nocobase/client';
import { Card } from 'antd';
import JSON5 from 'json5';
import React, { useContext, useEffect, useState } from 'react';
import { ChartBlockEngineMetaData } from './ChartBlockEngine';
import { jsonConfigDesc } from './ChartBlockEngineDesigner';
import { ChartQueryBlockInitializer, ChartQueryMetadata } from './ChartQueryBlockInitializer';
import DataSetPreviewTable from './DataSetPreviewTable';
import { lang } from './locale';
import { templates } from './templates';

export const Options = observer(
  (props) => {
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
  },
  { displayName: 'Options' },
);

interface ChartFormInterface {
  type: string;
  template: string;
  metric: string;
  dimension: string;
  category?: string;

  [key: string]: string;
}

export const ChartBlockInitializer = (props) => {
  const { insert } = useSchemaInitializer();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  const compile = useCompile();
  const { theme } = useGlobalTheme();

  return (
    <ChartQueryBlockInitializer
      {...props}
      componentType={'Charts'}
      onCreateBlockSchema={async ({ item: chartQueryMetadata }: { item: ChartQueryMetadata }) => {
        const dataSource = chartQueryMetadata?.fields.map((field) => {
          return {
            label: field.name,
            value: field.name,
          };
        });
        const values = await FormDialog(
          {
            okText: compile('{{t("Submit")}}'),
            title: lang('Create chart block'),
            width: 1200,
            bodyStyle: { background: 'var(--nb-box-bg)', maxHeight: '65vh', overflow: 'auto' },
          },
          function Com() {
            const form = useForm<ChartFormInterface>();
            const [chartBlockEngineMetaData, setChartBlockEngineMetaData] = useState<ChartBlockEngineMetaData>(null);
            useEffect(() => {
              const chartBlockEngineMetaData = {
                query: {
                  id: chartQueryMetadata?.id,
                },
                chart: form.values, //TODO
              };
              setChartBlockEngineMetaData(chartBlockEngineMetaData);
            }, [form.values.type]);
            return (
              <APIClientProvider apiClient={api}>
                <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
                  <section
                    className={css`
                      display: flex;
                      gap: 24px;
                    `}
                  >
                    {/*  left*/}
                    <Card
                      title={lang('Chart config')}
                      size={'default'}
                      className={css`
                        flex: 1;
                      `}
                    >
                      <FormProvider form={form}>
                        <FormLayout layout={'vertical'}>
                          <SchemaComponent
                            scope={{ dataSource, JSON5, jsonConfigDesc }}
                            components={{ Options }}
                            schema={{
                              properties: {
                                // title: {
                                //   title: lang('Chart title'),
                                //   'x-component': 'Input',
                                //   'x-decorator': 'FormItem',
                                // },
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
                    <div
                      className={css`
                        flex: 1;
                        min-width: 600px;
                      `}
                    >
                      <Card size={'default'} title={lang('Chart preview')}>
                        {/*  Chart Preview*/}
                        {chartBlockEngineMetaData && (
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
                        )}
                      </Card>
                      <Card
                        size={'default'}
                        title={lang('Data preview')}
                        className={css`
                          margin-top: 24px;
                          overflow: scroll;
                        `}
                      >
                        {/*Data preview*/}
                        {chartBlockEngineMetaData?.query?.id && (
                          <DataSetPreviewTable
                            queryId={chartBlockEngineMetaData?.query?.id}
                            fields={chartQueryMetadata?.fields}
                          />
                        )}
                      </Card>
                    </div>
                  </section>
                </SchemaComponentOptions>
              </APIClientProvider>
            );
          },
          theme,
        ).open({
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
